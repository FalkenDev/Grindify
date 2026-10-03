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

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/**
 * Blocks health data endpoints (weight logs, progress photos) until the user
 * has given the voluntary, explicit health data consent (GDPR art. 9).
 * Must run after JwtAuthGuard (relies on `req.user.healthDataConsent`).
 */
@Injectable()
export class HealthConsentGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (!req.user || req.user.healthDataConsent !== true) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'HEALTH_CONSENT_REQUIRED',
        message: 'Health data consent required',
      });
    }
    return true;
  }
}
