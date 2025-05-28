// src/auth/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserProfileDto } from './dto/user-profile.dto';
import { JwtPayload } from './auth.guard';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): UserProfileDto | undefined => {
    const ctx = GqlExecutionContext.create(context);
    const payload = ctx.getContext().req.user as JwtPayload | undefined;

    if (!payload) {
      return undefined;
    }
    return new UserProfileDto({
      id: payload.id,
      email: payload.email,
      role: payload.role,
    });
  },
);
