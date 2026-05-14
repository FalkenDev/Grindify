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

import type { I18nString, I18nStringArray } from './i18n.types'

export type ExerciseType = 'compound' | 'isolation' | 'bodyweight'

export interface ExerciseMedia {
  id: number
  type: 'image' | 'video'
  url: string
  order: number
}

export interface Exercise {
  id: number
  title: I18nString
  description?: I18nString | null
  image?: string | null
  exerciseType?: ExerciseType | null
  muscleGroups: MuscleGroup[]
  primaryMuscleGroups?: MuscleGroup[]
  equipment?: string[]
  instructions?: I18nStringArray
  proTips?: I18nStringArray
  mistakes?: I18nStringArray
  media?: ExerciseMedia[]
  isGlobal: boolean
  personalizedFromGlobalId?: number | null
  personalizedAt?: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface CreateExercise {
  name: string
  description?: string
  image?: string | null
  exerciseType?: ExerciseType | null
  muscleGroupIds: number[]
  primaryMuscleGroupIds?: number[]
  equipment?: string[]
  instructions?: string[]
  proTips?: string[]
  mistakes?: string[]
}

export interface UpdateExercise {
  id: number
  name: string
  description?: string
  image?: string | null
  exerciseType?: ExerciseType | null
  muscleGroupIds: number[]
  primaryMuscleGroupIds?: number[]
  equipment?: string[]
  instructions?: string[]
  proTips?: string[]
  mistakes?: string[]
}

export interface MuscleGroup {
  id: number
  name: string
  nameI18n?: I18nString
  descriptionI18n?: I18nString
  createdAt: string
  updatedAt: string
}
