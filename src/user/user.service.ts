import { Injectable } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';

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

  async create(email: string, password: string): Promise<User> {
    return prisma.user.create({
      data: {
        email,
        password,
      },
    });
  }
}
