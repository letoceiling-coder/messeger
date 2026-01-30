import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: process.env.NODE_ENV === 'production' 
      ? ['error', 'warn', 'log'] 
      : ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS настройки для production
  const corsOrigins = process.env.CORS_ORIGIN?.split(',') || true;
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Глобальный префикс для всех роутов
  app.setGlobalPrefix('api');

  const uploadsDir = join(__dirname, '..', 'uploads');
  for (const sub of ['audio', 'images', 'videos']) {
    const dir = join(uploadsDir, sub);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads/',
  });

  const port = process.env.PORT || 30000; // Используем порт 30000 для shared hosting
  await app.listen(port, '127.0.0.1'); // Слушаем только на localhost
  
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
