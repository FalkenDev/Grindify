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

import { describe, it, expect, beforeEach } from 'vitest'
import {
  __resetSessionGuardForTests,
  bumpSessionGeneration,
  getSessionGeneration,
  isAuthEndpoint,
  isLogoutInProgress,
  runExclusiveLogout,
  shouldEndSession,
} from '../sessionGuard'

const API = 'http://localhost:8393/v1'

describe('runExclusiveLogout', () => {
  beforeEach(() => __resetSessionGuardForTests())

  it('coalesces concurrent logout calls into a single run', async () => {
    let runs = 0
    let release!: () => void
    const gate = new Promise<void>(resolve => (release = resolve))
    const task = async () => {
      runs++
      await gate
    }

    const calls = Array.from({ length: 50 }, () => runExclusiveLogout(task))
    expect(isLogoutInProgress()).toBe(true)
    expect(new Set(calls).size).toBe(1)

    release()
    await Promise.all(calls)
    expect(runs).toBe(1)
    expect(isLogoutInProgress()).toBe(false)
  })

  it('ignores logout calls made from inside a running logout (re-entrancy)', async () => {
    let runs = 0
    const nested: Promise<void>[] = []
    const outer = runExclusiveLogout(async () => {
      runs++
      // e.g. a store refetch during cleanup gets a 401 and calls logout again
      nested.push(runExclusiveLogout(async () => void runs++))
      nested.push(runExclusiveLogout(async () => void runs++))
    })
    await outer
    expect(runs).toBe(1)
    expect(nested.every(p => p === outer)).toBe(true)
  })

  it('allows a new logout after the previous one finished, and releases on failure', async () => {
    await expect(
      runExclusiveLogout(async () => {
        throw new Error('boom')
      })
    ).rejects.toThrow('boom')
    expect(isLogoutInProgress()).toBe(false)

    let runs = 0
    await runExclusiveLogout(async () => {
      runs++
    })
    expect(runs).toBe(1)
  })

  it('bumps the session generation when a logout starts', () => {
    const before = getSessionGeneration()
    void runExclusiveLogout(async () => undefined)
    expect(getSessionGeneration()).toBe(before + 1)
  })
})

describe('shouldEndSession', () => {
  beforeEach(() => __resetSessionGuardForTests())

  it('ends the current authenticated session on 401', () => {
    expect(
      shouldEndSession({ url: `${API}/users`, generationAtStart: getSessionGeneration(), isAuthenticated: true })
    ).toBe(true)
  })

  it('does nothing when the user is not logged in', () => {
    expect(
      shouldEndSession({ url: `${API}/users`, generationAtStart: getSessionGeneration(), isAuthenticated: false })
    ).toBe(false)
  })

  it('does nothing while a logout is in progress', async () => {
    let release!: () => void
    const gate = new Promise<void>(resolve => (release = resolve))
    const done = runExclusiveLogout(() => gate)
    expect(
      shouldEndSession({ url: `${API}/workouts`, generationAtStart: getSessionGeneration(), isAuthenticated: true })
    ).toBe(false)
    release()
    await done
  })

  it('ignores responses to requests started before the last login/logout', () => {
    const generationAtStart = getSessionGeneration()
    bumpSessionGeneration() // e.g. a new login happened meanwhile
    expect(shouldEndSession({ url: `${API}/workouts`, generationAtStart, isAuthenticated: true })).toBe(false)
  })

  it('never ends the session for auth endpoints (logout, login, ...)', () => {
    const generationAtStart = getSessionGeneration()
    for (const path of ['auth/logout', 'auth/login', 'auth/verify-email']) {
      expect(isAuthEndpoint(`${API}/${path}`)).toBe(true)
      expect(shouldEndSession({ url: `${API}/${path}`, generationAtStart, isAuthenticated: true })).toBe(false)
    }
    expect(isAuthEndpoint(`${API}/users`)).toBe(false)
  })
})
