import { InputType } from '@nestjs/graphql';
import { BaseAuthInput } from './base-auth.input';

@InputType()
export class SignUpInput extends BaseAuthInput {
  // Inherits email and password with validation from BaseAuthInput
  // Future: Could add signup-specific fields like confirmPassword, firstName, etc.
}
