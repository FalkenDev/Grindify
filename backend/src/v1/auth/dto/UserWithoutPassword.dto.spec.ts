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

import { User } from '../../user/user.entity';
import { UserWithoutPasswordDto } from './UserWithoutPassword.dto';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: 'user@example.com',
    firstName: 'Test',
    lastName: 'User',
    weight: 82.5,
    height: 180,
    dateOfBirth: new Date('1990-01-01'),
    gender: 'male',
    targetWeight: 78,
    startWeight: 85,
    primaryGoal: 'strength',
    healthDataConsentAt: null,
    ...overrides,
  } as unknown as User;
}

describe('UserWithoutPasswordDto', () => {
  it('masks health data when health data consent is missing', () => {
    const dto = new UserWithoutPasswordDto(makeUser());

    expect(dto.healthDataConsent).toBe(false);
    expect(dto.weight).toBeNull();
    expect(dto.height).toBeNull();
    expect(dto.dateOfBirth).toBeNull();
    expect(dto.gender).toBeNull();
    expect(dto.targetWeight).toBeNull();
    expect(dto.startWeight).toBeNull();
    // Non-health fields are unaffected
    expect(dto.primaryGoal).toBe('strength');
  });

  it('exposes health data when the user has consented', () => {
    const dto = new UserWithoutPasswordDto(
      makeUser({ healthDataConsentAt: new Date() }),
    );

    expect(dto.healthDataConsent).toBe(true);
    expect(dto.weight).toBe(82.5);
    expect(dto.height).toBe(180);
    expect(dto.gender).toBe('male');
    expect(dto.targetWeight).toBe(78);
    expect(dto.startWeight).toBe(85);
  });
});
