import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { getCorsConfig } from './config/cors.config';
import { Logger } from 'nestjs-pino';
import { GlobalGqlExceptionFilter } from './common/filters/gql-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { LoggingService } from './common/services/logging.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  const loggingService = app.get(LoggingService);
  app.useLogger(logger);

  // Use standard NestJS ValidationPipe with sensible defaults
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
  // Use simplified exception filter
  app.useGlobalFilters(new GlobalGqlExceptionFilter(loggingService));

  // Use simplified logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor(loggingService));

  app.enableCors(getCorsConfig());
  app.use(cookieParser());

  const port = process.env.PORT || 8080;
  await app.listen(port);
  logger.log(`Server is running on http://localhost:${port}`);
  logger.log(`GraphQL endpoint available at http://localhost:${port}/graphql`);
}

bootstrap();
