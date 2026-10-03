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
import { JwtService } from '@nestjs/jwt';
import { JWT_ALGORITHM } from '../common/constants';

export interface JwtPayload {
  id: number;
  email: string;
  /** tokenVersion of the user when the token was issued */
  tv: number;
}

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  sign(user: { id: number; email: string; tokenVersion?: number }): string {
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      tv: user.tokenVersion ?? 0,
    };
    return this.jwtService.sign(payload);
  }

  /** Returns the payload of a valid token, or null. Never throws. */
  verify(token: string | undefined | null): JwtPayload | null {
    if (!token) return null;
    try {
      return this.jwtService.verify<JwtPayload>(token, {
        algorithms: [JWT_ALGORITHM],
      });
    } catch {
      return null;
    }
  }
}
