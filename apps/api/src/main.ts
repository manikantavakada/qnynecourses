import 'reflect-metadata';
import cookieParser from 'cookie-parser';
import express from 'express';
import type { Request } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const sentryDsn = config.get<string>('SENTRY_DSN');
  if (sentryDsn) Sentry.init({ dsn: sentryDsn, environment: config.get<string>('NODE_ENV') ?? 'development' });

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    express.json({
      verify: (req: Request & { rawBody?: Buffer }, _res, buf) => {
        req.rawBody = Buffer.from(buf);
      },
    }),
  );
  app.use(cookieParser());
  app.use(pinoHttp());
  app.use('/uploads', express.static('uploads', {
    setHeaders: (res, filePath) => {
      if (filePath.replace(/\\/g, '/').includes('uploads/videos/')) {
        res.setHeader('Content-Type', 'video/mp4');
      }
    },
  }));
  app.enableCors({
    origin: config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (config.get<string>('NODE_ENV') !== 'production') {
    const swagger = new DocumentBuilder()
      .setTitle('Qnyne Course Platform API')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('/docs', app, SwaggerModule.createDocument(app, swagger));
  }

  await app.listen(config.get<number>('PORT') ?? 4000);
}

void bootstrap();
