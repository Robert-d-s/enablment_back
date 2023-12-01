import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from './auth.module';
import { Reflector } from '@nestjs/core';

import { UserService } from '../user/user.service';
import { UserRole } from '@prisma/client';

// @Injectable()
// export class AuthGuard implements CanActivate {
//   constructor(private jwtService: JwtService, private reflector: Reflector) {}

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
//       context.getHandler(),
//       context.getClass(),
//     ]);

//     if (isPublic) {
//       // 💡 See this condition
//       return true;
//     }

//     let request = context.switchToHttp().getRequest();

//     // Needed for authenticaiton with graphql to work.
//     if (!request) {
//       request = context.getArgs()[2].req;
//     }

//     const token = this.extractTokenFromHeader(request);

//     if (!token) {
//       console.log('No token found in request headers');
//       throw new UnauthorizedException();
//     }
//     try {
//       const payload = await this.jwtService.verifyAsync(token, {
//         secret: jwtConstants.secret,
//       });
//       request['user'] = payload;
//     } catch (error) {
//       console.log('Error verifying token:', error);
//       throw new UnauthorizedException();
//     }
//     return true;
//   }

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    let request = context.switchToHttp().getRequest();

    if (!request) {
      request = context.getArgs()[2].req;
    }

    const token = this.extractTokenFromHeader(request);
    if (!token) {
      console.log('No token found in request headers');
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });
      request['user'] = payload;

      // Role Checking
      const requiredRoles = this.reflector.get<UserRole[]>(
        'roles',
        context.getHandler(),
      );
      if (requiredRoles) {
        const user = await this.userService.findOne(payload.email);
        return user && requiredRoles.includes(user.role);
      }

      return true;
    } catch (error) {
      console.log('Error verifying token:', error);
      throw new UnauthorizedException();
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    console.log('Extracted token from header:', token);
    return type === 'Bearer' ? token : undefined;
  }
}

// @Injectable()
// export class RolesGuard implements CanActivate {
//   constructor(private reflector: Reflector, private userService: UserService) {}

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const requiredRoles = this.reflector.get<UserRole[]>(
//       'roles',
//       context.getHandler(),
//     );
//     if (!requiredRoles) {
//       return true;
//     }

//     const request = context.switchToHttp().getRequest();
//     const user = await this.userService.findOne(request.user.email);

//     return user && requiredRoles.includes(user.role);
//   }
// }
