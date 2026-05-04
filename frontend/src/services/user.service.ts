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

import type { CreateUser, User, StreakInfo } from '@/interfaces/User.interface'
import { fetchWrapper } from '@/utils/fetchWrapper'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8393/v1'

export const createUser = async (user: CreateUser) => {
  try {
    const data = await fetchWrapper<User>(`${apiUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    })
    return data
  } catch (error) {
    console.error('Error creating user:', error)
    throw new Error('Failed to create user')
  }
}

export const updateUser = async (userData: Partial<User>) => {
  try {
    const data = await fetchWrapper<User>(`${apiUrl}/users`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    })
    return data
  } catch (error) {
    console.error('Error updating user:', error)
    throw new Error('Failed to update user')
  }
}

export const deleteUser = async () => {
  try {
    await fetchWrapper<void>(`${apiUrl}/users`, {
      method: 'DELETE',
    })
    return true // deletion succeeded (204/200)
  } catch (error) {
    console.error('Error deleting user:', error)
    throw new Error('Failed to delete user')
  }
}

export const uploadAvatar = async (file: File) => {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const data = await fetchWrapper(`${apiUrl}/users/avatar`, {
      method: 'POST',
      body: formData,
    })
    return data
  } catch (error) {
    console.error('Error uploading avatar:', error)
    throw new Error('Failed to upload avatar')
  }
}

export const getCurrentUser = async () => {
  try {
    const data = await fetchWrapper<User>(`${apiUrl}/users`)
    return data
  } catch (error) {
    console.error('Error fetching current user:', error)
    throw new Error('Failed to fetch current user')
  }
}
export const getStreakInfo = async () => {
  try {
    const data = await fetchWrapper<StreakInfo>(`${apiUrl}/users/streak`)
    return data
  } catch (error) {
    console.error('Error fetching streak info:', error)
    throw new Error('Failed to fetch streak info')
  }
}

export const useStreakFreeze = async (date: string) => {
  try {
    const data = await fetchWrapper<StreakInfo>(`${apiUrl}/users/streak/freeze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date }),
    })
    return data
  } catch (error) {
    console.error('Error using streak freeze:', error)
    throw error
  }
}

export const updateWeeklyWorkoutGoal = async (weeklyWorkoutGoal: number) => {
  try {
    const data = await fetchWrapper<User>(`${apiUrl}/users/weekly-goal`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weeklyWorkoutGoal }),
    })
    return data
  } catch (error) {
    console.error('Error updating weekly workout goal:', error)
    throw new Error('Failed to update weekly workout goal')
  }
}

export const updateUserPreferences = async (preferences: Partial<User>) => {
  try {
    const data = await fetchWrapper<User>(`${apiUrl}/users/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences),
    })
    return data
  } catch (error) {
    console.error('Error updating user preferences:', error)
    throw new Error('Failed to update user preferences')
  }
}
