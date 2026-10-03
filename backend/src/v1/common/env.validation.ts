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

const WEAK_SECRET_MARKERS = ['change-me', 'changeme'];
const WEAK_DB_PASSWORDS = ['', 'password', 'postgres', 'changeme', 'change-me'];

/**
 * Refuse to start in production with missing or obviously weak secrets.
 * Throws with a list of all problems found.
 */
export function validateProductionEnv(env: NodeJS.ProcessEnv = process.env) {
  if (env.NODE_ENV !== 'production') return;

  const problems: string[] = [];

  const jwtSecret = env.JWT_SECRET ?? '';
  if (jwtSecret.length < 32) {
    problems.push('JWT_SECRET must be at least 32 characters');
  }
  if (WEAK_SECRET_MARKERS.some((m) => jwtSecret.toLowerCase().includes(m))) {
    problems.push('JWT_SECRET must not be a placeholder value (change-me)');
  }

  const dbPassword = env.DATABASE_PASSWORD ?? '';
  if (WEAK_DB_PASSWORDS.includes(dbPassword.toLowerCase())) {
    problems.push(
      'DATABASE_PASSWORD must be set to a strong, non-default value',
    );
  }

  if (problems.length) {
    throw new Error(
      `Refusing to start in production due to insecure configuration:\n - ${problems.join('\n - ')}`,
    );
  }
}
