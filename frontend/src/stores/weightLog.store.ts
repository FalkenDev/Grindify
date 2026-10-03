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
import type { WeightLog, WeightLogStats } from '@/interfaces/WeightLog.interface'
import * as weightLogService from '@/services/weightLog.service'
import { useAuthStore } from './auth.store'

export const useWeightLogStore = defineStore('weightLogStore', () => {
  const authStore = useAuthStore()

  const weightLogs = ref<WeightLog[]>([])
  const stats = ref<WeightLogStats | null>(null)
  const isLoadingLogs = ref<boolean>(false)
  const isLoadingStats = ref<boolean>(false)
  const lastFetchedLogs = ref<number | null>(null)
  const lastFetchedStats = ref<number | null>(null)
  const cacheDuration = 10 * 1000 // 10 seconds

  const fetchWeightLogs = async (reload = false) => {
    // Weight logs are health data – only available with health data consent.
    if (!authStore.isAuthenticated || !authStore.hasHealthConsent) return
    const now = Date.now()
    if (
      weightLogs.value.length > 0 &&
      !reload &&
      lastFetchedLogs.value &&
      now - lastFetchedLogs.value < cacheDuration
    ) {
      return
    }
    try {
      isLoadingLogs.value = true
      weightLogs.value = await weightLogService.fetchAllWeightLogs()
      lastFetchedLogs.value = now
    } catch (error) {
      console.error('Error fetching weight logs:', error)
    } finally {
      isLoadingLogs.value = false
    }
  }

  const fetchStats = async (reload = false) => {
    if (!authStore.isAuthenticated || !authStore.hasHealthConsent) return
    const now = Date.now()
    if (
      stats.value &&
      !reload &&
      lastFetchedStats.value &&
      now - lastFetchedStats.value < cacheDuration
    ) {
      return
    }
    try {
      isLoadingStats.value = true
      stats.value = await weightLogService.fetchWeightLogStats()
      lastFetchedStats.value = now
    } catch (error) {
      console.error('Error fetching weight log stats:', error)
    } finally {
      isLoadingStats.value = false
    }
  }

  const refreshAll = async () => {
    await Promise.all([fetchWeightLogs(true), fetchStats(true)])
  }

  watch(
    () => authStore.isAuthenticated && authStore.hasHealthConsent,
    enabled => {
      if (enabled) {
        void fetchWeightLogs(true)
        void fetchStats(true)
      }
    },
    { immediate: true }
  )

  const resetStore = () => {
    weightLogs.value = []
    stats.value = null
    isLoadingLogs.value = false
    isLoadingStats.value = false
    lastFetchedLogs.value = null
    lastFetchedStats.value = null
  }

  return {
    weightLogs,
    stats,
    isLoadingLogs,
    isLoadingStats,
    fetchWeightLogs,
    fetchStats,
    refreshAll,
    resetStore,
  }
})
