# JWT Request-Level Caching

## Overview

The authentication system now includes request-level JWT verification caching to improve performance when the same token is verified multiple times within a single HTTP request.

## How It Works

### Problem Solved

In GraphQL applications, it's common for multiple resolvers/guards to check authentication within a single request. Without caching, this results in:

- Multiple expensive JWT verification operations
- Redundant cryptographic signature validations
- Unnecessary blacklist checks
- Increased request latency

### Solution

The `JwtCacheService` provides request-scoped caching that:

1. Caches JWT verification results on the request object
2. Reuses cached results for subsequent authentication checks within the same request
3. Automatically expires when the request ends
4. Maintains security by still performing blacklist checks

### Performance Benefits

- **Reduced CPU usage**: Avoids redundant JWT signature verification
- **Lower latency**: Subsequent auth checks are nearly instantaneous
- **Better throughput**: Server can handle more concurrent requests
- **Logging insights**: Cache hit/miss statistics for monitoring

## Architecture

### Components

- `JwtCacheService`: Manages request-level JWT caching
- `AuthGuard`: Updated to use caching service
- Request interface extensions: Type-safe cache storage

### Cache Lifecycle

1. **First auth check**: JWT verified, result cached on request
2. **Subsequent checks**: Cache hit, immediate return
3. **Request end**: Cache automatically garbage collected

### Security Considerations

- Cache is scoped to individual requests only
- Blacklist checks still performed on first verification
- No cross-request data leakage
- Token revocation immediately effective

## Usage

The caching is transparent and requires no changes to existing code:

```typescript
// Multiple guards/resolvers in same request
@UseGuards(AuthGuard) // First verification - cache miss
@Resolver()
class SomeResolver {
  @UseGuards(AuthGuard) // Second verification - cache hit
  @Query()
  someQuery() {}

  @UseGuards(AuthGuard) // Third verification - cache hit
  @Query()
  anotherQuery() {}
}
```

## Monitoring

Cache statistics are logged for debugging:

```
DEBUG: Using cached JWT verification result (cacheAge: 45ms)
```

## Configuration

No configuration required - caching is enabled by default and optimally tuned for typical GraphQL request patterns.
