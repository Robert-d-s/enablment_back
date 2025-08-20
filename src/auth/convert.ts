import { UnauthorizedException } from '@nestjs/common';
import { UserProfileDto } from './dto/user-profile.dto';
import type { UserProfile, JwtPayload } from './types';

/**
 * Ensure the input is a UserProfileDto. Accepts:
 * - a UserProfileDto instance (returns as-is)
 * - a plain UserProfile (id/email/role) -> constructs UserProfileDto
 * - a JwtPayload -> constructs UserProfileDto
 * Throws UnauthorizedException if input is missing or invalid.
 */
export function ensureUserProfileDto(input: unknown): UserProfileDto {
  if (!input) {
    throw new UnauthorizedException('No user present in request');
  }

  // Already a DTO (best-effort check)
  if (input instanceof UserProfileDto) return input;

  const obj = input as Partial<UserProfile & JwtPayload>;
  if (
    typeof obj.id === 'number' &&
    typeof obj.email === 'string' &&
    typeof obj.role === 'string'
  ) {
    // prefer fromJwtPayload when tokenVersion present
    if (typeof (obj as JwtPayload).tokenVersion === 'number') {
      return UserProfileDto.fromJwtPayload(obj as JwtPayload);
    }
    return UserProfileDto.fromUser({
      id: obj.id,
      email: obj.email,
      role: obj.role,
    } as UserProfile);
  }

  throw new UnauthorizedException('Invalid user object in request');
}

/**
 * Safe variant: returns UserProfileDto or undefined when input is missing/invalid.
 */
export function getUserProfileDto(input: unknown): UserProfileDto | undefined {
  if (!input) return undefined;
  if (input instanceof UserProfileDto) return input;

  const obj = input as Partial<UserProfile & JwtPayload>;
  if (
    typeof obj.id === 'number' &&
    typeof obj.email === 'string' &&
    typeof obj.role === 'string'
  ) {
    if (typeof (obj as JwtPayload).tokenVersion === 'number') {
      return UserProfileDto.fromJwtPayload(obj as JwtPayload);
    }
    return UserProfileDto.fromUser({
      id: obj.id,
      email: obj.email,
      role: obj.role,
    } as UserProfile);
  }
  return undefined;
}
