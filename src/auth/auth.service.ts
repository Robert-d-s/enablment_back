import {
  Injectable,
  UnauthorizedException,
  ConflictException,
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

  async signIn(username, pass) {
    const user = await this.userService.findOne(username);

    // Check if the user exists
    if (!user) {
      throw new UnauthorizedException({ error: 'Invalid email or password.' });
    }

    // Check if the password is correct
    if (!bcrypt.compareSync(pass, user.password)) {
      throw new UnauthorizedException({ error: 'Invalid email or password.' });
    }

    const payload = { email: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async signUp(email: string, password: string): Promise<User> {
    const userCount = await this.userService.count();
    const role = userCount === 0 ? UserRole.ADMIN : UserRole.PENDING;

    if (userCount > 0) {
      const existingUser = await this.userService.findOne(email);
      if (existingUser) {
        throw new ConflictException('Email already exists.');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    return this.userService.create(email, hashedPassword, role);
  }
}
