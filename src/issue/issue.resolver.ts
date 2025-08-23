import {
  Query,
  Resolver,
  Args,
  Int,
  ObjectType,
  Field,
  Context,
} from '@nestjs/graphql';
import { IssueService } from './issue.service';
import { Issue } from './issue.model';
import { GqlContext } from '../app.module';
import { UnauthorizedException } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@ObjectType()
export class PaginatedIssueResponse {
  @Field(() => [Issue])
  issues: Issue[];

  @Field(() => Int)
  total: number;

  @Field(() => Boolean)
  hasNext: boolean;
}

@Resolver(() => Issue)
export class IssueResolver {
  constructor(private issueService: IssueService) {}

  @Query(() => PaginatedIssueResponse)
  async issues(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number,
    @Context() context: GqlContext,
  ): Promise<PaginatedIssueResponse> {
    const currentUser = context.req.user;
    if (!currentUser) {
      throw new UnauthorizedException(
        'User must be authenticated to view issues',
      );
    }

    const result = await this.issueService.getIssuesForUser(
      currentUser.id,
      page,
      limit,
    );
    return {
      issues: result.issues as Issue[],
      total: result.total,
      hasNext: result.hasNext,
    };
  }

  /**
   * Admin-only query to get all issues without team filtering
   */
  @Roles(UserRole.ADMIN)
  @Query(() => PaginatedIssueResponse)
  async allIssues(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number,
  ): Promise<PaginatedIssueResponse> {
    const result = await this.issueService.all(page, limit);
    return {
      issues: result.issues as Issue[],
      total: result.total,
      hasNext: result.hasNext,
    };
  }
}
