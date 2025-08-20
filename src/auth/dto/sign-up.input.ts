import { InputType } from '@nestjs/graphql';
import { BaseAuthInput } from './base-auth.input';

@InputType()
export class SignUpInput extends BaseAuthInput {}
