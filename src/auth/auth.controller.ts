import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Request,
  Get,
  SetMetadata,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { Request as ExpressRequest } from 'express';
import { UserRole } from '../user/user-role.enum';

// Interface to define our authenticated request type
interface RequestWithUser extends ExpressRequest {
  user: {
    id: number;
    email: string;
    role: UserRole;
  };
}

export const Public = () => SetMetadata('isPublic', true);

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @Public()
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  @Post('signup')
  @Public()
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto.email, signUpDto.password);
  }

  @Get('profile')
  getProfile(@Request() req: RequestWithUser) {
    return new UserProfileDto(req.user);
  }
}
