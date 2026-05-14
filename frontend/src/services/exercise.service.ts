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

import { fetchWrapper } from '@/utils/fetchWrapper'
import type { CreateExercise, Exercise, UpdateExercise } from '@/interfaces/Exercise.interface'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8393/v1'

export const fetchAllExercises = async (filter: 'all' | 'global' | 'mine' = 'all') => {
  try {
    const data = await fetchWrapper<Exercise[]>(`${apiUrl}/exercises?filter=${filter}`)
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error fetching exercises:', error)
    throw new Error('Failed to fetch exercises')
  }
}

export const duplicateExercise = async (exerciseId: number, transferStats: boolean = false) => {
  try {
    const data = await fetchWrapper<Exercise>(`${apiUrl}/exercises/${exerciseId}/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transferStats }),
    })
    return data
  } catch (error) {
    console.error('Error duplicating exercise:', error)
    throw new Error('Failed to duplicate exercise')
  }
}

export const fetchExerciseById = async (exerciseId: number) => {
  try {
    const data = await fetchWrapper<Exercise>(`${apiUrl}/exercises/${exerciseId}`)
    return data
  } catch (error) {
    console.error('Error fetching exercise:', error)
    throw new Error('Failed to fetch exercise')
  }
}

export const createExercise = async (exercise: CreateExercise) => {
  try {
    const data = await fetchWrapper<Exercise>(`${apiUrl}/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exercise),
    })
    return data
  } catch (error) {
    console.error('Error creating exercise:', error)
    throw new Error('Failed to create exercise')
  }
}

export const updateExercise = async (
  exerciseId: number,
  exercise: Partial<CreateExercise | UpdateExercise>
) => {
  try {
    const data = await fetchWrapper<Exercise>(`${apiUrl}/exercises/${exerciseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exercise),
    })
    return data
  } catch (error) {
    console.error('Error updating exercise:', error)
    throw new Error('Failed to update exercise')
  }
}

export const deleteExercise = async (exerciseId: number) => {
  try {
    await fetchWrapper<void>(`${apiUrl}/exercises/${exerciseId}`, {
      method: 'DELETE',
    })
    return true
  } catch (error) {
    console.error('Error deleting exercise:', error)
    throw new Error('Failed to delete exercise')
  }
}

export const uploadExerciseImage = async (exerciseId: number, file: File) => {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const data = await fetchWrapper(`${apiUrl}/exercises/${exerciseId}/image`, {
      method: 'POST',
      body: formData,
    })
    return data
  } catch (error) {
    console.error('Error uploading exercise image:', error)
    throw new Error('Failed to upload exercise image')
  }
}

export const uploadExerciseMedia = async (exerciseId: number, file: File) => {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const data = await fetchWrapper<Exercise>(`${apiUrl}/exercises/${exerciseId}/media`, {
      method: 'POST',
      body: formData,
    })
    return data
  } catch (error) {
    console.error('Error uploading exercise media:', error)
    throw new Error('Failed to upload exercise media')
  }
}

export const deleteExerciseMedia = async (exerciseId: number, mediaId: number) => {
  try {
    const data = await fetchWrapper<Exercise>(
      `${apiUrl}/exercises/${exerciseId}/media/${mediaId}`,
      { method: 'DELETE' }
    )
    return data
  } catch (error) {
    console.error('Error deleting exercise media:', error)
    throw new Error('Failed to delete exercise media')
  }
}

export const reorderExerciseMedia = async (exerciseId: number, mediaIds: number[]) => {
  try {
    const data = await fetchWrapper<Exercise>(`${apiUrl}/exercises/${exerciseId}/media/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaIds }),
    })
    return data
  } catch (error) {
    console.error('Error reordering exercise media:', error)
    throw new Error('Failed to reorder exercise media')
  }
}
