import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://3d3d-152-115-126-50.ngrok-free.app',
    ],
  });

  await app.listen(process.env.PORT || 8080);
}

bootstrap();
