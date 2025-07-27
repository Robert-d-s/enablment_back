import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserProfileDto } from './dto/user-profile.dto';

export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): UserProfileDto | undefined => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.user as UserProfileDto | undefined;
  },
);

/**
 * Helper function to extract current user from GraphQL context
 * Use this in resolvers that don't use @CurrentUser() decorator
 */
export function getCurrentUser(
  context: ExecutionContext,
): UserProfileDto | undefined {
  const ctx = GqlExecutionContext.create(context);
  return ctx.getContext().req.user as UserProfileDto | undefined;
}
