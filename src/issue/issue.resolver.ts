import { Query, Resolver, Args, Int, ObjectType, Field } from '@nestjs/graphql';
import { IssueService } from './issue.service';
import { Issue } from './issue.model';

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
  ): Promise<PaginatedIssueResponse> {
    const result = await this.issueService.all(page, limit);
    return {
      issues: result.issues as Issue[],
      total: result.total,
      hasNext: result.hasNext,
    };
  }
}
