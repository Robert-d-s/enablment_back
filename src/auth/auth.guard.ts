import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
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
    const handler = context.getHandler();
    const controllerClass = context.getClass();
    console.log(
      `AuthGuard activated for: ${controllerClass?.name}.${handler?.name}`,
    );
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      handler,
      controllerClass,
    ]);
    console.log(
      `IS_PUBLIC (${controllerClass?.name}.${handler?.name}): ${isPublic}`,
    );
    if (isPublic) {
      console.log(`Route is public, skipping auth.`);
      return true;
    }
    console.log(`Route is NOT public, proceeding with auth.`);
    const ctx = context.switchToHttp();
    const graphqlCtx = GqlExecutionContext.create(context);
    const request = ctx.getRequest<Request>() || graphqlCtx.getContext().req;

    if (!request) {
      throw new UnauthorizedException('No request found');
    }

    // Extract token from cookie instead of header
    const token = this.extractTokenFromCookie(request);

    if (!token) {
      throw new UnauthorizedException('No auth token found in cookies');
    }

    try {
      // Verify the token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      console.log('auth payload contains', payload);

      interface JwtPayload {
        email: string;
        id: number;
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

  private extractTokenFromCookie(request: Request): string | undefined {
    if (!request) {
      console.log('AuthGuard: Request object is missing');
      return undefined;
    }

    console.log('AuthGuard: Cookies object:', request.cookies);

    if (!request.cookies) {
      console.log('AuthGuard: No cookies found in request');
      return undefined;
    }

    // Get the token from the auth_token cookie
    const token = request.cookies['auth_token'];
    console.log('AuthGuard: Cookie token found:', !!token);

    return token;
  }
}
