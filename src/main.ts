import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { getCorsConfig } from './config/cors.config';
import { Logger, PinoLogger } from 'nestjs-pino';
import { EnhancedValidationPipe } from './common/pipes/enhanced-validation.pipe';
import { GlobalGqlExceptionFilter } from './common/filters/gql-exception.filter';
import { EnhancedLoggingInterceptor } from './common/interceptors/enhanced-logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  const pinoLogger = await app.resolve(PinoLogger);
  app.useLogger(logger); // Add enhanced global validation pipe for DTOs and GraphQL inputs
  app.useGlobalPipes(
    new EnhancedValidationPipe(pinoLogger, {
      whitelist: true,
      transform: true,
      enableImplicitConversion: true,
      forbidNonWhitelisted: false,
      enablePerformanceTracking: true,
      maxCacheSize: 1000,
    }),
  );

  // Add over-engineered global exception filter for comprehensive error handling
  app.useGlobalFilters(new GlobalGqlExceptionFilter(pinoLogger));

  // Add enhanced logging interceptor for performance tracking and analytics
  app.useGlobalInterceptors(new EnhancedLoggingInterceptor(pinoLogger));

  app.enableCors(getCorsConfig());
  app.use(cookieParser());

  const port = process.env.PORT || 8080;
  await app.listen(port);
  logger.log(`Server is running on http://localhost:${port}`);
  logger.log(`GraphQL endpoint available at http://localhost:${port}/graphql`);
}

bootstrap();
