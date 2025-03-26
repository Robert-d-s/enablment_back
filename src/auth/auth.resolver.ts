import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { UserProfileDto } from './dto/user-profile.dto';
import { SignInInput } from './dto/sign-in.input';
import { SignUpInput } from './dto/sign-up.input';
import { AuthResponse } from './dto/auth-response';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => AuthResponse)
  async login(
    @Args('input', { nullable: true }) signInInput?: SignInInput,
    @Args('email', { nullable: true }) email?: string,
    @Args('password', { nullable: true }) password?: string,
  ): Promise<AuthResponse> {
    const emailToUse = signInInput?.email || email;
    const passwordToUse = signInInput?.password || password;

    if (!emailToUse || !passwordToUse) {
      throw new Error('Email and password are required');
    }

    const result = await this.authService.signIn(emailToUse, passwordToUse);

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
  ): Promise<AuthResponse> {
    const emailToUse = signUpInput?.email || email;
    const passwordToUse = signUpInput?.password || password;

    if (!emailToUse || !passwordToUse) {
      throw new Error('Email and password are required');
    }

    await this.authService.signUp(emailToUse, passwordToUse);
    const result = await this.authService.signIn(emailToUse, passwordToUse);

    return {
      ...result,
      user: new UserProfileDto({
        email: emailToUse,
      }),
    };
  }

  @Query(() => UserProfileDto)
  @UseGuards(AuthGuard)
  async me(@CurrentUser() user: any): Promise<UserProfileDto> {
    return new UserProfileDto(user);
  }
}
