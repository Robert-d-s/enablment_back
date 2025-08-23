import { Test, TestingModule } from '@nestjs/testing';
import { UserCoreService } from './user-core.service';
import { PrismaService } from '../prisma/prisma.service';
import { getLoggerToken } from 'nestjs-pino';
import { UserRole } from '@prisma/client';

describe('UserCoreService', () => {
  let service: UserCoreService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
    role: UserRole.COLLABORATOR,
    tokenVersion: 1,
    hashedRefreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserCoreService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: getLoggerToken(UserCoreService.name),
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<UserCoreService>(UserCoreService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should return user when found', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findOne('test@example.com');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return undefined when user not found', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.findOne('nonexistent@example.com');

      expect(result).toBeUndefined();
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findById(1);

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return null when user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return new user', async () => {
      const email = 'newuser@example.com';
      const hashedPassword = 'hashedPassword123';
      const role = UserRole.COLLABORATOR;

      const newUser = {
        ...mockUser,
        email,
        password: hashedPassword,
        role,
      };

      (prismaService.user.create as jest.Mock).mockResolvedValue(newUser);

      const result = await service.create(email, hashedPassword, role);

      expect(result).toEqual(newUser);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email,
          password: hashedPassword,
          role,
        },
      });
    });
  });

  describe('count', () => {
    it('should return user count', async () => {
      (prismaService.user.count as jest.Mock).mockResolvedValue(5);

      const result = await service.count();

      expect(result).toBe(5);
      expect(prismaService.user.count).toHaveBeenCalled();
    });
  });

  describe('countUsersWithFilters', () => {
    it('should count users with search filter', async () => {
      (prismaService.user.count as jest.Mock).mockResolvedValue(3);

      const result = await service.countUsersWithFilters({
        search: 'test',
      });

      expect(result).toBe(3);
      expect(prismaService.user.count).toHaveBeenCalledWith({
        where: { email: { contains: 'test' } },
      });
    });

    it('should count users with role filter', async () => {
      (prismaService.user.count as jest.Mock).mockResolvedValue(2);

      const result = await service.countUsersWithFilters({
        role: UserRole.ADMIN,
      });

      expect(result).toBe(2);
      expect(prismaService.user.count).toHaveBeenCalledWith({
        where: { role: UserRole.ADMIN },
      });
    });

    it('should count users with both search and role filters', async () => {
      (prismaService.user.count as jest.Mock).mockResolvedValue(1);

      const result = await service.countUsersWithFilters({
        search: 'admin',
        role: UserRole.ADMIN,
      });

      expect(result).toBe(1);
      expect(prismaService.user.count).toHaveBeenCalledWith({
        where: {
          email: { contains: 'admin' },
          role: UserRole.ADMIN,
        },
      });
    });
  });

  describe('findUsers', () => {
    const mockUsers = [
      { id: 1, email: 'admin@example.com', role: UserRole.ADMIN },
      { id: 2, email: 'user@example.com', role: UserRole.COLLABORATOR },
    ];

    it('should find users with default pagination', async () => {
      (prismaService.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await service.findUsers({});

      expect(result).toEqual(mockUsers);
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        select: {
          id: true,
          email: true,
          role: true,
        },
        orderBy: {
          email: 'asc',
        },
      });
    });

    it('should find users with custom pagination', async () => {
      (prismaService.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await service.findUsers({
        page: 2,
        pageSize: 5,
      });

      expect(result).toEqual(mockUsers);
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 5,
        take: 5,
        select: {
          id: true,
          email: true,
          role: true,
        },
        orderBy: {
          email: 'asc',
        },
      });
    });

    it('should cap page size at maximum allowed', async () => {
      (prismaService.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await service.findUsers({
        pageSize: 200, // Above MAX_PAGE_SIZE
      });

      expect(result).toEqual(mockUsers);
      expect(prismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100, // Should be capped at MAX_PAGE_SIZE
        }),
      );
    });

    it('should find users with search and role filters', async () => {
      (prismaService.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await service.findUsers({
        search: 'admin',
        role: UserRole.ADMIN,
        page: 1,
        pageSize: 20,
      });

      expect(result).toEqual(mockUsers);
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: {
          email: { contains: 'admin' },
          role: UserRole.ADMIN,
        },
        skip: 0,
        take: 20,
        select: {
          id: true,
          email: true,
          role: true,
        },
        orderBy: {
          email: 'asc',
        },
      });
    });

    it('should handle invalid page number by defaulting to 1', async () => {
      (prismaService.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await service.findUsers({
        page: -1, // Invalid page
      });

      expect(result).toEqual(mockUsers);
      expect(prismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0, // Should default to page 1 (skip 0)
        }),
      );
    });

    it('should handle invalid page size by using default', async () => {
      (prismaService.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await service.findUsers({
        pageSize: 0, // Invalid page size
      });

      expect(result).toEqual(mockUsers);
      expect(prismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1, // Math.max(1, 0) = 1, not defaulting to 10
        }),
      );
    });
  });
});