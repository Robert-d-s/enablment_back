import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login using GraphQL mutation instead of REST
    const loginMutation = `
      mutation {
        login(email: "rs@enablment.com", password: "Oldschool!") {
          access_token
          user {
            email
          }
        }
      }
    `;

    const response = await request(app.getHttpServer()).post('/graphql').send({
      query: loginMutation,
    });

    // Extract token from the GraphQL response
    jwtToken = response.body.data.login.access_token;
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200)
      .expect('Hello World!');
  });
});
