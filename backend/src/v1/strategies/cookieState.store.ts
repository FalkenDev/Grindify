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

import { Request } from 'express';
import { randomBytes, timingSafeEqual } from 'crypto';
import { baseCookieOptions } from '../common/cookie.util';

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

type StoreCallback = (err: Error | null, state?: string) => void;
type VerifyCallback = (
  err: Error | null,
  ok: boolean,
  state?: string | { message: string },
) => void;

/**
 * OAuth2 `state` store for passport-oauth2 that works without
 * express-session: the random state is kept in a short-lived, httpOnly
 * cookie scoped to the auth routes and compared (constant time) on callback.
 */
export class CookieStateStore {
  private readonly cookieName: string;

  constructor(provider: string) {
    this.cookieName = `oauth_state_${provider}`;
  }

  private cookieOptions(req: Request) {
    return {
      ...baseCookieOptions(req),
      // The OAuth callback is a top-level cross-site navigation, so the
      // cookie must be sent on it: Lax is the strictest value that works.
      sameSite: 'lax' as const,
    };
  }

  // Arity 3 → passport-oauth2 calls store(req, meta, cb)
  store(req: Request, _meta: unknown, callback: StoreCallback): void {
    try {
      const state = randomBytes(24).toString('base64url');
      req.res?.cookie(this.cookieName, state, {
        ...this.cookieOptions(req),
        maxAge: STATE_TTL_MS,
      });
      callback(null, state);
    } catch (err) {
      callback(err as Error);
    }
  }

  // Arity 4 → passport-oauth2 calls verify(req, state, meta, cb)
  verify(
    req: Request,
    providedState: string,
    _meta: unknown,
    callback: VerifyCallback,
  ): void {
    const expected: string | undefined = req.cookies?.[this.cookieName];
    req.res?.clearCookie(this.cookieName, this.cookieOptions(req));

    if (!expected || typeof providedState !== 'string') {
      return callback(null, false, { message: 'Invalid OAuth state' });
    }

    const a = Buffer.from(expected);
    const b = Buffer.from(providedState);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return callback(null, false, { message: 'Invalid OAuth state' });
    }

    return callback(null, true, providedState);
  }
}
