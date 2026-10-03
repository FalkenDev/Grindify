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

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type {
  ScheduledSession,
  ScheduledSessionForDate,
  CreateScheduledSessionDto,
  UpdateScheduledSessionDto,
  DeleteScheduledSessionParams,
} from '@/interfaces/ScheduledSession.interface'
import * as scheduledService from '@/services/scheduledSession.service'
import { useAuthStore } from './auth.store'

export const useScheduledSessionStore = defineStore('scheduledSessionStore', () => {
  const authStore = useAuthStore()

  const scheduledSessions = ref<ScheduledSession[]>([])
  const rangeCache = ref<ScheduledSessionForDate[]>([])
  const selectedDateSessions = ref<ScheduledSessionForDate[]>([])
  const isLoading = ref(false)
  const lastFetched = ref<number | null>(null)
  const cacheDuration = 10 * 1000

  const fetchAll = async (reload = false) => {
    // Never fetch user data without a session (e.g. during/after logout).
    if (!authStore.isAuthenticated) return
    const now = Date.now()
    if (
      scheduledSessions.value.length > 0 &&
      !reload &&
      lastFetched.value &&
      now - lastFetched.value < cacheDuration
    ) {
      return
    }

    try {
      isLoading.value = true
      scheduledSessions.value = await scheduledService.fetchAllScheduledSessions()
      lastFetched.value = now
    } catch (error) {
      console.error('Error fetching scheduled sessions:', error)
    } finally {
      isLoading.value = false
    }
  }

  const fetchForDate = async (date: string) => {
    if (!authStore.isAuthenticated) return
    try {
      isLoading.value = true
      selectedDateSessions.value = await scheduledService.fetchScheduledSessionsForDate(date)
    } catch (error) {
      console.error('Error fetching scheduled sessions for date:', error)
    } finally {
      isLoading.value = false
    }
  }

  const fetchForRange = async (start: string, end: string) => {
    if (!authStore.isAuthenticated) return
    try {
      isLoading.value = true
      rangeCache.value = await scheduledService.fetchScheduledSessionsForRange(start, end)
    } catch (error) {
      console.error('Error fetching scheduled sessions for range:', error)
    } finally {
      isLoading.value = false
    }
  }

  const create = async (dto: CreateScheduledSessionDto) => {
    try {
      const created = await scheduledService.createScheduledSession(dto)
      scheduledSessions.value.push(created)
      lastFetched.value = null // invalidate cache
      return created
    } catch (error) {
      console.error('Error creating scheduled session:', error)
      throw error
    }
  }

  const update = async (id: number, dto: UpdateScheduledSessionDto) => {
    try {
      const updated = await scheduledService.updateScheduledSession(id, dto)
      const idx = scheduledSessions.value.findIndex(s => s.id === id)
      if (idx !== -1) scheduledSessions.value[idx] = updated
      lastFetched.value = null
      return updated
    } catch (error) {
      console.error('Error updating scheduled session:', error)
      throw error
    }
  }

  const remove = async (id: number, params: DeleteScheduledSessionParams) => {
    try {
      await scheduledService.deleteScheduledSession(id, params)
      if (params.deleteType === 'all') {
        scheduledSessions.value = scheduledSessions.value.filter(s => s.id !== id)
      }
      lastFetched.value = null
    } catch (error) {
      console.error('Error deleting scheduled session:', error)
      throw error
    }
  }

  const resetStore = () => {
    scheduledSessions.value = []
    rangeCache.value = []
    selectedDateSessions.value = []
    isLoading.value = false
    lastFetched.value = null
  }

  watch(
    () => authStore.isAuthenticated,
    authed => {
      if (authed) {
        void fetchAll(true)
      } else {
        resetStore()
      }
    },
    { immediate: true }
  )

  return {
    scheduledSessions,
    rangeCache,
    selectedDateSessions,
    isLoading,
    fetchAll,
    fetchForDate,
    fetchForRange,
    create,
    update,
    remove,
    resetStore,
  }
})
