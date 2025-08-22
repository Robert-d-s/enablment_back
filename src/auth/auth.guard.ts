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
import { TokenBlacklistService } from '../common/services/token-blacklist.service';
import { JwtCacheService } from './jwt-cache.service';
import { IS_PUBLIC_KEY } from './public.decorator';
import { PrismaService } from '../prisma/prisma.service';

import type { JwtPayload } from './types';

type RequestWithUser = Request & { user?: UserProfileDto };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @InjectPinoLogger(AuthGuard.name) private readonly logger: PinoLogger,
    private jwtService: JwtService,
    private reflector: Reflector,
    private configService: ConfigService,
    private tokenBlacklistService: TokenBlacklistService,
    private jwtCacheService: JwtCacheService,
    private prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.debug('AuthGuard: Proceeding with authentication check');

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      this.logger.debug(
        'AuthGuard: Endpoint is public, skipping authentication',
      );
      return true;
    }

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

    const cachedResult = this.jwtCacheService.getCachedVerification(
      request,
      token,
    );
    if (cachedResult) {
      const cacheStats = this.jwtCacheService.getCacheStats(request);
      this.logger.debug(
        { cacheAge: cacheStats.cacheAge },
        'Using cached JWT verification result',
      );
      request.user = cachedResult.user;
      return this.checkUserRoles(context, cachedResult.payload);
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
      this.logger.debug({ payload }, 'Token verified successfully.');

      // Check if token is blacklisted by jti (JWT ID)
      if (
        payload.jti &&
        this.tokenBlacklistService.isTokenBlacklisted(payload.jti)
      ) {
        this.logger.warn(
          { userId: payload.id, jti: payload.jti },
          'Attempted access with blacklisted token',
        );
        throw new UnauthorizedException({
          message: 'Token has been revoked',
          code: 'TOKEN_REVOKED',
        });
      }

      const currentUser = await this.prismaService.user.findUnique({
        where: { id: payload.id },
        select: { tokenVersion: true, role: true },
      });

      if (!currentUser) {
        this.logger.warn(
          { userId: payload.id },
          'Token contains non-existent user ID',
        );
        throw new UnauthorizedException({
          message: 'Invalid token - user not found',
          code: 'USER_NOT_FOUND',
        });
      }

      if (currentUser.tokenVersion !== payload.tokenVersion) {
        this.logger.warn(
          {
            userId: payload.id,
            tokenVersion: payload.tokenVersion,
            currentVersion: currentUser.tokenVersion,
          },
          'Token version mismatch - token invalidated due to role change',
        );
        throw new UnauthorizedException({
          message: 'Token has been invalidated due to role change',
          code: 'TOKEN_VERSION_MISMATCH',
        });
      }

      if (currentUser.role !== payload.role) {
        this.logger.warn(
          {
            userId: payload.id,
            tokenRole: payload.role,
            currentRole: currentUser.role,
          },
          'Role mismatch detected - token role differs from current user role',
        );
        throw new UnauthorizedException({
          message: 'Token role is outdated',
          code: 'ROLE_MISMATCH',
        });
      }

      const user = UserProfileDto.fromJwtPayload(payload);
      request.user = user;

      this.jwtCacheService.setCachedVerification(request, token, payload, user);

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

    this.logger.debug('No token found in Authorization header.');
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
