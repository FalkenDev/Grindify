/*
 * Copyright (c) 2026 FalkenDev
 *
 * This file is part of Grindify.
 *
 * Grindify is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with Grindify. If not, see
 * <https://www.gnu.org/licenses/>.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as basicAuth from 'express-basic-auth';
import helmet from 'helmet';
import { AuthExceptionsFilter } from './filters/authException.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { Request, Response, NextFunction } from 'express';
import { validateProductionEnv } from './common/env.validation';
import { PUBLIC_UPLOAD_DIRS } from './upload/upload.constants';
import { VALIDATION_PIPE_OPTIONS } from './common/constants';

const SWAGGER_PATHS = ['/api/docs', '/api/docs-json', '/api/docs-yaml'];

function parseTrustProxy(raw: string | undefined): boolean | number | string {
  if (raw === undefined || raw.trim() === '') {
    // Behind Traefik / Cloudflare Tunnel on a private network by default
    return 'loopback, linklocal, uniquelocal';
  }
  const value = raw.trim().toLowerCase();
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  return raw;
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Refuse to start in production with weak / default secrets
  validateProductionEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Correct client IPs (rate limiting, audit log) behind reverse proxies
  app.set('trust proxy', parseTrustProxy(process.env.TRUST_PROXY));
  app.disable('x-powered-by');

  const swaggerEnabled = process.env.SWAGGER_ENABLED === 'true';
  const swaggerUser = process.env.SWAGGER_USER;
  const swaggerPassword = process.env.SWAGGER_PASSWORD;
  const swaggerActive = swaggerEnabled && !!swaggerUser && !!swaggerPassword;
  if (swaggerEnabled && !swaggerActive) {
    logger.error(
      'SWAGGER_ENABLED=true but SWAGGER_USER / SWAGGER_PASSWORD are missing — Swagger will NOT be started',
    );
  }

  // Security headers. The API only serves JSON (+ uploaded images), so the
  // CSP is locked down completely; images must be loadable cross-origin by
  // the frontend / admin panel.
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
    }),
  );
  if (swaggerActive) {
    // Swagger UI needs scripts/styles from self
    app.use(
      SWAGGER_PATHS,
      helmet({
        contentSecurityPolicy: {
          useDefaults: false,
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            frameAncestors: ["'none'"],
          },
        },
        crossOriginResourcePolicy: { policy: 'same-origin' },
      }),
    );
  }

  // Read allowed origins from env (comma-separated)
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3000'];
  app.use(cookieParser());

  app.useGlobalFilters(new AuthExceptionsFilter());
  app.useGlobalPipes(new ValidationPipe(VALIDATION_PIPE_OPTIONS));

  if (swaggerActive) {
    app.use(
      SWAGGER_PATHS,
      basicAuth({
        users: { [swaggerUser as string]: swaggerPassword as string },
        challenge: true,
      }),
    );
  }

  // Cache-control and no-store headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.removeHeader?.('ETag');
    next();
  });

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    // Lets the browser read the file name of downloads (e.g. ZIP exports)
    exposedHeaders: ['Content-Disposition'],
  });

  app.setGlobalPrefix('v1');

  // Serve only the public upload directories, each with its own static root.
  // The uploads root itself is never served, so progress photos (health data)
  // are not reachable through any path variant (`//`, `./`, `../`, percent-
  // encoding): they are only available via the authenticated
  // GET /v1/progress-photos/:id/file endpoint.
  for (const dir of PUBLIC_UPLOAD_DIRS) {
    app.useStaticAssets(join(process.cwd(), 'uploads', dir), {
      prefix: `/uploads/${dir}/`,
      dotfiles: 'deny',
      index: false,
      redirect: false,
    });
  }

  if (swaggerActive) {
    const config = new DocumentBuilder()
      .setTitle('Grindify-Api Documentation')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(1337, '0.0.0.0');
  logger.log(
    `Application is running on: ${await app.getUrl()}${swaggerActive ? ' (Swagger: /api/docs)' : ''}`,
  );
}

void bootstrap();
