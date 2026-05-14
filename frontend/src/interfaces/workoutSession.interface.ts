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

import type { Workout } from './Workout.interface'
import type { Exercise as UserExercise } from './Exercise.interface'
import type { I18nString } from './i18n.types'

export interface PerformedSet {
  setNumber: number
  weight?: number
  reps?: number
  // Cardio fields
  distance?: number
  duration?: number
  calories?: number
}

export interface FinishedExercisePayload {
  exerciseId: number
  rpe?: number
  notes?: string
  sets: PerformedSet[]
}

export interface FinishSessionPayload {
  completedExercises: FinishedExercisePayload[]
  notes?: string
}

export interface UpdateWorkoutSessionDto {
  notes?: string
  caloriesBurned?: number | null
  durationMinutes?: number
  status?: 'in_progress' | 'finished' | 'abandoned'
  endedAt?: string
}

export interface WorkoutSession {
  id: number
  userId: number
  startedAt: string
  endedAt?: string
  status: 'in_progress' | 'finished' | 'abandoned'
  notes?: string
  workout?: Workout | null
  exercises: {
    id: number
    exerciseId: number
    exercise?: UserExercise
    sets: PerformedSet[]
    notes?: string
  }[]
  totalWeight: number
  exerciseStats: {
    exerciseId: number
    totalWeight: number
    id: number
  }[]
  scheduledSessionId?: number
  caloriesBurned?: number | null
  newRecords?: {
    exercise?: { title: I18nString }
    value: number
    recordType: string
  }[]
  createdAt: string
  updatedAt: string
}

export interface tempWorkoutSession {
  id?: number
  userId?: number
  startedAt?: string
  endedAt?: string
  status?: 'in_progress' | 'finished' | 'abandoned'
  notes?: string
  workout?: Workout | null
  exercises?: {
    id?: number
    exerciseId?: number
    exercise?: UserExercise
    sets?: PerformedSet[]
    notes?: string
  }[]
  createdAt?: string
  updatedAt?: string
}
