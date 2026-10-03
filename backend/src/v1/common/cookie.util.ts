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

import { CookieOptions, Request } from 'express';
import { JWT_EXPIRES_IN_SECONDS } from './constants';

export const AUTH_COOKIE_NAME = 'auth_token';

function isLocalhostRequest(req?: Request): boolean {
  const host = req?.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

function parseSameSite(): CookieOptions['sameSite'] {
  const raw = process.env.AUTH_COOKIE_SAMESITE?.toLowerCase();
  if (raw === 'lax' || raw === 'strict' || raw === 'none') return raw;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return 'lax';
}

function parseSecure(): boolean {
  const raw = process.env.AUTH_COOKIE_SECURE?.toLowerCase();
  if (raw === 'true' || raw === '1') return true;
  if (raw === 'false' || raw === '0') return false;
  // Secure by default in production
  return process.env.NODE_ENV === 'production';
}

/**
 * Shared cookie options for cookies set by the API (auth + OAuth state).
 * Respects AUTH_COOKIE_SAMESITE / AUTH_COOKIE_SECURE / AUTH_COOKIE_DOMAIN /
 * AUTH_COOKIE_PATH. Local development over http://localhost never gets
 * Secure or Domain (outside of production).
 */
export function baseCookieOptions(req?: Request): CookieOptions {
  let sameSite = parseSameSite();
  let secure = parseSecure();
  let domain = process.env.AUTH_COOKIE_DOMAIN || undefined;
  const path = process.env.AUTH_COOKIE_PATH || '/';

  if (process.env.NODE_ENV !== 'production' && isLocalhostRequest(req)) {
    domain = undefined;
    secure = false;
    sameSite = 'lax';
  }

  // Browsers require Secure when SameSite=None
  if (sameSite === 'none') {
    secure = true;
  }

  return {
    httpOnly: true,
    secure,
    sameSite,
    path,
    ...(domain ? { domain } : {}),
  };
}

/** Options for setting the auth cookie (maxAge = JWT lifetime). */
export function authCookieOptions(req?: Request): CookieOptions {
  return {
    ...baseCookieOptions(req),
    maxAge: JWT_EXPIRES_IN_SECONDS * 1000,
  };
}

/** Options for clearing the auth cookie (must match the set options). */
export function clearAuthCookieOptions(req?: Request): CookieOptions {
  return baseCookieOptions(req);
}
