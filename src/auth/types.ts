import { UserRole } from '@prisma/client';

export interface JwtPayload {
  email: string;
  sub: number;
  id: number;
  role: UserRole;
  tokenVersion: number;
  [key: string]: unknown;
}

// Public shape for user profile used across auth code. Matches the minimal
// subset returned in many places: id, email and role.
export interface UserProfile {
  id: number;
  email: string;
  role: UserRole;
}
