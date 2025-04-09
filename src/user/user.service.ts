import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';
import { User as QlUser } from '../user/user.model';

// Local type definitions that don't conflict with Prisma types
type TeamBasic = {
  id: string;
  name: string;
};

type UserTeamDTO = {
  userId: number;
  teamId: string;
  user: {
    id: number;
    email: string;
    password?: string | null;
    role: UserRole;
  };
  team: TeamBasic;
};

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}
  async getUserTeams(): Promise<UserTeamDTO[]> {
    const userTeams = await this.prisma.userTeam.findMany({
      include: {
        user: true,
        team: true,
      },
    });

    return userTeams.map((ut) => ({
      userId: ut.userId,
      teamId: ut.teamId,
      user: {
        id: ut.user.id,
        email: ut.user.email,
        role: UserRole[ut.user.role as keyof typeof UserRole],
        password: null,
      },
      team: {
        id: ut.team.id,
        name: ut.team.name,
      },
    }));
  }

  async all(): Promise<QlUser[]> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        teams: {
          select: {
            team: {
              select: {
                id: true,
                name: true,
                projects: {
                  select: {
                    id: true,
                    estimatedTime: true,
                    name: true,
                    teamId: true,
                    createdAt: true,
                    updatedAt: true,
                    description: true,
                    state: true,
                    startDate: true,
                    targetDate: true,
                  },
                },
                rates: {
                  select: {
                    id: true,
                    name: true,
                    teamId: true,
                    rate: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      role: UserRole[user.role as keyof typeof UserRole],
      teams: user.teams.map((ut) => ({
        id: ut.team.id,
        name: ut.team.name,
        projects: ut.team.projects, // Now fully populated
        rates: ut.team.rates, // Now fully populated
      })),
    }));
  }

  async findOne(email: string): Promise<User | undefined> {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (user) {
      return {
        ...user,
        role: UserRole[user.role as keyof typeof UserRole],
      };
    }

    return undefined;
  }

  async create(
    email: string,
    hashedPassword: string,
    role: UserRole,
  ): Promise<User> {
    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
    });
  }

  async count(): Promise<number> {
    return this.prisma.user.count();
  }

  async updateUserRole(userId: number, newRole: UserRole): Promise<User> {
    const updatedUser = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        role: newRole,
      },
    });

    return {
      ...updatedUser,
      role: UserRole[updatedUser.role as keyof typeof UserRole],
    };
  }

  async addUserToTeam(userId: number, teamId: string): Promise<User> {
    return this.prisma.$transaction(async (tx) => {
      // First, check if the user and team exist
      const userExists = await tx.user.findUnique({
        where: { id: userId },
      });
      const teamExists = await tx.team.findUnique({
        where: { id: teamId },
      });

      if (!userExists || !teamExists) {
        throw new Error('User or Team not found');
      }

      // Check if the relation already exists
      const existingRelation = await tx.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
      });

      // If the relation does not exist, create it
      if (!existingRelation) {
        await tx.userTeam.create({
          data: {
            userId,
            teamId,
          },
        });
      }

      // Get the updated user with teams within the transaction
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: {
          teams: {
            include: {
              team: {
                include: {
                  projects: true,
                  rates: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new Error(
          `User with ID ${userId} not found after adding to team`,
        );
      }

      return user;
    });
  }

  private async getUserWithTeams(userId: number): Promise<any> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        teams: {
          include: {
            team: {
              include: {
                projects: true,
                rates: true,
              },
            },
          },
        },
      },
    });
  }

  async removeUserFromTeam(userId: number, teamId: string): Promise<User> {
    this.logger.debug(
      `Removing user ${userId} from team ${teamId}. First, logging current state.`,
    );

    try {
      // Get current state
      const userBefore = await this.getUserWithTeams(userId);
      this.logger.debug(
        `Current state - User ${userId} has ${
          userBefore?.teams?.length || 0
        } teams`,
      );

      // Use a transaction to ensure the operation is atomic
      return await this.prisma.$transaction(async (tx) => {
        // Perform the disconnection
        await tx.userTeam.deleteMany({
          where: {
            userId: userId,
            teamId: teamId,
          },
        });

        // Get the updated user data
        const updatedUser = await this.getUserWithTeams(userId);
        this.logger.debug(
          `After removal - User ${userId} now has ${
            updatedUser?.teams?.length || 0
          } teams`,
        );

        return updatedUser;
      });
    } catch (error) {
      this.logger.error(
        `Failed to remove user ${userId} from team ${teamId}:`,
        error,
      );
      throw error;
    }
  }
}
