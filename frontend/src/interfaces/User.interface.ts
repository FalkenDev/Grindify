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

export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  avatar?: string
  showRpe?: boolean
  weeklyWorkoutGoal?: number
  currentStreak?: number
  currentWeekWorkouts?: number
  unitScale?: string
  weight?: number
  height?: number
  dateOfBirth?: string
  gender?: string
  primaryGoal?: string
  targetWeight?: number
  goalTimeframe?: number
  onboardingCompleted?: boolean
  language?: 'default' | 'eng' | 'swe'
  showWeightTracking?: boolean
  weightGoalType?: string
  startWeight?: number
  createdAt: string
  updatedAt: string
}

export interface StreakInfo {
  currentStreak: number
  weeklyWorkoutGoal: number
  currentWeekWorkouts: number
  progressPercentage: number
  streakFreezes: number
  freezeUsedThisWeek: boolean
  streakFreezeUsedWeek: string | null
}

export interface CreateUser {
  email: string
  password: string
  firstName: string
  lastName: string
}
