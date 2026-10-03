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

import { LoggerOptions } from 'typeorm';

const VALID_LEVELS = [
  'query',
  'schema',
  'error',
  'warn',
  'info',
  'log',
  'migration',
];

/**
 * TypeORM logging from DB_LOGGING (comma separated, e.g. "error,warn,query").
 * Defaults to errors and warnings only — queries (which may contain personal
 * data) are only logged when explicitly requested.
 */
export function getDbLogging(
  raw: string | undefined = process.env.DB_LOGGING,
): LoggerOptions {
  if (!raw || !raw.trim()) return ['error', 'warn'];
  const value = raw.trim().toLowerCase();
  if (value === 'false' || value === 'none' || value === 'off') return false;
  if (value === 'all' || value === 'true') return 'all';
  const levels = value
    .split(',')
    .map((l) => l.trim())
    .filter((l) => VALID_LEVELS.includes(l));
  return levels.length ? (levels as LoggerOptions) : ['error', 'warn'];
}
