import { Injectable } from '@nestjs/common';
import { PrismaClient, User, UserRole } from '@prisma/client';
// import { UserRole } from '../user/user-role.enum';

const prisma = new PrismaClient();

@Injectable()
export class UserService {
  async all(): Promise<User[]> {
    return prisma.user.findMany();
  }

  async findOne(email: string): Promise<User | undefined> {
    return prisma.user.findFirst({
      where: {
        email,
      },
    });
  }

  // async create(email: string, password: string): Promise<User> {
  //   return prisma.user.create({
  //     data: {
  //       email,
  //       password,
  //     },
  //   });
  // }

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

  async updateUserRole(userId: number, newRole: UserRole): Promise<User> {
    return prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        role: newRole,
      },
    });
  }
}
