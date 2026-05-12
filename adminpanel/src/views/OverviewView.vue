<script setup lang="ts">
import { onMounted } from 'vue'
import { Users, Dumbbell, CheckSquare, TrendingUp, Loader2, AlertCircle } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useStatsStore } from '@/stores/stats.store'

const statsStore = useStatsStore()
const { stats, loading, error } = storeToRefs(statsStore)

onMounted(() => statsStore.fetchStats())

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
}

function initials(first: string | null, last: string | null, email: string) {
  if (first || last) return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase()
  return email[0].toUpperCase()
}

function displayName(first: string | null, last: string | null, email: string) {
  if (first || last) return [first, last].filter(Boolean).join(' ')
  return email
}
</script>

<template>
  <div class="page-head">
    <div class="titles">
      <h1>Overview</h1>
      <p>Instance overview and aggregate stats</p>
    </div>
  </div>

  <div v-if="loading" class="flex items-center gap-2.5 p-8 text-mute text-sm">
    <Loader2 :size="20" class="animate-spin" />
    <span>Loading…</span>
  </div>

  <div v-else-if="error" class="flex items-center gap-2.5 p-8 text-red text-sm">
    <AlertCircle :size="18" />
    <span>{{ error }}</span>
  </div>

  <template v-else-if="stats">
    <div class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 mb-7">
      <div class="flex items-center gap-3.5 px-5 py-[18px] bg-surface border border-border rounded-card">
        <div class="flex items-center justify-center w-[38px] h-[38px] rounded-inner bg-blue-soft text-blue shrink-0">
          <Users :size="18" />
        </div>
        <div>
          <div class="text-[22px] font-bold tracking-tight text-text leading-none">{{ stats.totalUsers.toLocaleString() }}</div>
          <div class="text-[12.5px] text-mute mt-0.5">Total users</div>
        </div>
      </div>

      <div class="flex items-center gap-3.5 px-5 py-[18px] bg-surface border border-border rounded-card">
        <div class="flex items-center justify-center w-[38px] h-[38px] rounded-inner bg-lime-soft text-lime shrink-0">
          <TrendingUp :size="18" />
        </div>
        <div>
          <div class="text-[22px] font-bold tracking-tight text-text leading-none">{{ stats.newUsersLast30Days.toLocaleString() }}</div>
          <div class="text-[12.5px] text-mute mt-0.5">New users (30 days)</div>
        </div>
      </div>

      <div class="flex items-center gap-3.5 px-5 py-[18px] bg-surface border border-border rounded-card">
        <div class="flex items-center justify-center w-[38px] h-[38px] rounded-inner bg-violet-soft text-violet shrink-0">
          <Dumbbell :size="18" />
        </div>
        <div>
          <div class="text-[22px] font-bold tracking-tight text-text leading-none">{{ stats.totalWorkouts.toLocaleString() }}</div>
          <div class="text-[12.5px] text-mute mt-0.5">Total workouts</div>
        </div>
      </div>

      <div class="flex items-center gap-3.5 px-5 py-[18px] bg-surface border border-border rounded-card">
        <div class="flex items-center justify-center w-[38px] h-[38px] rounded-inner bg-emerald-soft text-emerald shrink-0">
          <CheckSquare :size="18" />
        </div>
        <div>
          <div class="text-[22px] font-bold tracking-tight text-text leading-none">{{ stats.totalSessions.toLocaleString() }}</div>
          <div class="text-[12.5px] text-mute mt-0.5">Completed sessions</div>
        </div>
      </div>
    </div>

    <div class="text-[13px] font-bold uppercase tracking-widest text-dim mb-2.5">Recent signups</div>
    <div class="bg-surface border border-border rounded-card overflow-hidden">
      <div
        v-for="user in stats.recentUsers"
        :key="user.id"
        class="flex items-center gap-3 px-[18px] py-3 border-b border-border last:border-0 hover:bg-surface-2 transition-colors"
      >
        <div class="w-8 h-8 rounded-full bg-surface-hi text-text-2 text-[12px] font-bold flex items-center justify-center shrink-0">
          {{ initials(user.firstName, user.lastName, user.email) }}
        </div>
        <div class="flex flex-col gap-px flex-1 min-w-0">
          <span class="text-[13.5px] font-medium text-text truncate">{{ displayName(user.firstName, user.lastName, user.email) }}</span>
          <span class="text-[12px] text-dim truncate">{{ user.email }}</span>
        </div>
        <span class="text-[12px] text-dim whitespace-nowrap">{{ formatDate(user.createdAt) }}</span>
      </div>
      <div v-if="stats.recentUsers.length === 0" class="px-[18px] py-6 text-[13px] text-faint">No users yet</div>
    </div>
  </template>
</template>
