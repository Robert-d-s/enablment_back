import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const Roles = (...roles: UserRole[]): ReturnType<typeof SetMetadata> =>
  SetMetadata('roles', roles);
