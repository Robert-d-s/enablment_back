import { UserRole } from '@prisma/client';

export interface JwtPayload {
  email: string;
  sub: number;
  id: number;
  role: UserRole;
  tokenVersion: number;
  jti?: string; // JWT ID for blacklisting (optional for backward compatibility)
  [key: string]: unknown;
}

export interface UserProfile {
  id: number;
  email: string;
  role: UserRole;
}
