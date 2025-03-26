import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';

import { User } from '@prisma/client';
import { UserRole } from '../user/user-role.enum';

import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async signIn(username: string, pass: string) {
    try {
      const user = await this.userService.findOne(username);

      // Check if the user exists
      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Check if the password is correct
      const isMatch = await bcrypt.compare(pass, user.password);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const payload = { email: user.email, id: user.id };
      return {
        access_token: await this.jwtService.signAsync(payload),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred during sign in',
      );
    }
  }

  async signUp(email: string, password: string): Promise<User> {
    try {
      const userCount = await this.userService.count();
      const role = userCount === 0 ? UserRole.ADMIN : UserRole.PENDING;

      if (userCount > 0) {
        const existingUser = await this.userService.findOne(email);
        if (existingUser) {
          throw new ConflictException('Email already exists');
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      return this.userService.create(email, hashedPassword, role);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred during sign up',
      );
    }
  }
}
