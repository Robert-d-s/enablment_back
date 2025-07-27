import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { UserProfileDto } from './dto/user-profile.dto';

export interface JwtPayload {
  email: string;
  sub: number;
  id: number;
  role: UserRole;
  [key: string]: unknown;
}

interface RequestWithUser extends Request {
  user?: UserProfileDto; // Changed from JwtPayload to UserProfileDto
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @InjectPinoLogger(AuthGuard.name) private readonly logger: PinoLogger,
    private jwtService: JwtService,
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.debug('AuthGuard: Proceeding with authentication check');

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
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
      this.logger.debug({ payload }, 'Token verified successfully.');

      // Convert JWT payload directly to UserProfileDto
      request.user = UserProfileDto.fromJwtPayload(payload);

      return this.checkUserRoles(context, payload);
    } catch (error) {
      this.logger.error({ err: error }, 'Token verification failed');

      if (error instanceof Error) {
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
        const req = gqlCtx.getContext().req as RequestWithUser | undefined;
        if (!req) {
          this.logger.error(
            'Request object missing within GqlExecutionContext context.',
          );
        }
        return req;
      } catch (err) {
        this.logger.error(
          { err },
          'Failed to get request from GqlExecutionContext',
        );
        return undefined;
      }
    }
    this.logger.warn(
      `Unsupported execution context type: ${context.getType()}`,
    );
    return undefined;
  }

  private extractToken(request: Request): string | undefined {
    const authHeader = request.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const headerToken = authHeader.substring(7);
      if (headerToken) {
        this.logger.debug('Token extracted from Authorization header.');
        return headerToken;
      }
    }

    if (request.cookies && request.cookies['auth_token']) {
      this.logger.warn('Token extracted from "auth_token" cookie (fallback).');
      return request.cookies['auth_token'];
    }

    this.logger.debug('No token found in header or cookies.');
    return undefined;
  }

  private checkUserRoles(
    context: ExecutionContext,
    userPayload: JwtPayload,
  ): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) {
      return true;
    }

    if (!requiredRoles.includes(userPayload.role)) {
      this.logger.warn(
        { email: userPayload.email, userRole: userPayload.role, requiredRoles },
        'User denied access due to insufficient role',
      );
      throw new ForbiddenException(
        'Insufficient permissions to access this resource',
      );
    }
    this.logger.debug(
      { email: userPayload.email, role: userPayload.role },
      'User granted access based on role.',
    );
    return true;
  }
}
