import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.enableCors({
  //   origin: [
  //     'http://localhost:3000',
  //     'https://52d3-2a02-2f08-d106-c300-70dd-50f2-5394-12aa.ngrok-free.app',
  //     'https://enablment-tt.vercel.app/',
  //   ],
  //   credentials: true,
  //   allowedHeaders: ['Content-Type', 'Authorization'],
  // });
  app.use(
    cors({
      origin: [
        'http://localhost:3000',
        'https://52d3-2a02-2f08-d106-c300-70dd-50f2-5394-12aa.ngrok-free.app',
        'https://enablment-tt.vercel.app/',
      ],
      credentials: true,
      preflightContinue: true,
    }),
  );

  await app.listen(process.env.PORT || 8080);
}

bootstrap();
