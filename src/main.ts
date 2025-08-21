import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { getCorsConfig } from './config/cors.config';
import { Logger } from 'nestjs-pino';
import { GlobalGqlExceptionFilter } from './common/filters/gql-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  app.useLogger(logger);

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

  app.enableCors(getCorsConfig());
  app.use(cookieParser());

  const port = process.env.PORT || 8080;
  await app.listen(port);
  logger.log(`Server is running on http://localhost:${port}`);
  logger.log(`GraphQL endpoint available at http://localhost:${port}/graphql`);
}

bootstrap();
