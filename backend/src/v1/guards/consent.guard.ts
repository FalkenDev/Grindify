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
 * Blocks access until the user has accepted the current terms.
 * Must run after JwtAuthGuard (relies on `req.user.consentRequired`).
 */
@Injectable()
export class ConsentGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (!req.user || req.user.consentRequired !== false) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'CONSENT_REQUIRED',
        message: 'Consent required',
      });
    }
    return true;
  }
}
