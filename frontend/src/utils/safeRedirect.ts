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

/**
 * Only allow internal, app-relative redirect targets (prevents open redirects).
 * Accepts paths starting with a single '/' – rejects '//host', '/\host',
 * absolute URLs and anything containing control characters.
 */
export const safeRedirectPath = (value: unknown, fallback = '/'): string => {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string' || raw.length === 0) return fallback
  if (!raw.startsWith('/')) return fallback
  if (raw.startsWith('//') || raw.startsWith('/\\')) return fallback
  if (/[\u0000-\u001F\u007F]/.test(raw)) return fallback
  return raw
}
