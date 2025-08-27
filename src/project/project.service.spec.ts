import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from './project.service';
import { PrismaService } from '../prisma/prisma.service';
import { TeamLoader } from '../loaders/team.loader';
import { getLoggerToken } from 'nestjs-pino';
import { ExceptionFactory } from '../common/exceptions/base.exception';

describe('ProjectService', () => {
  let service: ProjectService;
  let prismaService: jest.Mocked<PrismaService>;
  let teamLoader: jest.Mocked<TeamLoader>;

  const mockProject = {
    id: 'project-1',
    name: 'Test Project',
    key: 'TP',
    linearId: 'linear-project-1',
    teamId: 'team-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTeam = {
    id: 'team-1',
    name: 'Test Team',
    key: 'TT',
    linearId: 'linear-team-1',
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
        ProjectService,
        {
          provide: PrismaService,
          useValue: {
            project: {
              findMany: jest.fn().mockResolvedValue([]),
              findUnique: jest.fn().mockResolvedValue(null),
              count: jest.fn().mockResolvedValue(0),
            },
          },
        },
        {
          provide: TeamLoader,
          useValue: {
            byId: {
              loadMany: jest.fn().mockResolvedValue([]),
            },
          },
        },
        {
          provide: getLoggerToken(ProjectService.name),
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    prismaService = module.get(PrismaService);
    teamLoader = module.get(TeamLoader);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('all', () => {
    it('should return empty array when no projects exist', async () => {
      (prismaService.project.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.all();

      expect(result).toEqual([]);
      expect(prismaService.project.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
    });

    it('should return projects with team names', async () => {
      const projects = [
        mockProject,
        { ...mockProject, id: 'project-2', teamId: 'team-2' },
      ];
      const teams = [mockTeam, { ...mockTeam, id: 'team-2', name: 'Team Two' }];

      (prismaService.project.findMany as jest.Mock).mockResolvedValue(projects);
      (teamLoader.byId.loadMany as jest.Mock).mockResolvedValue(teams);

      const result = await service.all();

      expect(result).toEqual([
        { ...mockProject, teamName: 'Test Team' },
        {
          ...mockProject,
          id: 'project-2',
          teamId: 'team-2',
          teamName: 'Team Two',
        },
      ]);
      expect(teamLoader.byId.loadMany).toHaveBeenCalledWith([
        'team-1',
        'team-2',
      ]);
    });

    it('should handle projects with missing teams gracefully', async () => {
      const projects = [mockProject];
      const teams = [new Error('Team not found')];

      (prismaService.project.findMany as jest.Mock).mockResolvedValue(projects);
      (teamLoader.byId.loadMany as jest.Mock).mockResolvedValue(teams);

      const result = await service.all();

      expect(result).toEqual([{ ...mockProject, teamName: undefined }]);
    });

    it('should deduplicate team IDs for efficient loading', async () => {
      const projects = [
        mockProject,
        { ...mockProject, id: 'project-2' }, // Same team
        { ...mockProject, id: 'project-3', teamId: 'team-2' },
      ];
      const teams = [mockTeam, { ...mockTeam, id: 'team-2', name: 'Team Two' }];

      (prismaService.project.findMany as jest.Mock).mockResolvedValue(projects);
      (teamLoader.byId.loadMany as jest.Mock).mockResolvedValue(teams);

      await service.all();

      expect(teamLoader.byId.loadMany).toHaveBeenCalledWith([
        'team-1',
        'team-2',
      ]);
    });
  });

  describe('findById', () => {
    it('should return project when found', async () => {
      (prismaService.project.findUnique as jest.Mock).mockResolvedValue(
        mockProject,
      );

      const result = await service.findById('project-1');

      expect(result).toEqual(mockProject);
      expect(prismaService.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-1' },
      });
    });

    it('should throw ResourceNotFoundException when project not found', async () => {
      (prismaService.project.findUnique as jest.Mock).mockResolvedValue(null);

      const findByIdSpy = jest.spyOn(ExceptionFactory, 'projectNotFound');

      await expect(service.findById('nonexistent-project')).rejects.toThrow();

      expect(findByIdSpy).toHaveBeenCalledWith(
        'nonexistent-project',
        'findById operation',
      );
    });
  });

  describe('findByTeamId', () => {
    it('should return projects for team', async () => {
      const teamProjects = [mockProject, { ...mockProject, id: 'project-2' }];
      (prismaService.project.findMany as jest.Mock).mockResolvedValue(
        teamProjects,
      );

      const result = await service.findByTeamId('team-1');

      expect(result).toEqual(teamProjects);
      expect(prismaService.project.findMany).toHaveBeenCalledWith({
        where: { teamId: 'team-1' },
        orderBy: { name: 'asc' },
      });
    });

    it('should return empty array when team has no projects', async () => {
      (prismaService.project.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findByTeamId('team-without-projects');

      expect(result).toEqual([]);
    });
  });

  describe('count', () => {
    it('should return total project count', async () => {
      (prismaService.project.count as jest.Mock).mockResolvedValue(42);

      const result = await service.count();

      expect(result).toBe(42);
      expect(prismaService.project.count).toHaveBeenCalledWith();
    });
  });

  describe('countByTeamId', () => {
    it('should return project count for team', async () => {
      (prismaService.project.count as jest.Mock).mockResolvedValue(5);

      const result = await service.countByTeamId('team-1');

      expect(result).toBe(5);
      expect(prismaService.project.count).toHaveBeenCalledWith({
        where: { teamId: 'team-1' },
      });
    });

    it('should return 0 when team has no projects', async () => {
      (prismaService.project.count as jest.Mock).mockResolvedValue(0);

      const result = await service.countByTeamId('team-without-projects');

      expect(result).toBe(0);
    });
  });
});
