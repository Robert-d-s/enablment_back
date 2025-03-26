import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Request,
  Get,
  ClassSerializerInterceptor,
  UseInterceptors,
  UseGuards,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { Request as ExpressRequest, Response } from 'express';
import { UserRole } from '../user/user-role.enum';
import { AuthGuard } from './auth.guard';

// Interface to define our authenticated request type
interface RequestWithUser extends ExpressRequest {
  user: {
    id: number;
    email: string;
    role: UserRole;
  };
}

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.signIn(
      signInDto.email,
      signInDto.password,
    );

    // Set HTTP-only cookie with the JWT token
    response.cookie('auth_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    // Return success without exposing the token in the response body
    return {
      success: true,
      user: {
        email: signInDto.email,
      },
    };
  }

  @Post('signup')
  async signUp(
    @Body() signUpDto: SignUpDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.signUp(signUpDto.email, signUpDto.password);
    const result = await this.authService.signIn(
      signUpDto.email,
      signUpDto.password,
    );

    // Set HTTP-only cookie with the JWT token
    response.cookie('auth_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    // Return success without exposing the token in the response body
    return {
      success: true,
      user: {
        email: signUpDto.email,
      },
    };
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  getProfile(@Request() req: RequestWithUser) {
    return new UserProfileDto(req.user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) response: Response) {
    // Clear the auth cookie
    response.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    });

    return { success: true };
  }
}
