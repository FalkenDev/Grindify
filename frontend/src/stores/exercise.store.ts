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
import { ref } from 'vue'
import type { Exercise } from '@/interfaces/Exercise.interface'
import * as exerciseService from '@/services/exercise.service'
import { useAuthStore } from './auth.store'

export const useExerciseStore = defineStore(
  'exerciseStore',
  () => {
    const authStore = useAuthStore()
    const exercises = ref<Exercise[]>([])
    const isLoading = ref<boolean>(false)
    const lastFetched = ref<number | null>(null)
    const cacheDuration = 10 * 1000

    const setExercises = async (reload = false) => {
      // Never fetch user data without a session (e.g. during/after logout).
      if (!authStore.isAuthenticated) return
      const now = Date.now()
      if (
        exercises.value &&
        !reload &&
        lastFetched.value &&
        now - lastFetched.value < cacheDuration
      ) {
        return
      }

      try {
        isLoading.value = true
        exercises.value = await exerciseService.fetchAllExercises()
        lastFetched.value = now
      } catch (error) {
        console.error('Error fetching exercises:', error)
      } finally {
        isLoading.value = false
      }
    }

    // Only fetch exercises when authenticated; otherwise avoid 401 loops on app boot.
    watch(
      () => authStore.isAuthenticated,
      authed => {
        if (authed) {
          void setExercises(true)
        }
      },
      { immediate: true }
    )

    // Re-fetch when the app regains visibility (e.g. switching back from another device/tab).
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      const onVisible = () => {
        if (document.visibilityState === 'visible' && authStore.isAuthenticated) {
          void setExercises(true)
        }
      }
      const onFocus = () => {
        if (authStore.isAuthenticated) {
          void setExercises(true)
        }
      }
      document.addEventListener('visibilitychange', onVisible)
      window.addEventListener('focus', onFocus)
    }

    const resetStore = async () => {
      exercises.value = []
      isLoading.value = false
      lastFetched.value = null
      if (authStore.isAuthenticated) {
        await setExercises(true)
      }
    }

    return { exercises, isLoading, setExercises, resetStore }
  },
  {
    persist: true,
  }
)
