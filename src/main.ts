import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { createClient } from 'redis';

import { AppModule } from './app.module';

export const client = createClient({
  url: 'redis://redis:6379',
});
async function bootstrap() {
  await client.connect();
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'http://localhost:4300',
      'http://localhost:5000',
      'http://localhost:3000',
    ],
    credentials: true,
  });
  await app.listen(3000);
}
bootstrap();
