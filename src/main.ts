import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : [
            'http://localhost:3000',
            'http://localhost:4000',
            'http://127.0.0.1:3000',
          ],
    credentials: true,
  });

  app.use(cookieParser());

  await app.listen(process.env.PORT || 8080);
  console.log(`Server is running on http://localhost:8080/graphql`);
}

bootstrap();
