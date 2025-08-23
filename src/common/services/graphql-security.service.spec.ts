import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GraphQLSecurityService } from './graphql-security.service';

describe('GraphQLSecurityService', () => {
  let service: GraphQLSecurityService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GraphQLSecurityService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                GRAPHQL_MAX_DEPTH: 10,
                GRAPHQL_MAX_COMPLEXITY: 1000,
                GRAPHQL_INTROSPECTION: false,
              };
              return config[key as keyof typeof config];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<GraphQLSecurityService>(GraphQLSecurityService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create depth limit rule', () => {
    const rule = service.getDepthLimitRule();
    expect(rule).toBeDefined();
    expect(typeof rule).toBe('function');
  });

  it('should create complexity limit rule', () => {
    const rule = service.getComplexityLimitRule();
    expect(rule).toBeDefined();
    expect(typeof rule).toBe('function');
  });

  it('should create introspection rule when disabled', () => {
    const rule = service.getIntrospectionRule();
    expect(rule).toBeDefined();
    expect(typeof rule).toBe('function');
  });

  it('should return undefined introspection rule when enabled', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'GRAPHQL_INTROSPECTION') return true;
      const config = {
        GRAPHQL_MAX_DEPTH: 10,
        GRAPHQL_MAX_COMPLEXITY: 1000,
      };
      return config[key as keyof typeof config];
    });

    // Create new service with updated config
    const serviceWithIntrospection = new GraphQLSecurityService(configService);
    const rule = serviceWithIntrospection.getIntrospectionRule();
    expect(rule).toBeUndefined();
  });

  it('should return validation rules array', () => {
    const rules = service.getValidationRules();
    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThan(0);

    rules.forEach((rule) => {
      expect(typeof rule).toBe('function');
    });
  });

  it('should log query metrics', () => {
    const logSpy = jest.spyOn(service['logger'], 'debug');
    service.logQueryMetrics('testOperation');
    expect(logSpy).toHaveBeenCalledWith('GraphQL Query Metrics', {
      operationName: 'testOperation',
      maxComplexity: 1000,
      maxDepth: 10,
    });
  });
});
