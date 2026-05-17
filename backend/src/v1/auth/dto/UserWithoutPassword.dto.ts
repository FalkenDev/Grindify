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

export class UserWithoutPasswordDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ required: false })
  avatar?: string;

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

  @ApiProperty({ required: false })
  weight?: number;

  @ApiProperty({ required: false })
  height?: number;

  @ApiProperty({ required: false })
  dateOfBirth?: Date;

  @ApiProperty({ required: false })
  gender?: string;

  @ApiProperty({ required: false })
  primaryGoal?: string;

  @ApiProperty({ required: false })
  targetWeight?: number;

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

  @ApiProperty({ required: false })
  startWeight?: number;

  @ApiProperty({ default: 'default' })
  language: 'default' | 'eng' | 'swe';

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.avatar = user.avatar;
    this.showRpe = user.showRpe ?? true;
    this.weeklyWorkoutGoal = user.weeklyWorkoutGoal ?? 3;
    this.currentStreak = user.currentStreak ?? 0;
    this.currentWeekWorkouts = user.currentWeekWorkouts ?? 0;
    this.unitScale = user.unitScale;
    this.weight = user.weight;
    this.height = user.height;
    this.dateOfBirth = user.dateOfBirth;
    this.gender = user.gender;
    this.primaryGoal = user.primaryGoal;
    this.targetWeight = user.targetWeight ?? undefined;
    this.goalTimeframe = user.goalTimeframe ?? undefined;
    this.onboardingCompleted = user.onboardingCompleted ?? false;
    this.emailVerified = user.emailVerified ?? false;
    this.showWeightTracking = user.showWeightTracking ?? false;
    this.weightGoalType = user.weightGoalType ?? undefined;
    this.startWeight = user.startWeight;
    this.role = user.role ?? 'user';
    this.language = user.language ?? 'default';
  }
}
