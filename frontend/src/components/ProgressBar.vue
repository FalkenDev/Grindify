<!--
  - Copyright (c) 2026 FalkenDev
  -
  - This file is part of Grindify.
  -
  - Grindify is free software: you can redistribute it and/or modify
  - it under the terms of the GNU Affero General Public License as
  - published by the Free Software Foundation, either version 3 of
  - the License, or (at your option) any later version.
  -
  - You should have received a copy of the GNU Affero General Public
  - License along with Grindify. If not, see
  - <https://www.gnu.org/licenses/>.
  -->

<template>
  <v-card class="bg-background d-flex ga-2 flex-column rounded-lg" style="box-shadow: none">
    <div class="d-flex justify-space-between align-center">
      <h1 class="text-caption text-uppercase font-weight-bold text-textSecondary">
        {{ $t('progress.week') }} {{ currentWeek }}
      </h1>
      <span
        class="text-caption font-weight-bold text-textSecondary"
        :class="streakInfo?.freezeUsedThisWeek ? 'text-blue-lighten-2' : 'text-textPrimary'"
      >
        {{
          streakInfo?.freezeUsedThisWeek
            ? '✓'
            : `${streakInfo?.currentWeekWorkouts || 0} / ${streakInfo?.weeklyWorkoutGoal || 3}`
        }}
        {{ $t('home.weeklyGoal') }}
      </span>
    </div>
    <div class="d-flex justify-space-between align-center ga-1">
      <div
        v-for="(day, index) in weekdays"
        :key="day"
        class="d-flex flex-column align-center ga-1 pa-1 rounded-lg py-2"
        style="flex: 1 1 0; min-width: 0"
        :style="getDayCardStyle(index)"
        :class="{
          'bg-cardBg': completedDaysThisWeek.has(index),
          'bg-background': !completedDaysThisWeek.has(index),
        }"
      >
        <span class="text-caption font-weight-bold">{{ day }}</span>
        <v-avatar :color="getDayAvatarColor(index)" size="24" :style="getDayAvatarStyle(index)">
          <v-icon v-if="completedDaysThisWeek.has(index)" size="16" color="white">mdi-check</v-icon>
        </v-avatar>
      </div>
    </div>
  </v-card>
</template>
<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { useWorkoutSessionStore } from '@/stores/workoutSession.store'
import { useActivityStore } from '@/stores/activity.store'
import { useScheduledSessionStore } from '@/stores/scheduledSession.store'
import type { WorkoutSession } from '@/interfaces/workoutSession.interface'

defineProps<{
  streakInfo: {
    currentWeekWorkouts: number
    weeklyWorkoutGoal: number
    freezeUsedThisWeek: boolean
  } | null
}>()

const { tm } = useI18n({ useScope: 'global' })
const workoutSessionStore = useWorkoutSessionStore()
const activityStore = useActivityStore()
const scheduledSessionStore = useScheduledSessionStore()

const weekdays = computed(() => {
  const v = tm('progress.weekdaysShort')
  return Array.isArray(v) ? (v as string[]) : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
})

const currentWeek = computed(() => {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
  return Math.ceil((days + startOfYear.getDay() + 1) / 7)
})

const currentWeekRange = computed(() => {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const monday = new Date(now)
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  monday.setDate(now.getDate() + diff)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return { start: monday, end: sunday }
})

const completedDaysThisWeek = computed(() => {
  const sessions = workoutSessionStore.workoutSessions as WorkoutSession[]
  const activityLogs = activityStore.activityLogs || []
  const { start, end } = currentWeekRange.value

  const completedDays = new Set<number>()

  sessions.forEach((session: WorkoutSession) => {
    if (session.status === 'finished' && session.endedAt) {
      const sessionDate = new Date(session.endedAt)
      if (sessionDate >= start && sessionDate <= end) {
        let dayOfWeek = sessionDate.getDay()
        dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        completedDays.add(dayOfWeek)
      }
    }
  })

  activityLogs.forEach(log => {
    const logDate = new Date(log.date)
    if (logDate >= start && logDate <= end) {
      let dayOfWeek = logDate.getDay()
      dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      completedDays.add(dayOfWeek)
    }
  })

  return completedDays
})

const todayIndex = computed(() => {
  const now = new Date()
  const dayOfWeek = now.getDay()
  return dayOfWeek === 0 ? 6 : dayOfWeek - 1
})

function getDayAvatarColor(dayIndex: number): string | undefined {
  if (completedDaysThisWeek.value.has(dayIndex)) return 'success'
  if (scheduledDaysThisWeek.value.has(dayIndex)) return undefined
  if (dayIndex === todayIndex.value) return 'primary'
  return 'grey-darken-3'
}

function getDayAvatarStyle(dayIndex: number): Record<string, string> {
  if (scheduledDaysThisWeek.value.has(dayIndex) && !completedDaysThisWeek.value.has(dayIndex))
    return { background: 'transparent', border: '2px dashed rgba(var(--v-theme-info), 0.7)' }
  return {}
}

function getDayCardStyle(dayIndex: number): Record<string, string> {
  if (completedDaysThisWeek.value.has(dayIndex))
    return { border: '1px solid rgb(var(--v-theme-success))' }
  if (dayIndex === todayIndex.value) return { border: '1px solid rgb(var(--v-theme-primary))' }
  return { border: '1px solid transparent' }
}

// Scheduled days this week (days that have a scheduled session but no completed session)
const scheduledDaysThisWeek = computed(() => {
  const scheduled = new Set<number>()
  const rangeCache = scheduledSessionStore.rangeCache

  if (!rangeCache || rangeCache.length === 0) return scheduled

  const { start, end } = currentWeekRange.value

  rangeCache.forEach(session => {
    if (session.isCompleted) return
    const sessionDate = new Date(session.resolvedDate + 'T12:00:00')
    if (sessionDate >= start && sessionDate <= end) {
      let dayOfWeek = sessionDate.getDay()
      dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      scheduled.add(dayOfWeek)
    }
  })

  return scheduled
})

// Fetch scheduled sessions for the current week on mount
onMounted(async () => {
  const { start, end } = currentWeekRange.value
  const toStr = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  await scheduledSessionStore.fetchForRange(toStr(start), toStr(end))
})
</script>
