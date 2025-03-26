import { Args, Mutation, Query, Resolver, Context } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { UserProfileDto } from './dto/user-profile.dto';
import { SignInInput } from './dto/sign-in.input';
import { SignUpInput } from './dto/sign-up.input';
import { AuthResponse } from './dto/auth-response';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import { LogoutResponse } from './dto/logout-response';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => AuthResponse)
  async login(
    @Args('input', { nullable: true }) signInInput?: SignInInput,
    @Args('email', { nullable: true }) email?: string,
    @Args('password', { nullable: true }) password?: string,
    @Context() context?: any,
  ): Promise<AuthResponse> {
    const emailToUse = signInInput?.email || email;
    const passwordToUse = signInInput?.password || password;

    if (!emailToUse || !passwordToUse) {
      throw new Error('Email and password are required');
    }

    const result = await this.authService.signIn(emailToUse, passwordToUse);

    // Set HTTP-only cookie with the JWT token
    if (context && context.req && context.res) {
      context.res.cookie('auth_token', result.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });
    }

    return {
      ...result,
      user: new UserProfileDto({
        email: emailToUse,
      }),
    };
  }

  @Mutation(() => AuthResponse)
  async signup(
    @Args('input', { nullable: true }) signUpInput?: SignUpInput,
    @Args('email', { nullable: true }) email?: string,
    @Args('password', { nullable: true }) password?: string,
    @Context() context?: any,
  ): Promise<AuthResponse> {
    const emailToUse = signUpInput?.email || email;
    const passwordToUse = signUpInput?.password || password;

    if (!emailToUse || !passwordToUse) {
      throw new Error('Email and password are required');
    }

    await this.authService.signUp(emailToUse, passwordToUse);
    const result = await this.authService.signIn(emailToUse, passwordToUse);

    // Set HTTP-only cookie with the JWT token
    if (context && context.req && context.res) {
      context.res.cookie('auth_token', result.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });
    }

    return {
      ...result,
      user: new UserProfileDto({
        email: emailToUse,
      }),
    };
  }

  @Mutation(() => LogoutResponse)
  async logout(@Context() context: any): Promise<LogoutResponse> {
    if (context && context.res) {
      context.res.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        path: '/',
      });
    }

    return { success: true };
  }

  @Query(() => UserProfileDto)
  @UseGuards(AuthGuard)
  async me(@CurrentUser() user: any): Promise<UserProfileDto> {
    return new UserProfileDto(user);
  }
}
