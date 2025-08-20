import { UserRole } from '@prisma/client';

export interface JwtPayload {
  email: string;
  sub: number;
  id: number;
  role: UserRole;
  tokenVersion: number;
  [key: string]: unknown;
}

export interface UserProfile {
  id: number;
  email: string;
  role: UserRole;
}
