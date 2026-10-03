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

// stores/authStore.ts
import { defineStore } from 'pinia'
import * as workoutService from '@/services/workout.service'
import type { Workout } from '@/interfaces/Workout.interface'
import { useAuthStore } from './auth.store'

export const useWorkoutStore = defineStore(
  'workoutStore',
  () => {
    const authStore = useAuthStore()
    const workouts = ref<Workout[]>([])
    const currentWorkout = ref<Workout | null>(null)
    const isLoading = ref<boolean>(false)
    const lastFetched = ref<number | null>(null)
    const cacheDuration = 10 * 1000

    const setWorkouts = async (reload = false) => {
      // Never fetch user data without a session (e.g. during/after logout).
      if (!authStore.isAuthenticated) return
      const now = Date.now()
      if (
        workouts.value &&
        !reload &&
        lastFetched.value &&
        now - lastFetched.value < cacheDuration
      ) {
        return
      }

      try {
        isLoading.value = true
        workouts.value = await workoutService.fetchAllWorkouts()
        if (currentWorkout.value) {
          const currentWorkoutId = currentWorkout.value.id
          const foundWorkout = workouts.value.find(w => w.id === currentWorkoutId)
          if (foundWorkout) {
            currentWorkout.value = foundWorkout
          } else {
            currentWorkout.value = null
          }
        }
        lastFetched.value = now
      } catch (error) {
        console.error('Error fetching workouts:', error)
      } finally {
        isLoading.value = false
      }
    }

    // Only fetch workouts when authenticated; otherwise avoid 401 loops on app boot.
    watch(
      () => authStore.isAuthenticated,
      authed => {
        if (authed) {
          void setWorkouts(true)
        }
      },
      { immediate: true }
    )

    // Re-fetch when the app regains visibility (e.g. switching back from another device/tab).
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      const onVisible = () => {
        if (document.visibilityState === 'visible' && authStore.isAuthenticated) {
          void setWorkouts(true)
        }
      }
      const onFocus = () => {
        if (authStore.isAuthenticated) {
          void setWorkouts(true)
        }
      }
      document.addEventListener('visibilitychange', onVisible)
      window.addEventListener('focus', onFocus)
    }

    const setCurrentWorkout = async (workoutId: number) => {
      if (!Number.isFinite(workoutId)) {
        currentWorkout.value = null
        return false
      }

      const existingWorkout = workouts.value.find(w => w.id === workoutId)
      if (existingWorkout) {
        currentWorkout.value = existingWorkout
        return true
      }

      await setWorkouts(true)
      const workout = workouts.value.find(w => w.id === workoutId)
      if (workout) {
        currentWorkout.value = workout
        return true
      }

      currentWorkout.value = null
      console.warn(`Workout with ID ${workoutId} not found.`)
      return false
    }

    const resetStore = async () => {
      workouts.value = []
      isLoading.value = false
      currentWorkout.value = null
      lastFetched.value = null
      if (authStore.isAuthenticated) {
        await setWorkouts(true)
      }
    }

    return {
      workouts,
      isLoading,
      currentWorkout,
      setCurrentWorkout,
      setWorkouts,
      resetStore,
    }
  },
  {
    persist: true,
  }
)
