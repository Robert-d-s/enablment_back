import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '@prisma/client';
import { UserRole } from '../user/user-role.enum';
import { User as QlUser } from '../user/user.model';

type TeamBasic = {
  id: string;
  name: string;
};

type UserTeam = {
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
  constructor(private prisma: PrismaService) {}
  async getUserTeams(): Promise<UserTeam[]> {
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
        // other fields as needed
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
                    // Add any other necessary fields here
                  },
                },
                rates: {
                  select: {
                    id: true,
                    name: true,
                    teamId: true,
                    rate: true,
                    // Add any other necessary fields here
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

    return user;
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
    // First, check if the user and team exist
    const userExists = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    const teamExists = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!userExists || !teamExists) {
      throw new Error('User or Team not found');
    }

    // Check if the relation already exists
    const existingRelation = await this.prisma.userTeam.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    // If the relation does not exist, create it
    if (!existingRelation) {
      await this.prisma.userTeam.create({
        data: {
          userId,
          teamId,
        },
      });
    }

    return this.getUserWithTeams(userId);
  }

  async removeUserFromTeam(userId: number, teamId: string): Promise<User> {
    console.log(`Attempting to remove team ${teamId} from user ${userId}`);

    // Log current state of the user and teams
    const userBeforeUpdate = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { teams: true },
    });
    console.log('User before update:', userBeforeUpdate);

    try {
      const result = await this.prisma.userTeam.deleteMany({
        where: {
          userId: userId,
          teamId: teamId,
        },
      });

      if (result.count === 0) {
        console.warn(
          `No association found for user ${userId} with team ${teamId}. Nothing to delete.`,
        );
      } else {
        console.log(`Removed team ${teamId} from user ${userId}`);
      }
    } catch (error) {
      console.error(
        `Error while removing team ${teamId} from user ${userId}:`,
        error,
      );
    }

    // Fetch and log updated user info
    const updatedUser = await this.getUserWithTeams(userId);
    console.log('User after update:', updatedUser);

    return updatedUser;
  }

  private async getUserWithTeams(userId: number): Promise<User> {
    const user = await this.prisma.user.findUnique({
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
      throw new Error(`User with ID ${userId} not found`);
    }

    // Handling non-nullable fields
    user.teams = user.teams.map((ut) => ({
      ...ut,
      team: {
        ...ut.team,
        projects: ut.team.projects || [],
        rates: ut.team.rates || [],
      },
    }));

    return user;
  }
}
