import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseSyncService } from './dbSynch.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  TeamSyncService,
  ProjectSyncService,
  IssueSyncService,
  CleanupSyncService,
} from './services';
import { getLoggerToken } from 'nestjs-pino';

describe('DatabaseSyncService', () => {
  let service: DatabaseSyncService;
  let teamSyncService: TeamSyncService;
  let projectSyncService: ProjectSyncService;
  let issueSyncService: IssueSyncService;
  let cleanupSyncService: CleanupSyncService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseSyncService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
          },
        },
        {
          provide: TeamSyncService,
          useValue: {
            synchronize: jest.fn(),
          },
        },
        {
          provide: ProjectSyncService,
          useValue: {
            synchronize: jest.fn(),
          },
        },
        {
          provide: IssueSyncService,
          useValue: {
            synchronize: jest.fn(),
          },
        },
        {
          provide: CleanupSyncService,
          useValue: {
            synchronize: jest.fn(),
          },
        },
        {
          provide: getLoggerToken(DatabaseSyncService.name),
          useValue: {
            info: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DatabaseSyncService>(DatabaseSyncService);
    teamSyncService = module.get<TeamSyncService>(TeamSyncService);
    projectSyncService = module.get<ProjectSyncService>(ProjectSyncService);
    issueSyncService = module.get<IssueSyncService>(IssueSyncService);
    cleanupSyncService = module.get<CleanupSyncService>(CleanupSyncService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should orchestrate synchronization of all entities', async () => {
    const mockTransaction = jest.fn();
    jest
      .spyOn(prismaService, '$transaction')
      .mockImplementation(mockTransaction);

    await service.synchronizeDatabase();

    expect(mockTransaction).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should synchronize teams only', async () => {
    const mockTransaction = jest.fn();
    jest
      .spyOn(prismaService, '$transaction')
      .mockImplementation(mockTransaction);

    await service.synchronizeTeamsOnly();

    expect(mockTransaction).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should call services in correct order during full sync', async () => {
    const callOrder: string[] = [];

    const mockTx = {} as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    jest.spyOn(teamSyncService, 'synchronize').mockImplementation(async () => {
      callOrder.push('teams');
    });

    jest
      .spyOn(projectSyncService, 'synchronize')
      .mockImplementation(async () => {
        callOrder.push('projects');
      });

    jest.spyOn(issueSyncService, 'synchronize').mockImplementation(async () => {
      callOrder.push('issues');
    });

    jest
      .spyOn(cleanupSyncService, 'synchronize')
      .mockImplementation(async () => {
        callOrder.push('cleanup');
      });

    jest
      .spyOn(prismaService, '$transaction')
      .mockImplementation(async (callback) => {
        await callback(mockTx);
      });

    await service.synchronizeDatabase();

    expect(callOrder).toEqual(['teams', 'projects', 'issues', 'cleanup']);
    expect(teamSyncService.synchronize).toHaveBeenCalledWith(mockTx);
    expect(projectSyncService.synchronize).toHaveBeenCalledWith(mockTx);
    expect(issueSyncService.synchronize).toHaveBeenCalledWith(mockTx);
    expect(cleanupSyncService.synchronize).toHaveBeenCalledWith(mockTx);
  });
});
