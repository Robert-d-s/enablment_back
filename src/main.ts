import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { getCorsConfig } from './config/cors.config';
import { Logger } from 'nestjs-pino';
import { GlobalGqlExceptionFilter } from './common/filters/gql-exception.filter';
import { validateEnvironment, logEnvironmentInfo } from './config/env.validation';

async function bootstrap(): Promise<void> {
  // Validate environment variables before creating the app
  validateEnvironment();

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  const configService = app.get(ConfigService);
  app.useLogger(logger);

  // Log environment info after logger is configured
  logEnvironmentInfo();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(app.get(GlobalGqlExceptionFilter));

  app.enableCors(getCorsConfig(configService));
  app.use(cookieParser());

  const port = configService.get<number>('PORT') || 8080;
  await app.listen(port);
  logger.log(`Server is running on http://localhost:${port}`);
  logger.log(`GraphQL endpoint available at http://localhost:${port}/graphql`);
}

bootstrap();
