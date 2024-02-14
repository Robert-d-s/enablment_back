import { Query, Resolver } from '@nestjs/graphql';
import { IssueService } from './issue.service';
import { Issue } from './issue.model';

@Resolver(() => Issue)
export class IssueResolver {
  constructor(private issueService: IssueService) {}

  @Query(() => [Issue])
  async issues(): Promise<Issue[]> {
    const issues = await this.issueService.all();
    // Transform or assert the type as necessary
    return issues as Issue[];
  }
}
