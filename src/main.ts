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
  app.use((req, res, next) => {
    res.header(
      'Access-Control-Allow-Origin',
      'http://localhost:3000',
      'https://52d3-2a02-2f08-d106-c300-70dd-50f2-5394-12aa.ngrok-free.app',
      'https://enablment-tt.vercel.app',
    );
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept',
    );
    if (req.method === 'OPTIONS') {
      res.header(
        'Access-Control-Allow-Methods',
        'PUT, POST, PATCH, DELETE, GET',
      );
      return res.status(200).json({});
    }
    next();
  });

  await app.listen(process.env.PORT || 8080);
}

bootstrap();
