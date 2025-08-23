import { Test, TestingModule } from '@nestjs/testing';
import { IssueService } from './issue.service';
import { PrismaService } from '../prisma/prisma.service';
import { IssueCacheService } from './services/issue-cache.service';
import { getLoggerToken } from 'nestjs-pino';

describe('IssueService', () => {
  let service: IssueService;

  const mockPrismaService = {
    userTeam: {
      findMany: jest.fn(),
    },
    issue: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockCacheService = {
    getCachedPaginatedIssues: jest.fn(),
    cachePaginatedIssues: jest.fn(),
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
        IssueService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: IssueCacheService,
          useValue: mockCacheService,
        },
        {
          provide: getLoggerToken(IssueService.name),
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<IssueService>(IssueService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getIssuesForUser', () => {
    it('should return empty result when user has no team assignments', async () => {
      // Arrange
      const userId = 1;
      mockPrismaService.userTeam.findMany.mockResolvedValue([]);

      // Act
      const result = await service.getIssuesForUser(userId, 1, 50);

      // Assert
      expect(result).toEqual({
        issues: [],
        total: 0,
        hasNext: false,
      });
      expect(mockPrismaService.userTeam.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: { teamId: true },
      });
      expect(mockPrismaService.issue.findMany).not.toHaveBeenCalled();
      expect(mockPrismaService.issue.count).not.toHaveBeenCalled();
    });

    it('should filter issues by user team assignments', async () => {
      // Arrange
      const userId = 1;
      const userTeams = [{ teamId: 'team1' }, { teamId: 'team2' }];
      const mockIssues = [
        { id: '1', title: 'Issue 1', teamKey: 'team1' },
        { id: '2', title: 'Issue 2', teamKey: 'team2' },
      ];
      const totalCount = 2;

      mockPrismaService.userTeam.findMany.mockResolvedValue(userTeams);
      mockPrismaService.issue.findMany.mockResolvedValue(mockIssues);
      mockPrismaService.issue.count.mockResolvedValue(totalCount);

      const expectedWhereClause = {
        OR: [
          {
            teamKey: {
              in: ['team1', 'team2'],
            },
          },
          {
            project: {
              teamId: {
                in: ['team1', 'team2'],
              },
            },
          },
        ],
      };

      // Act
      const result = await service.getIssuesForUser(userId, 1, 50);

      // Assert
      expect(result).toEqual({
        issues: mockIssues,
        total: totalCount,
        hasNext: false,
      });
      expect(mockPrismaService.issue.findMany).toHaveBeenCalledWith({
        where: expectedWhereClause,
        skip: 0,
        take: 50,
        include: { labels: true },
        orderBy: { updatedAt: 'desc' },
      });
      expect(mockPrismaService.issue.count).toHaveBeenCalledWith({
        where: expectedWhereClause,
      });
    });

    it('should respect pagination parameters', async () => {
      // Arrange
      const userId = 1;
      const page = 2;
      const limit = 10;
      const userTeams = [{ teamId: 'team1' }];

      mockPrismaService.userTeam.findMany.mockResolvedValue(userTeams);
      mockPrismaService.issue.findMany.mockResolvedValue([]);
      mockPrismaService.issue.count.mockResolvedValue(0);

      // Act
      await service.getIssuesForUser(userId, page, limit);

      // Assert
      expect(mockPrismaService.issue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page - 1) * limit = (2 - 1) * 10
          take: 10,
        }),
      );
    });

    it('should cap limit at 100 items per page', async () => {
      // Arrange
      const userId = 1;
      const userTeams = [{ teamId: 'team1' }];

      mockPrismaService.userTeam.findMany.mockResolvedValue(userTeams);
      mockPrismaService.issue.findMany.mockResolvedValue([]);
      mockPrismaService.issue.count.mockResolvedValue(0);

      // Act
      await service.getIssuesForUser(userId, 1, 200); // Request 200 items

      // Assert
      expect(mockPrismaService.issue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100, // Should be capped at 100
        }),
      );
    });

    it('should calculate hasNext correctly', async () => {
      // Arrange
      const userId = 1;
      const userTeams = [{ teamId: 'team1' }];
      const mockIssues = Array(10).fill({ id: '1', title: 'Issue' });

      mockPrismaService.userTeam.findMany.mockResolvedValue(userTeams);
      mockPrismaService.issue.findMany.mockResolvedValue(mockIssues);
      mockPrismaService.issue.count.mockResolvedValue(25); // Total 25 items

      // Act - Get page 1 with limit 10
      const result = await service.getIssuesForUser(userId, 1, 10);

      // Assert
      expect(result.hasNext).toBe(true); // 0 + 10 < 25
      expect(result.total).toBe(25);
    });
  });
});
