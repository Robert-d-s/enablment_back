import { Injectable } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { UserService as UserCoreService } from './user-core.service';
import { UserSecurityService } from './services/user-security.service';
import { UserTeamService } from './services/user-team.service';
import { UserRoleService } from './services/user-role.service';
import { UserQueryArgs } from './user.resolver';

/**
 * UserService Facade - Maintains backward compatibility while delegating to specialized services
 *
 * This facade allows existing code to continue working while we gradually refactor
 * consumers to use the specialized services directly.
 */
@Injectable()
export class UserService {
  constructor(
    private readonly userCoreService: UserCoreService,
    private readonly userSecurityService: UserSecurityService,
    private readonly userTeamService: UserTeamService,
    private readonly userRoleService: UserRoleService,
  ) {}

  // Core User Operations - Delegate to UserCoreService
  async findOne(email: string): Promise<User | undefined> {
    return this.userCoreService.findOne(email);
  }

  async create(
    email: string,
    hashedPassword: string,
    role: UserRole,
  ): Promise<User> {
    return this.userCoreService.create(email, hashedPassword, role);
  }

  async count(): Promise<number> {
    return this.userCoreService.count();
  }

  async findById(userId: number): Promise<User | null> {
    return this.userCoreService.findById(userId);
  }

  async countUsersWithFilters(args: {
    search?: string;
    role?: UserRole;
  }): Promise<number> {
    return this.userCoreService.countUsersWithFilters(args);
  }

  async findUsers(
    args: UserQueryArgs,
  ): Promise<Array<Pick<User, 'id' | 'email' | 'role'>>> {
    return this.userCoreService.findUsers(args);
  }

  // Security Operations - Delegate to UserSecurityService
  async hashData(data: string): Promise<string> {
    return this.userSecurityService.hashData(data);
  }

  async verifyPassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return this.userSecurityService.verifyPassword(
      plainPassword,
      hashedPassword,
    );
  }

  async verifyRefreshToken(
    providedToken: string,
    hashedToken: string,
  ): Promise<boolean> {
    return this.userSecurityService.verifyRefreshToken(
      providedToken,
      hashedToken,
    );
  }

  async updateRefreshTokenHash(
    userId: number,
    hashedRefreshToken: string | null,
  ): Promise<void> {
    return this.userSecurityService.updateRefreshTokenHash(
      userId,
      hashedRefreshToken,
    );
  }

  async clearRefreshToken(userId: number): Promise<void> {
    return this.userSecurityService.clearRefreshToken(userId);
  }

  async clearAllRefreshTokens(): Promise<number> {
    return this.userSecurityService.clearAllRefreshTokens();
  }

  validateEmail(email: string): void {
    return this.userSecurityService.validateEmail(email);
  }

  validatePassword(password: string): void {
    return this.userSecurityService.validatePassword(password);
  }

  // Role Operations - Delegate to UserRoleService
  async updateUserRole(userId: number, newRole: UserRole): Promise<User> {
    return this.userRoleService.updateUserRole(userId, newRole);
  }

  // Team Operations - Delegate to UserTeamService
  async addUserToTeam(userId: number, teamId: string): Promise<User> {
    return this.userTeamService.addUserToTeam(userId, teamId);
  }

  async removeUserFromTeam(userId: number, teamId: string): Promise<User> {
    return this.userTeamService.removeUserFromTeam(userId, teamId);
  }

  async getUserWithTeams(userId: number): Promise<any> {
    return this.userTeamService.getUserWithTeams(userId);
  }
}
