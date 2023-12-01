import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';

import { User, UserRole } from '@prisma/client';

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

  // async signUp(email, password) {
  //   // Check if the email already exists
  //   const existingUser = await this.userService.findOne(email);
  //   if (existingUser) {
  //     throw new ConflictException('Email already exists.');
  //   }

  //   const salt = bcrypt.genSaltSync(10);
  //   const hash = bcrypt.hashSync(password, salt);

  //   return this.userService.create(email, hash);
  // }

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
