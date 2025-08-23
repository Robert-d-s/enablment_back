import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import {
  PASSWORD_REGEX,
  PASSWORD_ERROR_MESSAGE,
} from '../constants/password.constants';

@ValidatorConstraint({ name: 'passwordComplexity', async: false })
export class PasswordComplexityConstraint
  implements ValidatorConstraintInterface
{
  validate(password: string): boolean {
    if (!password) {
      return false;
    }

    // Use the same regex as frontend for consistency
    return PASSWORD_REGEX.test(password);
  }

  defaultMessage(): string {
    return PASSWORD_ERROR_MESSAGE;
  }
}

export function IsPasswordComplex(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: PasswordComplexityConstraint,
    });
  };
}
