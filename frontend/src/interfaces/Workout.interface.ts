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

import type { I18nString } from './i18n.types'

export type WorkoutType = 'strength' | 'cardio' | 'hiit' | 'flexibility' | 'endurance'

export interface Workout {
  id: number
  title: string
  time: number
  description?: string
  type?: WorkoutType | null
  exercises: Exercise[]
  targetMuscleGroups?: MuscleGroup[]
  defaultWeightAndReps: 'default' | 'latest'
  createdAt: Date
  updatedAt: Date
}

export interface Exercise {
  id: number
  order: number
  sets: number
  reps: number
  weight: number
  setWeights: number[] | null
  pauseSeconds: number
  exerciseId: number
  exercise: {
    id: number
    title: I18nString
    description?: I18nString | null
    img: string
    muscleGroups: MuscleGroup[]
    primaryMuscleGroups?: { id: number; name: string }[]
    isGlobal: boolean
    personalizedFromGlobalId?: number | null
    createdBy: string
    createdAt: string
    updatedAt: string
    deletedAt?: string | null
  }
}

export interface WorkoutSet {
  set: number
  previous: string
  weight: number
  reps: number
  done: boolean
}

type FinishedSetPayload = {
  setNumber: number
  weight: number
  reps: number
}

export interface WorkoutExercisePayload {
  exerciseId: number
  sets: [FinishedSetPayload, ...FinishedSetPayload[]]
}

export interface CreateWorkoutExercise {
  exerciseId: number
  order: number
  sets: number
  reps: number
  weight: number
  pauseSeconds: number
}

export interface CreateWorkout {
  title: string
  time: number
  description?: string
  type?: WorkoutType
  targetMuscleGroupIds?: number[]
}

export interface UpdateWorkout {
  title?: string
  time?: number
  description?: string
  type?: WorkoutType | null
  targetMuscleGroupIds?: number[]
  defaultWeightAndReps?: 'default' | 'latest'
}

export interface AddExerciseToWorkout {
  exerciseId: number
  order: number
  sets: number
  reps: number
  weight: number
  setWeights?: number[] | null
  pauseSeconds: number
}

export interface UpdateWorkoutExercise {
  sets?: number
  reps?: number
  weight?: number
  setWeights?: number[] | null
  pauseSeconds?: number
}

export interface MuscleGroup {
  id: number
  name: string
  nameI18n?: I18nString
  descriptionI18n?: I18nString
  createdAt: string
  updatedAt: string
}
