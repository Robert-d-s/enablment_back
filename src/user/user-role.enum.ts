import { registerEnumType } from '@nestjs/graphql';

export enum UserRole {
  ADMIN = 'ADMIN',
  ENABLER = 'ENABLER',
  COLLABORATOR = 'COLLABORATOR',
  PENDING = 'PENDING',
}

registerEnumType(UserRole, {
  name: 'UserRole',
});
