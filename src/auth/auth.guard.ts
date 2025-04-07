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

// Define the structure of your JWT payload
export interface JwtPayload {
  email: string;
  sub: number;
  id: number;
  role: UserRole;
  [key: string]: unknown;
}

// Extend the Express Request interface globally or locally
// Locally: Define an interface extending Request
interface RequestWithUser extends Request {
  user?: JwtPayload; // Make user optional initially
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private userService: UserService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      this.logger.log(`Route is public, skipping auth.`);
      return true;
    }
    this.logger.log(`Route is NOT public, proceeding with auth.`);

    // Get the request object, correctly typed
    const request = this.getRequest(context);

    if (!request) {
      this.logger.error('No request object found in context.');
      throw new UnauthorizedException('No request found');
    }

    const token = this.extractToken(request);

    if (!token) {
      this.logger.warn('No authentication token found.');
      throw new UnauthorizedException('No authentication token found');
    }

    try {
      // Verify the token and strongly type the payload
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
      this.logger.log(
        `Token verified successfully. Payload: ${JSON.stringify(payload)}`,
      );
      request.user = payload;

      // Pass the email from the verified payload
      return await this.checkUserRoles(context, payload.email);
    } catch (error) {
      // Improved error logging and handling
      this.logger.error(
        `Token verification failed: ${error.message}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (error instanceof Error) {
        // Type guard for Error
        if (error.name === 'TokenExpiredError') {
          throw new UnauthorizedException({
            message: 'Access token expired',
            code: 'TOKEN_EXPIRED',
          });
        }
        if (error.name === 'JsonWebTokenError') {
          throw new UnauthorizedException({
            message: 'Invalid access token',
            code: 'INVALID_TOKEN',
          });
        }
      }
      // Fallback for unexpected errors or non-Error types thrown
      throw new UnauthorizedException({
        message: `Authentication failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        code: 'AUTH_FAILED',
      });
    }
  }

  private getRequest(context: ExecutionContext): RequestWithUser | undefined {
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest<RequestWithUser>();
    } else if (context.getType<string>() === 'graphql') {
      try {
        const gqlCtx = GqlExecutionContext.create(context);
        // Explicitly cast the context's request object
        const req = gqlCtx.getContext().req as RequestWithUser | undefined;
        if (!req) {
          this.logger.error(
            'Request object missing within GqlExecutionContext context.',
          );
        }
        return req;
      } catch (err) {
        this.logger.error(
          'Failed to get request from GqlExecutionContext',
          err,
        );
        return undefined;
      }
    }
    this.logger.warn(
      `Unsupported execution context type: ${context.getType()}`,
    );
    return undefined;
  }

  // Extract token logic remains the same, uses the base Request type is fine
  private extractToken(request: Request): string | undefined {
    const authHeader = request.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const headerToken = authHeader.substring(7);
      if (headerToken) {
        this.logger.log('Token extracted from Authorization header.');
        return headerToken;
      }
    }

    // Fallback to Cookie (Consider removing if header is reliable)
    if (request.cookies && request.cookies['auth_token']) {
      this.logger.warn('Token extracted from "auth_token" cookie (fallback).');
      return request.cookies['auth_token'];
    }

    this.logger.log('No token found in header or cookies.');
    return undefined;
  }

  // checkUserRoles remains the same
  private async checkUserRoles(
    context: ExecutionContext,
    userEmail: string,
  ): Promise<boolean> {
    const requiredRoles = this.reflector.get<UserRole[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) {
      return true;
    }

    const user = await this.userService.findOne(userEmail);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!requiredRoles.includes(user.role)) {
      this.logger.warn(
        `User ${userEmail} with role ${
          user.role
        } denied access to resource requiring roles: ${requiredRoles.join(
          ', ',
        )}`,
      );
      throw new ForbiddenException(
        'Insufficient permissions to access this resource',
      );
    }
    this.logger.log(`User ${userEmail} granted access with role ${user.role}.`);
    return true;
  }
}
