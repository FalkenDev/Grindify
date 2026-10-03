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

import { describe, expect, it } from 'vitest'
import { safeRedirectPath } from '../safeRedirect'

describe('safeRedirectPath', () => {
  it('allows internal paths', () => {
    expect(safeRedirectPath('/')).toBe('/')
    expect(safeRedirectPath('/onboarding')).toBe('/onboarding')
    expect(safeRedirectPath('/session/12?x=1')).toBe('/session/12?x=1')
    expect(safeRedirectPath(['/calendar'])).toBe('/calendar')
  })

  it('rejects external or malformed targets', () => {
    expect(safeRedirectPath('//evil.com')).toBe('/')
    expect(safeRedirectPath('/\\evil.com')).toBe('/')
    expect(safeRedirectPath('https://evil.com')).toBe('/')
    expect(safeRedirectPath('javascript:alert(1)')).toBe('/')
    expect(safeRedirectPath('/\n/evil.com')).toBe('/')
    expect(safeRedirectPath(undefined)).toBe('/')
    expect(safeRedirectPath(null, '/login')).toBe('/login')
    expect(safeRedirectPath(42)).toBe('/')
  })
})
