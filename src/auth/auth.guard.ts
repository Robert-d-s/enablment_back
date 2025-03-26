import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from './auth.module';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { UserService } from '../user/user.service';
import { UserRole } from '@prisma/client';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private userService: UserService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const ctx = context.switchToHttp();
    const graphqlCtx = GqlExecutionContext.create(context);
    const request = ctx.getRequest<Request>() || graphqlCtx.getContext().req;

    if (!request) {
      throw new UnauthorizedException('No request found');
    }
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token found in request headers');
    }

    try {
      // Verify the token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      console.log('auth payload contains', payload);

      interface JwtPayload {
        email: string;
        sub: string;
      }
      (request as Request & { user: JwtPayload }).user = payload as JwtPayload;

      // Check for roles
      return await this.checkUserRoles(context, payload.email);
    } catch (error) {
      // Enhance and rethrow the error with custom error information
      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException({
          message: error.message,
          code: 'UNAUTHORIZED', // Custom error code
        });
      }
      if (error instanceof ForbiddenException) {
        throw new ForbiddenException({
          message: error.message,
          code: 'FORBIDDEN', // Custom error code
        });
      }
      // If it's not one of the above exceptions, rethrow the original error
      throw error;
    }
  }

  private async checkUserRoles(
    context: ExecutionContext,
    userEmail: string,
  ): Promise<boolean> {
    const requiredRoles = this.reflector.get<UserRole[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) {
      return true; // No specific roles required
    }

    const user = await this.userService.findOne(userEmail);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        'Insufficient permissions to access this resource',
      );
    }

    return true; // User has the required role
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    if (!request || !request.headers.authorization) {
      return undefined;
    }
    const [type, token] = request.headers.authorization.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
