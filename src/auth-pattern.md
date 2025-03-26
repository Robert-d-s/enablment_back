# Authentication Implementation in NestJS

## Overview

We've implemented explicit guard application across our NestJS application, using a modular approach that avoids global guards. This approach makes authentication requirements explicit and avoids circular dependency issues.

## Core Components

1. **AuthGuard**

   - Custom guard that validates JWT tokens
   - Requires JwtService, Reflector, UserService, and ConfigService

2. **Explicit Guard Application**

   - Guards are applied at the class level for all resolvers requiring authentication
   - Some specific methods (like login/signup) have no guard

3. **Module Dependencies**
   - Each module that uses AuthGuard must import the necessary dependencies:
     - AuthModule (for JwtService, AuthGuard)
     - UserModule (for UserService)
     - ConfigModule (for ConfigService)

## Implementation Pattern

For each module with resolvers requiring authentication:

```typescript
@Module({
  imports: [
    PrismaModule,
    AuthModule, // Provides AuthGuard and JwtService
    UserModule, // Provides UserService
    ConfigModule, // Provides ConfigService
  ],
  providers: [SomeService, SomeResolver],
})
export class SomeModule {}
```

For resolvers requiring authentication:

```typescript
@Resolver()
@UseGuards(AuthGuard) // Applied at class level
export class SomeResolver {
  constructor(private someService: SomeService) {}

  // All methods in this resolver require authentication
  @Query(() => [SomeType])
  async someQuery(): Promise<SomeType[]> {
    // ...
  }
}
```

For public resolvers (like authentication):

```typescript
@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  // No guard, implicitly public
  @Mutation(() => AuthResponse)
  async login(/*...*/): Promise<AuthResponse> {
    // ...
  }

  // Explicitly guarded method
  @Query(() => UserProfileDto)
  @UseGuards(AuthGuard)
  async me(@CurrentUser() user: any): Promise<UserProfileDto> {
    // ...
  }
}
```

## Handling Circular Dependencies

For modules with circular dependencies:

```typescript
@Module({
  imports: [
    // Other imports...
    ConfigModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
  ],
  // ...
})
export class SomeModule {}
```

## Benefits

1. **Clarity**: Authentication requirements are explicit in the code
2. **Maintainability**: Easy to see which endpoints require authentication
3. **Flexibility**: Different guards can be applied to different resolvers
4. **Avoids Issues**: Prevents issues with metadata reflection and circular dependencies
