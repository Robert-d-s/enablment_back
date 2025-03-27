import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { getCorsConfig } from './config/cors.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Add global validation pipe for DTOs and GraphQL inputs
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

  // Apply CORS settings from centralized configuration
  app.enableCors(getCorsConfig());

  app.use(cookieParser());

  await app.listen(process.env.PORT || 8080);
  console.log(`Server is running on http://localhost:8080/graphql`);
}

bootstrap();
