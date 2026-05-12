<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-vue-next'
import { adminApi } from '@/services/adminApi'

interface ServiceStatus {
  name: string
  status: 'ok' | 'error' | 'checking'
  latency: number | null
  checkedAt: Date | null
  error: string | null
}

const services = ref<ServiceStatus[]>([
  { name: 'API', status: 'checking', latency: null, checkedAt: null, error: null },
])

let interval: ReturnType<typeof setInterval> | null = null

async function checkHealth() {
  const idx = 0
  services.value[idx].status = 'checking'
  const start = performance.now()
  try {
    await adminApi.getHealth()
    services.value[idx].status = 'ok'
    services.value[idx].latency = Math.round(performance.now() - start)
    services.value[idx].error = null
  } catch (e) {
    services.value[idx].status = 'error'
    services.value[idx].latency = null
    services.value[idx].error = e instanceof Error ? e.message : 'Unreachable'
  }
  services.value[idx].checkedAt = new Date()
}

onMounted(() => {
  checkHealth()
  interval = setInterval(checkHealth, 30_000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})

function formatTime(d: Date | null) {
  if (!d) return '—'
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const overallOk = () => services.value.every((s) => s.status === 'ok')
</script>

<template>
  <div class="page-head">
    <div class="titles">
      <h1>System Health</h1>
      <p>Service status, uptime, and diagnostics</p>
    </div>
    <button
      class="flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-2 border border-border-2 rounded-chip text-[13px] text-text-2 hover:bg-surface-3 hover:text-text transition-colors cursor-pointer"
      @click="checkHealth"
    >
      <RefreshCw :size="14" />
      Refresh
    </button>
  </div>

  <div
    class="flex items-center gap-2.5 px-5 py-3.5 rounded-inner text-[14px] font-medium mb-4"
    :class="overallOk()
      ? 'bg-emerald-soft text-emerald border border-emerald/20'
      : 'bg-red-soft text-red border border-red/20'"
  >
    <CheckCircle2 v-if="overallOk()" :size="20" />
    <XCircle v-else :size="20" />
    <span>{{ overallOk() ? 'All systems operational' : 'Service degraded' }}</span>
  </div>

  <div class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
    <div v-for="service in services" :key="service.name" class="bg-surface border border-border rounded-card px-5 py-[18px]">

      <div class="flex items-center justify-between mb-3">
        <span class="text-[14px] font-semibold text-text">{{ service.name }}</span>
        <span
          class="flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-[12px] font-semibold"
          :class="{
            'bg-emerald-soft text-emerald': service.status === 'ok',
            'bg-red-soft text-red': service.status === 'error',
            'bg-surface-3 text-mute': service.status === 'checking',
          }"
        >
          <Loader2 v-if="service.status === 'checking'" :size="11" class="animate-spin" />
          <CheckCircle2 v-else-if="service.status === 'ok'" :size="11" />
          <XCircle v-else :size="11" />
          {{ service.status === 'checking' ? 'Checking…' : service.status === 'ok' ? 'Operational' : 'Error' }}
        </span>
      </div>

      <div v-if="service.error" class="text-[12.5px] text-red mb-2.5">{{ service.error }}</div>

      <div class="flex items-center gap-1.5 text-[12.5px] text-dim">
        <span>{{ service.latency !== null ? `${service.latency} ms` : '—' }}</span>
        <span class="text-ghost">·</span>
        <span>Last checked {{ formatTime(service.checkedAt) }}</span>
      </div>
    </div>
  </div>
</template>
