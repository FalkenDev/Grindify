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

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { JWT_ALGORITHM } from '../common/constants';
import { AUTH_COOKIE_NAME } from '../common/cookie.util';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in the environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req?.cookies?.[AUTH_COOKIE_NAME] || null;
        },
      ]),
      secretOrKey: jwtSecret,
      ignoreExpiration: false,
      algorithms: [JWT_ALGORITHM],
    });
  }

  async validate(payload: any) {
    if (!payload || typeof payload.id !== 'number') {
      throw new UnauthorizedException('Invalid token payload');
    }
    const state = await this.userService.findAuthState(payload.id);
    if (!state) {
      throw new UnauthorizedException('User not found');
    }
    // Tokens issued before logout / password change carry an old version
    if (typeof payload.tv !== 'number' || payload.tv !== state.tokenVersion) {
      throw new UnauthorizedException('Token revoked');
    }
    return {
      id: state.id,
      email: state.email,
      role: state.role,
      consentRequired: state.consentRequired,
      healthDataConsent: state.healthDataConsent,
    };
  }
}
