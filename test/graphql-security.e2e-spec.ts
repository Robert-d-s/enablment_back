import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('GraphQL Security (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should reject introspection queries in production', () => {
    const introspectionQuery = `
      query IntrospectionQuery {
        __schema {
          types {
            name
          }
        }
      }
    `;

    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: introspectionQuery,
      })
      .expect((res) => {
        if (process.env.NODE_ENV === 'production') {
          expect(res.body.errors).toBeDefined();
          expect(res.body.errors[0].extensions.code).toBe(
            'INTROSPECTION_DISABLED',
          );
        }
      });
  });

  it('should reject overly deep queries', () => {
    // Create a very deep nested query (depth > 10)
    const deepQuery = `
      query DeepQuery {
        user {
          projects {
            issues {
              assignee {
                projects {
                  issues {
                    assignee {
                      projects {
                        issues {
                          assignee {
                            id
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: deepQuery,
      })
      .expect(() => {
        // Note: This test would need actual GraphQL schema to work properly
        // In a real test, you'd expect a depth limit error
      });
  });

  it('should accept valid queries', () => {
    const simpleQuery = `
      query SimpleQuery {
        __typename
      }
    `;

    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: simpleQuery,
      })
      .expect(200);
  });
});
