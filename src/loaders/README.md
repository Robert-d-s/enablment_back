# DataLoader Implementation for GraphQL N+1 Query Problem

## Problem Overview

In the original implementation, we had a typical N+1 query problem:

1. When retrieving the list of users with `UserService.all()`, we were eagerly loading all related entities:
   - All teams for each user
   - All projects for each team
   - All rates for each team

This resulted in multiple queries even when the client didn't need this data, causing unnecessary database load.

## Solution: DataLoader Pattern

We've implemented a DataLoader-based approach to solve this problem:

1. **Batch Loading**: Consolidates many individual loading requests into a single batch
2. **Caching**: Caches results per request to prevent duplicate fetching
3. **Just-in-time Loading**: Only loads data when it's actually requested

## Implementation Details

### 1. DataLoader Classes

- **TeamLoader**: Loads teams by ID or user ID
- **ProjectLoader**: Loads projects by ID or team ID
- **RateLoader**: Loads rates by ID or team ID

Each loader implements batch loading to prevent the N+1 query problem.

### 2. Resolver Structure

We've refactored our resolvers to use the `@ResolveField` decorator:

- **UserResolver**: Only loads basic user data by default
  - Teams are loaded only when requested via a field resolver
- **TeamResolver**: Only loads basic team data by default
  - Projects are loaded only when requested via a field resolver
  - Rates are loaded only when requested via a field resolver

### 3. Performance Benefits

With this implementation:

- **Query Efficiency**: A query for just user data will only fetch users
- **Batching**: A query for users with teams will make just 2 queries instead of N+1
- **On-demand Loading**: Data is only loaded when requested in the GraphQL query

## Usage Example

When a client executes this query:

```graphql
query {
  users {
    id
    email
    role
  }
}
```

Only user data is loaded - no teams, projects, or rates.

When a client executes this query:

```graphql
query {
  users {
    id
    email
    role
    teams {
      id
      name
    }
  }
}
```

User data is loaded first, then all required teams are loaded in a single batch.

## Maintenance Notes

- Each DataLoader is scoped to the current request to ensure proper caching behavior
- Loaders should be created for any relationship that could cause N+1 query problems
- The pattern is extensible - additional loaders can be added as needed
