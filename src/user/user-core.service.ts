import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole, Prisma } from '@prisma/client';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { UserQueryArgs } from './user.resolver';

// Constants
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 10;

@Injectable()
export class UserService {
  constructor(
    @InjectPinoLogger(UserService.name) private readonly logger: PinoLogger,
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

  async countUsersWithFilters(args: {
    search?: string;
    role?: UserRole;
  }): Promise<number> {
    this.logger.debug({ filterArgs: args }, 'Counting users with filters');
    const where: Prisma.UserWhereInput = {};
    if (args.search) {
      where.email = { contains: args.search };
    }
    if (args.role) {
      where.role = args.role;
    }
    return this.prisma.user.count({ where });
  }

  // Method to Find users with filters and pagination (Required for users query)
  async findUsers(
    args: UserQueryArgs,
  ): Promise<Array<Pick<User, 'id' | 'email' | 'role'>>> {
    // Return type matches resolver needs
    this.logger.debug(
      { queryArgs: args },
      'Finding users with filters and pagination',
    );

    // Validate pagination parameters
    const currentPage = Math.max(1, args.page ?? 1);
    const currentPageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, args.pageSize ?? DEFAULT_PAGE_SIZE),
    );

    const skip = (currentPage - 1) * currentPageSize;
    const take = currentPageSize;

    const where: Prisma.UserWhereInput = {};
    if (args.search) {
      where.email = { contains: args.search };
    }
    if (args.role) {
      where.role = args.role;
    }

    // Return only the fields needed by the resolver/GraphQL type
    return this.prisma.user.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        email: true,
        role: true, // Prisma returns the enum value
      },
      orderBy: {
        email: 'asc',
      },
    });
  }
}
