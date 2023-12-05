import { Injectable } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import { UserRole } from '../user/user-role.enum';
import { UserRole as PrismaUserRole } from '@prisma/client';

const prisma = new PrismaClient();

type UserWithoutPassword = {
  id: number;
  email: string;
  role: PrismaUserRole;
};

@Injectable()
export class UserService {
  async all(): Promise<UserWithoutPassword[]> {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
      },
    });
    return users;
  }

  async findOne(email: string): Promise<User | undefined> {
    const user = await prisma.user.findFirst({
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
    return prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
    });
  }

  async count(): Promise<number> {
    return prisma.user.count();
  }

  // async updateUserRole(userId: number, newRole: UserRole): Promise<User> {
  //   return prisma.user.update({
  //     where: {
  //       id: userId,
  //     },
  //     data: {
  //       role: newRole,
  //     },
  //   });
  // }

  async updateUserRole(userId: number, newRole: UserRole): Promise<User> {
    const updatedUser = await prisma.user.update({
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
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    const teamExists = await prisma.team.findUnique({ where: { id: teamId } });

    if (!userExists || !teamExists) {
      throw new Error('User or Team not found');
    }

    // Check if the relation already exists
    const existingRelation = await prisma.userTeam.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    // If the relation does not exist, create it
    if (!existingRelation) {
      await prisma.userTeam.create({
        data: {
          userId,
          teamId,
        },
      });
    }

    return this.getUserWithTeams(userId);
  }

  async removeUserFromTeam(userId: number, teamId: string): Promise<User> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        teams: {
          disconnect: { userId_teamId: { userId, teamId } },
        },
      },
    });
    return this.getUserWithTeams(userId);
  }

  private async getUserWithTeams(userId: number): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        teams: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Ensure each team object has a non-null id
    user.teams = user.teams.filter((ut) => ut.team && ut.team.id != null);

    return user;
  }
}
