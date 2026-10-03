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

import * as crypto from 'crypto';

export type CodePurpose = 'verify' | 'reset';

/**
 * One-time codes are only 6 digits, so they are stored as an HMAC keyed with
 * the server secret and bound to user + purpose (never a bare sha256).
 */
export function hashOneTimeCode(
  secret: string,
  purpose: CodePurpose,
  userId: number,
  code: string,
): string {
  return crypto
    .createHmac('sha256', secret)
    .update(`${purpose}:${userId}:${code}`)
    .digest('hex');
}

export function generateOneTimeCode(
  secret: string,
  purpose: CodePurpose,
  userId: number,
): { code: string; hash: string; expires: Date } {
  const code = crypto.randomInt(100000, 1000000).toString();
  const hash = hashOneTimeCode(secret, purpose, userId, code);
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  return { code, hash, expires };
}
