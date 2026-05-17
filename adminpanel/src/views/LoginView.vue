<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Loader2, AlertCircle } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'

const { login } = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

async function handleSubmit() {
  if (!email.value || !password.value) return
  loading.value = true
  error.value = null
  try {
    await login(email.value, password.value)
    router.replace('/')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-bg flex items-center justify-center p-6">
    <div class="w-full max-w-sm bg-surface border border-border rounded-card p-8">

      <div class="flex items-center gap-2 mb-7">
        <div class="w-2 h-2 rounded-full bg-lime" />
        <span class="text-[14px] font-semibold text-text tracking-tight">Grindify Admin</span>
      </div>

      <h1 class="text-[22px] font-bold tracking-tight text-text mb-1">Sign in</h1>
      <p class="text-[13px] text-mute mb-6">Superadmin access only</p>

      <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <div class="flex flex-col gap-1.5">
          <label for="email" class="text-[12.5px] font-semibold text-text-2">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
            :disabled="loading"
            required
            class="px-3 py-2 bg-surface-2 border border-border-2 rounded-chip text-[13.5px] text-text outline-none focus:border-border-strong placeholder:text-faint disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="password" class="text-[12.5px] font-semibold text-text-2">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="••••••••"
            :disabled="loading"
            required
            class="px-3 py-2 bg-surface-2 border border-border-2 rounded-chip text-[13.5px] text-text outline-none focus:border-border-strong placeholder:text-faint disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          />
        </div>

        <div v-if="error" class="flex items-center gap-2 px-3 py-2 bg-red-soft border border-red/20 rounded-chip text-[13px] text-red">
          <AlertCircle :size="14" class="shrink-0" />
          <span>{{ error }}</span>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="mt-1 flex items-center justify-center gap-2 py-2.5 bg-lime text-lime-ink rounded-chip text-[13.5px] font-bold cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          <Loader2 v-if="loading" :size="15" class="animate-spin" />
          <span>{{ loading ? 'Signing in…' : 'Sign in' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>
