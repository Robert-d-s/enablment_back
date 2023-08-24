import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Request,
  Get,
  UseGuards,
  SetMetadata,
} from '@nestjs/common';
import { AuthService } from './auth.service';

export const Public = () => SetMetadata('isPublic', true);

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @Public()
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  @Post('signup')
  @Public()
  signUp(@Body() signUpDto: Record<string, string>) {
    return this.authService.signUp(signUpDto.email, signUpDto.password);
  }

  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
