import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { firstValueFrom } from 'rxjs';
import { ExceptionFactory } from '../../common/exceptions';
import { PrismaService } from '../../prisma/prisma.service';
import { SanitizationService } from '../../common/services/sanitization.service';

export type TransactionClient = Parameters<
  Parameters<PrismaService['$transaction']>[0]
>[0];

interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

interface LabelNode {
  id: string;
  name: string;
  color: string;
  parentId?: string | null;
}

interface IssueNode {
  id: string;
  title: string;
  description?: string;
  state?: {
    id: string;
    name: string;
    color: string;
    type: string;
  };
  assignee?: {
    id: string;
    name: string;
  };
  project?: {
    id: string;
    name: string;
  };
  team?: {
    id: string;
    key: string;
    name: string;
  };
  priority?: number;
  priorityLabel?: string;
  identifier: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  labels?: {
    nodes: LabelNode[];
  };
}

interface IssuesResponse {
  issues: {
    pageInfo: PageInfo;
    nodes: IssueNode[];
  };
}

@Injectable()
export class IssueSyncService {
  private linearApiKey: string;

  constructor(
    @InjectPinoLogger(IssueSyncService.name)
    private readonly logger: PinoLogger,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly sanitizationService: SanitizationService,
  ) {
    this.linearApiKey = this.configService.get<string>('LINEAR_KEY') || '';
    if (!this.linearApiKey) {
      this.logger.error('LINEAR_KEY not found in environment');
    }
  }

  private async fetchFromLinear<T>(query: string, variables = {}): Promise<T> {
    try {
      this.logger.debug(
        { query: query.substring(0, 100) + '...', variables },
        'Sending query to Linear API',
      );

      if (!this.linearApiKey) {
        throw ExceptionFactory.businessLogicError(
          'Linear API query',
          'LINEAR_KEY is not configured',
        );
      }

      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.linear.app/graphql',
          { query, variables },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: this.linearApiKey,
            },
            timeout: 10000,
          },
        ),
      );

      if (response.data.errors) {
        const errorMsg = response.data.errors
          .map((e: { message: string }) => e.message)
          .join(', ');
        this.logger.error(
          { graphqlErrors: response.data.errors },
          'GraphQL errors from Linear API',
        );
        throw ExceptionFactory.externalServiceError(
          'Linear',
          'GraphQL query',
          new Error(`GraphQL errors: ${errorMsg}`),
        );
      }

      this.logger.debug('Successfully fetched data from Linear API');
      return response.data.data;
    } catch (error) {
      if (error.response) {
        this.logger.error(
          {
            status: error.response.status,
            data: error.response.data,
            config: error.config,
          },
          'Linear API Error - Response Received',
        );
      } else if (error.request) {
        this.logger.error(
          { err: error },
          'Linear API Error - No response received',
        );
      } else {
        this.logger.error(
          { err: error },
          'Linear API Error - Request Setup Failed',
        );
      }
      throw error;
    }
  }

  async synchronize(tx: TransactionClient): Promise<void> {
    this.logger.info('Fetching issues from Linear');

    const pageSize = 100;
    let hasNextPage = true;
    let endCursor = null;
    let processedCount = 0;

    while (hasNextPage) {
      const query = `
        query ($cursor: String) {
          issues(first: ${pageSize}, after: $cursor) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              id
              title
              description
              state {
                id
                name
                color
                type
              }
              assignee {
                id
                name
              }
              project {
                id
                name
              }
              team {
                id
                key
                name
              }
              priority
              priorityLabel
              identifier
              dueDate
              createdAt
              updatedAt
              labels {
                nodes {
                  id
                  name
                  color
                }
              }
            }
          }
        }
      `;

      try {
        const data: IssuesResponse = await this.fetchFromLinear<IssuesResponse>(
          query,
          { cursor: endCursor },
        );
        const pageInfo: PageInfo = data.issues.pageInfo;
        const issues = data.issues.nodes;

        processedCount += issues.length;
        this.logger.debug(
          `Processing ${issues.length} issues (total: ${processedCount}, cursor: ${endCursor})`,
        );

        hasNextPage = pageInfo.hasNextPage;
        endCursor = pageInfo.endCursor;

        for (const issue of issues) {
          await this.processIssue(tx, issue);
        }
      } catch (error) {
        this.logger.error({ err: error }, 'Error synchronizing issues batch');
        throw error;
      }

      if (hasNextPage) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    this.logger.info('Issue synchronization step completed');
  }

  private async processIssue(
    tx: TransactionClient,
    issue: IssueNode,
  ): Promise<void> {
    if (issue.project && issue.team) {
      const projectExists = await tx.project.findUnique({
        where: { id: issue.project.id },
        select: { id: true },
      });

      if (projectExists) {
        try {
          // Sanitize all input data from Linear
          const sanitizedIssue =
            this.sanitizationService.sanitizeLinearIssue(issue);

          const issueData = {
            id: sanitizedIssue.id,
            title: sanitizedIssue.title,
            createdAt: sanitizedIssue.createdAt || new Date(),
            updatedAt: sanitizedIssue.updatedAt || new Date(),
            projectId: sanitizedIssue.project?.id || issue.project.id,
            projectName: sanitizedIssue.project?.name || 'Unknown Project',
            priorityLabel: sanitizedIssue.priorityLabel || 'No priority',
            identifier: sanitizedIssue.identifier,
            assigneeName: sanitizedIssue.assignee?.name || 'No assignee',
            state: sanitizedIssue.state?.name || 'Triage',
            teamKey: sanitizedIssue.team?.id || issue.team.id,
            teamName: sanitizedIssue.team?.name || 'Unknown Team',
            dueDate: sanitizedIssue.dueDate?.toISOString() || null,
          };

          await tx.issue.upsert({
            where: { id: sanitizedIssue.id },
            update: issueData,
            create: issueData,
          });

          await this.processIssueLabels(tx, issue);
        } catch (sanitizationError) {
          this.logger.error(
            {
              err: sanitizationError,
              issueId: issue.id,
              issueTitle: issue.title?.substring(0, 50) + '...',
            },
            'Failed to sanitize issue data from Linear',
          );
          throw sanitizationError;
        }
      } else {
        this.logger.warn(
          { issueId: issue.id, projectId: issue.project.id },
          'Skipping issue: Project not found',
        );
      }
    }
  }

  private async processIssueLabels(
    tx: TransactionClient,
    issue: IssueNode,
  ): Promise<void> {
    if (issue.labels && issue.labels.nodes.length > 0) {
      await tx.label.deleteMany({
        where: { issueId: issue.id },
      });

      for (const label of issue.labels.nodes) {
        try {
          // Sanitize each label individually
          const sanitizedLabel = {
            id: this.sanitizationService.sanitizeId(label.id),
            name: this.sanitizationService.sanitizeString(label.name, 100),
            color: this.sanitizationService.sanitizeColor(label.color),
            parentId: label.parentId
              ? this.sanitizationService.sanitizeId(label.parentId)
              : null,
            issueId: this.sanitizationService.sanitizeId(issue.id),
          };

          await tx.label.create({
            data: sanitizedLabel,
          });
        } catch (sanitizationError) {
          this.logger.error(
            {
              err: sanitizationError,
              labelId: label.id,
              labelName: label.name,
              issueId: issue.id,
            },
            'Failed to sanitize label data from Linear',
          );
          // Continue processing other labels even if one fails
        }
      }
    }
  }
}
