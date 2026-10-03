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

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService, OAuthResult } from '../auth/auth.service';
import { CookieStateStore } from './cookieState.store';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') as string,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') as string,
      callbackURL: `${configService.get<string>('BACKEND_URL') ?? 'http://localhost:1337'}/v1/auth/google/callback`,
      scope: ['profile', 'email'],
      state: true,
      store: new CookieStateStore('google'),
    } as any);
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
  ): Promise<OAuthResult> {
    const emailVerified =
      profile._json?.email_verified === true ||
      profile._json?.email_verified === 'true';
    const email: string | undefined = emailVerified
      ? (profile.emails?.[0]?.value ?? profile._json?.email)
      : undefined;
    const firstName =
      profile.name?.givenName ?? profile.displayName?.split(' ')[0] ?? '';
    const lastName =
      profile.name?.familyName ??
      profile.displayName?.split(' ').slice(1).join(' ') ??
      '';
    const avatar = profile.photos?.[0]?.value;

    return this.authService.findOrCreateOAuthUser('google', {
      providerId: String(profile.id),
      email,
      firstName,
      lastName,
      avatar,
    });
  }
}
