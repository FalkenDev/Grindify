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
 * Module-level session bookkeeping shared by the auth store and fetchWrapper.
 *
 * - Concurrent/repeated logout calls are coalesced into a single run.
 * - Every login/logout bumps a "session generation" so a 401/403 from a request
 *   that was started in an earlier session can't log out the current one (or
 *   trigger another logout while the previous one is still cleaning up).
 */

let logoutInFlight: Promise<void> | null = null
let sessionGeneration = 0

export const isLogoutInProgress = (): boolean => logoutInFlight !== null

export const getSessionGeneration = (): number => sessionGeneration

/** Mark the start of a new session (login) or the end of one (logout). */
export const bumpSessionGeneration = (): number => ++sessionGeneration

/**
 * Run `task` as the one and only logout. While it is running, every further call
 * returns the same promise instead of starting another logout.
 */
export const runExclusiveLogout = (task: () => Promise<void>): Promise<void> => {
  if (logoutInFlight) return logoutInFlight
  bumpSessionGeneration()
  // Start the task in a microtask so `logoutInFlight` is already set while it runs:
  // a logout triggered synchronously from inside the task joins this one too.
  logoutInFlight = Promise.resolve()
    .then(task)
    .finally(() => {
      logoutInFlight = null
    })
  return logoutInFlight
}

/**
 * Auth endpoints (login, logout, register, verify, password reset) answer 401/403
 * for bad credentials or unverified email — not for an expired session — so they
 * must never trigger an automatic logout.
 */
export const isAuthEndpoint = (url: string): boolean => {
  try {
    return new URL(url, 'http://localhost').pathname.includes('/auth/')
  } catch {
    return url.includes('/auth/')
  }
}

/**
 * Whether an unauthorized/forbidden response should end the current session.
 * Returns false when nobody is logged in, a logout is already running, the request
 * belongs to an earlier session, or it targets an auth endpoint.
 */
export const shouldEndSession = (params: {
  url: string
  generationAtStart: number
  isAuthenticated: boolean
}): boolean => {
  if (isAuthEndpoint(params.url)) return false
  if (!params.isAuthenticated) return false
  if (isLogoutInProgress()) return false
  if (params.generationAtStart !== sessionGeneration) return false
  return true
}

/** Test helper: reset module state between tests. */
export const __resetSessionGuardForTests = (): void => {
  logoutInFlight = null
  sessionGeneration = 0
}
