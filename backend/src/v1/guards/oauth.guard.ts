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
  Injectable,
  NotFoundException,
  Type,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard, IAuthGuard } from '@nestjs/passport';

export type OAuthProvider = 'github' | 'google';

const OAUTH_ENV_KEYS: Record<OAuthProvider, [string, string]> = {
  github: ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET'],
  google: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
};

/**
 * A provider is enabled when both its client id and secret are set. The
 * passport strategy is only registered in that case (see auth.module.ts).
 */
export function isOAuthProviderConfigured(
  configService: ConfigService,
  provider: OAuthProvider,
): boolean {
  const [idKey, secretKey] = OAUTH_ENV_KEYS[provider];
  return (
    !!configService.get<string>(idKey)?.trim() &&
    !!configService.get<string>(secretKey)?.trim()
  );
}

/**
 * Responds 404 when the provider is not configured, instead of letting
 * passport fail with "Unknown authentication strategy" (500). Must be listed
 * before the passport guard.
 */
export function OAuthEnabledGuard(provider: OAuthProvider): Type<CanActivate> {
  @Injectable()
  class OAuthEnabledGuardImpl implements CanActivate {
    constructor(private readonly configService: ConfigService) {}

    canActivate(): boolean {
      if (!isOAuthProviderConfigured(this.configService, provider)) {
        throw new NotFoundException(`${provider} login is not enabled`);
      }
      return true;
    }
  }
  return OAuthEnabledGuardImpl;
}

/**
 * Passport guard for OAuth callbacks that never throws: failures (invalid
 * state, denied consent, provider errors) leave `req.user` undefined so the
 * controller can redirect the browser back to the frontend with an error
 * instead of returning a JSON 401 page.
 */
export function OAuthGuard(provider: OAuthProvider): Type<IAuthGuard> {
  @Injectable()
  class OAuthGuardImpl extends AuthGuard(provider) {
    handleRequest<TUser = any>(err: any, user: any): TUser {
      if (err || !user) {
        return undefined as TUser;
      }
      return user as TUser;
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
      try {
        await super.canActivate(context);
      } catch {
        // swallow — handled in the controller
      }
      return true;
    }
  }
  return OAuthGuardImpl;
}
