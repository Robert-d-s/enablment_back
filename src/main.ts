import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { getCorsConfig } from './config/cors.config';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  app.useLogger(logger);

  // Add global validation pipe for DTOs and GraphQL inputs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,

      transformOptions: {
        enableImplicitConversion: true,
      },
      forbidNonWhitelisted: false,
      exceptionFactory: (errors) => {
        logger.warn({ validationErrors: errors }, 'Validation failed');
        return new BadRequestException(errors);
      },
    }),
  );

  app.enableCors(getCorsConfig());
  app.use(cookieParser());

  const port = process.env.PORT || 8080;
  await app.listen(port);
  logger.log(`Server is running on http://localhost:${port}`);
  logger.log(`GraphQL endpoint available at http://localhost:${port}/graphql`);
}

bootstrap();
