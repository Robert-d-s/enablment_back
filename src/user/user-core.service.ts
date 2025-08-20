import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole, Prisma } from '@prisma/client';
import type { UserProfile } from '../auth';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { UserQueryArgs } from './user.resolver';

// Constants
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 10;

@Injectable()
export class UserCoreService {
  constructor(
    @InjectPinoLogger(UserCoreService.name)
    private readonly logger: PinoLogger,
    private prisma: PrismaService,
  ) {}

  async findOne(email: string): Promise<User | undefined> {
    this.logger.debug({ email }, 'Finding user by email');
    const user = await this.prisma.user.findFirst({
      where: {
        email,
      },
    });

    return user || undefined;
  }

  async create(
    email: string,
    hashedPassword: string,
    role: UserRole,
  ): Promise<User> {
    this.logger.info({ email, role }, 'Creating user');
    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
    });
  }

  async count(): Promise<number> {
    this.logger.debug('Counting all users');
    return this.prisma.user.count();
  }

  async findById(userId: number): Promise<User | null> {
    this.logger.debug({ userId }, 'Finding user by ID');
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  private buildUserFilters(args: {
    search?: string;
    role?: UserRole;
  }): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};
    if (args.search) {
      where.email = { contains: args.search };
    }
    if (args.role) {
      where.role = args.role;
    }
    return where;
  }

  private calculatePagination(
    page?: number,
    pageSize?: number,
  ): {
    skip: number;
    take: number;
    currentPage: number;
    currentPageSize: number;
  } {
    const currentPage = Math.max(1, page ?? 1);
    const currentPageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, pageSize ?? DEFAULT_PAGE_SIZE),
    );
    const skip = (currentPage - 1) * currentPageSize;
    const take = currentPageSize;

    return { skip, take, currentPage, currentPageSize };
  }

  async countUsersWithFilters(args: {
    search?: string;
    role?: UserRole;
  }): Promise<number> {
    this.logger.debug({ filterArgs: args }, 'Counting users with filters');
    const where = this.buildUserFilters(args);
    return this.prisma.user.count({ where });
  }

  async findUsers(args: UserQueryArgs): Promise<Array<UserProfile>> {
    this.logger.debug(
      { queryArgs: args },
      'Finding users with filters and pagination',
    );

    const { skip, take } = this.calculatePagination(args.page, args.pageSize);
    const where = this.buildUserFilters(args);

    return this.prisma.user.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        email: true,
        role: true,
      },
      orderBy: {
        email: 'asc',
      },
    });
  }
}
