# Issue Query Security Fix

## Problem Statement

The original issues GraphQL query had **critical security and performance issues**:

### Security Risk

- **Data Leakage**: The `issues` query fetched ALL issues from the database without any authorization filtering
- **Access Control Bypass**: A Collaborator assigned to "Team A" could inspect browser network responses and see sensitive details (titles, assignees, descriptions) from "Team B", "Team C", etc.
- **Privacy Violation**: Issue data from teams a user doesn't belong to was exposed

### Performance Issue

- **Database Overload**: As the Issue table grows to thousands/tens of thousands of records, the query becomes extremely slow
- **Network Bottleneck**: Large amounts of unnecessary data sent to every user
- **Client-side Filtering Inefficiency**: All filtering was done in the browser after downloading all data

## Solution Implemented

### 1. Authentication-Based Authorization in Resolver

**File**: `src/issue/issue.resolver.ts`

```typescript
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
```

**Key Changes:**

- Added `@Context() context: GqlContext` to access authenticated user
- Added authentication check that throws `UnauthorizedException` if no user
- Calls new `getIssuesForUser()` method instead of `all()`

### 2. Team-Based Filtering in Service Layer

**File**: `src/issue/issue.service.ts`

```typescript
async getIssuesForUser(
  userId: number,
  page: number = 1,
  limit: number = 50,
): Promise<{ issues: Issue[]; total: number; hasNext: boolean }> {
  // Get user's team memberships
  const userTeams = await this.prisma.userTeam.findMany({
    where: { userId },
    select: { teamId: true },
  });

  const teamIds = userTeams.map((ut) => ut.teamId);

  if (teamIds.length === 0) {
    // User has no team assignments - return empty
    return { issues: [], total: 0, hasNext: false };
  }

  // Build secure where clause filtering by user's teams
  const whereClause = {
    OR: [
      // Direct team assignment on issues
      { teamKey: { in: teamIds } },
      // Issues from projects belonging to user's teams
      { project: { teamId: { in: teamIds } } },
    ],
  };

  // Execute filtered query with pagination
  const [issues, total] = await Promise.all([
    this.prisma.issue.findMany({
      where: whereClause,
      skip: (page - 1) * limit,
      take: Math.min(limit, 100),
      include: { labels: true },
      orderBy: { updatedAt: 'desc' },
    }),
    this.prisma.issue.count({ where: whereClause }),
  ]);

  return {
    issues,
    total,
    hasNext: (page - 1) * limit + limit < total,
  };
}
```

**Key Security Features:**

- **Team Membership Validation**: Queries `UserTeam` table to get user's authorized teams
- **Database-Level Filtering**: Uses Prisma `WHERE` clause to filter at database level (not client-side)
- **Dual Team Filtering**: Checks both direct issue team assignment AND project team assignment
- **Empty Result for Unassigned Users**: Users with no team assignments see no issues
- **Maintained Pagination**: Keeps efficient pagination while adding security

### 3. Admin Override Query

For administrators who need to see all issues:

```typescript
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
```

## Security Benefits

### ✅ Data Protection

- **Zero Data Leakage**: Users can only see issues from their assigned teams
- **Network Inspection Safe**: Browser network tab only shows authorized issues
- **Role-Based Access**: Regular users get filtered data, admins can access `allIssues` query

### ✅ Performance Improvements

- **Database Efficiency**: Queries only filter and return relevant issues
- **Reduced Network Traffic**: No unnecessary data transmission
- **Scalable**: Performance remains good as issue count grows

### ✅ Maintains Functionality

- **Pagination Preserved**: All existing pagination logic works
- **Frontend Compatible**: No breaking changes to existing frontend code
- **Caching Compatible**: Can still be cached per user

## Database Schema Dependencies

The solution leverages existing schema relationships:

```prisma
model UserTeam {
  userId Int
  teamId String
  user   User @relation(fields: [userId], references: [id])
  team   Team @relation(fields: [teamId], references: [id])
}

model Issue {
  teamKey   String?
  project   Project @relation(fields: [projectId], references: [id])
}

model Project {
  teamId String
  team   Team @relation(fields: [teamId], references: [id])
}
```

## Testing

Comprehensive test coverage was added in `src/issue/issue.service.spec.ts`:

- ✅ Users with no team assignments get empty results
- ✅ Issues are filtered by user's team memberships
- ✅ Pagination parameters are respected
- ✅ Limit is capped at 100 items per page
- ✅ `hasNext` pagination flag calculated correctly

## Migration Impact

### Frontend Changes Required: **NONE**

- The `GET_ISSUES` query continues to work exactly the same
- Frontend filtering logic remains as fallback for UI responsiveness
- No GraphQL schema breaking changes

### Backend Changes: **Minimal**

- Original `all()` method preserved for admin use
- New `getIssuesForUser()` method added alongside
- Authentication already handled by existing `AuthGuard`

## Backwards Compatibility

- ✅ Existing `all()` method preserved and used by admin `allIssues` query
- ✅ Same response format (`PaginatedIssueResponse`)
- ✅ Same pagination parameters (`page`, `limit`)
- ✅ Frontend code requires no changes

This fix transforms a **critical security vulnerability** into a **secure, performant, team-based authorization system** while maintaining full backwards compatibility.
