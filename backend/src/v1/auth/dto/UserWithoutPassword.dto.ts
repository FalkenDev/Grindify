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

import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/v1/user/user.entity';
import {
  hasHealthDataConsent,
  isConsentRequired,
} from '../../common/consent.util';

export class UserWithoutPasswordDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ required: false, nullable: true })
  avatar?: string | null;

  @ApiProperty({ default: true })
  showRpe: boolean;

  @ApiProperty({ default: 3 })
  weeklyWorkoutGoal: number;

  @ApiProperty({ default: 0 })
  currentStreak: number;

  @ApiProperty({ default: 0 })
  currentWeekWorkouts: number;

  @ApiProperty({ required: false })
  unitScale?: string;

  // Health data (GDPR art. 9): null unless the user has given health data
  // consent. The stored values are not touched.
  @ApiProperty({ required: false, nullable: true })
  weight?: number | null;

  @ApiProperty({ required: false, nullable: true })
  height?: number | null;

  @ApiProperty({ required: false, nullable: true })
  dateOfBirth?: Date | null;

  @ApiProperty({ required: false, nullable: true })
  gender?: string | null;

  @ApiProperty({ required: false })
  primaryGoal?: string;

  @ApiProperty({ required: false, nullable: true })
  targetWeight?: number | null;

  @ApiProperty({ required: false })
  goalTimeframe?: number;

  @ApiProperty({ default: false })
  onboardingCompleted: boolean;

  @ApiProperty({ default: false })
  emailVerified: boolean;

  @ApiProperty({ default: 'user' })
  role: 'user' | 'superadmin';

  @ApiProperty({ default: false })
  showWeightTracking: boolean;

  @ApiProperty({ required: false })
  weightGoalType?: string;

  @ApiProperty({ required: false, nullable: true })
  startWeight?: number | null;

  @ApiProperty({ default: 'default' })
  language: 'default' | 'eng' | 'swe';

  @ApiProperty({ required: false, nullable: true })
  termsAcceptedAt: Date | null;

  @ApiProperty({ required: false, nullable: true })
  termsVersion: string | null;

  @ApiProperty({ required: false, nullable: true })
  healthDataConsentAt: Date | null;

  @ApiProperty({
    description: 'True when the user must (re-)accept the current terms',
  })
  consentRequired: boolean;

  @ApiProperty({
    description: 'True when the user has consented to health data processing',
  })
  healthDataConsent: boolean;

  @ApiProperty({
    description: 'True when the account has a password (vs. OAuth-only)',
  })
  hasPassword: boolean;

  constructor(user: User, opts?: { hasPassword?: boolean }) {
    this.id = user.id;
    this.email = user.email;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    // Only locally stored avatars are ever exposed
    this.avatar =
      typeof user.avatar === 'string' && user.avatar.startsWith('/uploads/')
        ? user.avatar
        : null;
    this.showRpe = user.showRpe ?? true;
    this.weeklyWorkoutGoal = user.weeklyWorkoutGoal ?? 3;
    this.currentStreak = user.currentStreak ?? 0;
    this.currentWeekWorkouts = user.currentWeekWorkouts ?? 0;
    const healthConsent = hasHealthDataConsent(user);
    this.unitScale = user.unitScale;
    this.weight = healthConsent ? user.weight : null;
    this.height = healthConsent ? user.height : null;
    this.dateOfBirth = healthConsent ? user.dateOfBirth : null;
    this.gender = healthConsent ? user.gender : null;
    this.primaryGoal = user.primaryGoal;
    this.targetWeight = healthConsent ? (user.targetWeight ?? undefined) : null;
    this.goalTimeframe = user.goalTimeframe ?? undefined;
    this.onboardingCompleted = user.onboardingCompleted ?? false;
    this.emailVerified = user.emailVerified ?? false;
    this.showWeightTracking = user.showWeightTracking ?? false;
    this.weightGoalType = user.weightGoalType ?? undefined;
    this.startWeight = healthConsent ? user.startWeight : null;
    this.role = user.role ?? 'user';
    this.language = user.language ?? 'default';
    this.termsAcceptedAt = user.termsAcceptedAt ?? null;
    this.termsVersion = user.termsVersion ?? null;
    this.healthDataConsentAt = user.healthDataConsentAt ?? null;
    this.consentRequired = isConsentRequired(user);
    this.healthDataConsent = healthConsent;
    this.hasPassword = opts?.hasPassword ?? !!user.password;
  }
}
