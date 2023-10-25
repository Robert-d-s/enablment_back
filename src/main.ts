import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://fb64-213-32-242-65.ngrok-free.app ',
    ],
  });

  await app.listen(process.env.PORT || 8080);
}

bootstrap();
