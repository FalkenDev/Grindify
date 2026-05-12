import { ref } from 'vue'
import { defineStore } from 'pinia'
import { adminApi, type StatsResponse } from '@/services/adminApi'

export const useStatsStore = defineStore('adminStats', () => {
  const stats = ref<StatsResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchStats(): Promise<void> {
    if (stats.value || loading.value) return
    loading.value = true
    error.value = null
    try {
      stats.value = await adminApi.getStats()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load stats'
    } finally {
      loading.value = false
    }
  }

  function resetStore() {
    stats.value = null
    loading.value = false
    error.value = null
  }

  return { stats, loading, error, fetchStats, resetStore }
})
