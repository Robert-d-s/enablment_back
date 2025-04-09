import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';

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
      const userExists = await tx.user.findUnique({
        where: { id: userId },
      });
      const teamExists = await tx.team.findUnique({
        where: { id: teamId },
      });

      if (!userExists || !teamExists) {
        throw new Error('User or Team not found');
      }

      const existingRelation = await tx.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
      });

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
      const userBefore = await this.getUserWithTeams(userId);
      this.logger.debug(
        `Current state - User ${userId} has ${
          userBefore?.teams?.length || 0
        } teams`,
      );

      return await this.prisma.$transaction(async (tx) => {
        await tx.userTeam.deleteMany({
          where: {
            userId: userId,
            teamId: teamId,
          },
        });

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
