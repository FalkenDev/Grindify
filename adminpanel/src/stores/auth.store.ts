import { ref } from 'vue'
import { defineStore } from 'pinia'
import { adminApi, type AdminUserDetail } from '@/services/adminApi'
import { ApiError } from '@/services/api'

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:1337/v1'

export const useAuthStore = defineStore(
  'adminAuth',
  () => {
    const user = ref<AdminUserDetail | null>(null)
    const checked = ref(false)
    const loading = ref(false)

    async function fetchMe(): Promise<boolean> {
      try {
        user.value = await adminApi.getMe()
        checked.value = true
        return true
      } catch {
        user.value = null
        checked.value = true
        return false
      }
    }

    async function login(email: string, password: string): Promise<void> {
      loading.value = true
      try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        if (!res.ok) {
          let msg = 'Invalid credentials'
          try { msg = (await res.json()).message ?? msg } catch { /* ignore */ }
          throw new ApiError(res.status, msg)
        }

        const ok = await fetchMe()
        if (!ok || user.value?.role !== 'superadmin') {
          user.value = null
          throw new ApiError(403, 'This account does not have superadmin access.')
        }
      } finally {
        loading.value = false
      }
    }

    async function logout(): Promise<void> {
      await fetch(`${BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {})
      user.value = null
      checked.value = false
    }

    function resetStore() {
      user.value = null
      checked.value = false
      loading.value = false
    }

    return { user, checked, loading, fetchMe, login, logout, resetStore }
  },
  {
    persist: {
      pick: ['user'],
    },
  },
)
