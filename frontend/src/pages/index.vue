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
  <div class="pa-5 d-flex flex-column ga-5 bg-background" style="min-height: 100dvh">
    <HomeHeader :streak-info="streakInfo" />
    <v-card
      v-if="streakInfo && streakInfo.currentStreak > 0"
      class="bg-cardBg pa-4 d-flex flex-column ga-2 rounded-lg"
      :style="{
        border: '1px solid rgb(var(--v-theme-borderColor))',
        boxShadow: 'none',
        background:
          'linear-gradient(135deg, rgb(var(--v-theme-iconBackground)) 0%, rgb(var(--v-theme-cardBg)) 100%)',
      }"
    >
      <div class="d-flex align-center justify-between">
        <div class="d-flex align-center">
          <v-icon size="20" color="primary">mdi-fire</v-icon>
          <span class="text-body-2 text-primary font-weight-bold" style="margin-top: 1px">
            {{ streakInfo.currentStreak }} {{ $t('home.streak') }}
          </span>
        </div>
      </div>
      <div>
        <p class="text-body-2 text-textPrimary">
          {{ $t('home.streakMotivation', { count: streakInfo.currentStreak + 2 }) }}
        </p>
      </div>
    </v-card>
    <div class="d-flex ga-3">
      <v-btn
        v-if="authStore.user?.showWeightTracking"
        class="flex-grow-1 bg-cardBg rounded-lg"
        :style="{ border: '1px solid rgb(var(--v-theme-borderColor))', boxShadow: 'none' }"
        prepend-icon="mdi-weight"
        size="small"
        @click="isWeightLogDialogOpen = true"
      >
        <template #prepend>
          <v-icon color="yellow-darken-1">mdi-weight</v-icon>
        </template>
        <span class="text-caption">{{ $t('weightLog.logWeight') }}</span>
      </v-btn>
      <v-btn
        class="flex-grow-1 bg-cardBg rounded-lg"
        :style="{ border: '1px solid rgb(var(--v-theme-borderColor))', boxShadow: 'none' }"
        size="small"
        @click="$router.push('/statistics')"
      >
        <template #prepend>
          <v-icon color="green-darken-1">mdi-chart-line</v-icon>
        </template>
        <span class="text-caption">{{ $t('home.progress') }}</span>
      </v-btn>
    </div>
    <ProgressBar />

    <!-- Today's Schedule -->
    <div v-if="todaySchedule.length > 0" class="d-flex flex-column ga-2">
      <p class="text-caption text-uppercase font-weight-bold text-textSecondary">
        {{ $t('schedule.todaySchedule') }}
      </p>
      <v-card
        v-for="session in todaySchedule"
        :key="session.id + session.resolvedDate"
        class="bg-cardBg rounded-lg pa-3"
        :style="{ border: '1px solid rgb(var(--v-theme-borderColor))', boxShadow: 'none' }"
        @click="handleScheduledClick(session)"
      >
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center ga-3">
            <v-avatar color="blue-darken-4" size="36">
              <v-icon size="18" color="blue-lighten-1">
                {{ session.type === 'workout' ? 'mdi-dumbbell' : 'mdi-run' }}
              </v-icon>
            </v-avatar>
            <div>
              <p class="text-body-2 font-weight-bold">
                {{ session.type === 'workout' ? session.workout?.title : session.activity?.name }}
              </p>
              <v-chip size="x-small" :color="session.isCompleted ? 'green' : 'blue'" variant="flat">
                {{ session.isCompleted ? $t('schedule.completed') : $t('schedule.scheduled') }}
              </v-chip>
            </div>
          </div>
          <v-icon v-if="!session.isCompleted" size="20" class="text-textSecondary"
            >mdi-chevron-right</v-icon
          >
          <v-icon v-else size="20" color="green">mdi-check-circle</v-icon>
        </div>
      </v-card>
    </div>

    <div class="d-flex ga-3">
      <v-card
        class="flex-grow-1 bg-cardBg justify-center align-center py-2 d-flex flex-column align-center rounded-lg"
        :style="{
          border: '1px solid rgb(var(--v-theme-borderColor))',
          boxShadow: 'none',
          flex: '1',
        }"
      >
        <v-icon size="24" color="primary">mdi-fire</v-icon>
        <h2 class="text-h5 text-textPrimary mt-1">{{ streakInfo?.currentStreak || 0 }}</h2>
        <p class="text-caption text-textSecondary text-uppercase">{{ $t('home.streak') }}</p>
      </v-card>
      <v-card
        class="flex-grow-1 bg-cardBg justify-center align-center py-2 d-flex flex-column align-center rounded-lg"
        :style="{
          border: '1px solid rgb(var(--v-theme-borderColor))',
          boxShadow: 'none',
          flex: '1',
        }"
      >
        <v-icon size="24" :color="streakInfo?.freezeUsedThisWeek ? 'blue-lighten-2' : 'primary'">
          {{ streakInfo?.freezeUsedThisWeek ? 'mdi-snowflake' : 'mdi-bullseye' }}
        </v-icon>
        <h2
          class="text-h5 mt-1"
          :class="streakInfo?.freezeUsedThisWeek ? 'text-blue-lighten-2' : 'text-textPrimary'"
        >
          {{
            streakInfo?.freezeUsedThisWeek
              ? '✓'
              : `${streakInfo?.currentWeekWorkouts || 0}/${streakInfo?.weeklyWorkoutGoal || 3}`
          }}
        </h2>
        <p class="text-caption text-textSecondary text-uppercase">{{ $t('home.weeklyGoal') }}</p>
      </v-card>
      <v-card
        class="flex-grow-1 bg-cardBg justify-center align-center py-2 d-flex flex-column align-center rounded-lg"
        :style="{
          border: '1px solid rgb(var(--v-theme-borderColor))',
          boxShadow: 'none',
          flex: '1',
        }"
      >
        <v-icon size="24" color="primary">mdi-timer</v-icon>
        <h2 class="text-h5 text-textPrimary mt-1">{{ totalMinutesThisWeek }}</h2>
        <p class="text-caption text-textSecondary text-uppercase">{{ $t('home.minutes') }}</p>
      </v-card>
    </div>
    <MyWorkouts />

    <WeightLogDialog v-model="isWeightLogDialogOpen" @weight-updated="loadStreakInfo" />
  </div>
</template>

<script lang="ts" setup>
import { getStreakInfo } from '@/services/user.service'
import type { ActivityLog } from '@/interfaces/Activity.interface'
import { useWorkoutSessionStore } from '@/stores/workoutSession.store'
import { useActivityStore } from '@/stores/activity.store'
import { useAuthStore } from '@/stores/auth.store'
import { useScheduledSessionStore } from '@/stores/scheduledSession.store'
import { startWorkoutSession } from '@/services/workoutSession.service'
import WeightLogDialog from '@/components/WeightLogDialog.vue'
import type { StreakInfo } from '@/interfaces/User.interface'
import type { WorkoutSession } from '@/interfaces/workoutSession.interface'
import type { ScheduledSessionForDate } from '@/interfaces/ScheduledSession.interface'
import { useRouter } from 'vue-router'

const router = useRouter()
const workoutSessionStore = useWorkoutSessionStore()
const activityStore = useActivityStore()
const authStore = useAuthStore()
const scheduledSessionStore = useScheduledSessionStore()
const streakInfo = ref<StreakInfo | null>(null)
const isWeightLogDialogOpen = ref(false)

// Get the start and end of the current week (Monday to Sunday)
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

// Calculate total minutes for finished sessions this week
const totalMinutesThisWeek = computed(() => {
  const sessions = workoutSessionStore.workoutSessions as WorkoutSession[]
  const activityLogs = activityStore.activityLogs as ActivityLog[]
  const { start, end } = currentWeekRange.value

  let totalMinutes = 0

  sessions.forEach((session: WorkoutSession) => {
    if (session.status === 'finished' && session.endedAt && session.startedAt) {
      const sessionDate = new Date(session.endedAt)
      if (sessionDate >= start && sessionDate <= end) {
        const startTime = new Date(session.startedAt).getTime()
        const endTime = new Date(session.endedAt).getTime()
        const durationMinutes = Math.round((endTime - startTime) / (1000 * 60))
        totalMinutes += durationMinutes
      }
    }
  })

  activityLogs.forEach((log: ActivityLog) => {
    const logDate = new Date(`${log.date}T12:00:00`)
    if (logDate >= start && logDate <= end) {
      totalMinutes += log.duration
    }
  })

  return totalMinutes
})

// Load streak info
const loadStreakInfo = async () => {
  try {
    streakInfo.value = await getStreakInfo()
  } catch (error) {
    console.error('Failed to load streak info:', error)
  }
}

// Today's scheduled sessions
function getTodayStr(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const todaySchedule = computed<ScheduledSessionForDate[]>(() => {
  return scheduledSessionStore.selectedDateSessions.filter(s => !s.isCompleted)
})

async function handleScheduledClick(session: ScheduledSessionForDate) {
  if (session.isCompleted) return

  if (session.type === 'workout' && session.workout) {
    try {
      const ws = await startWorkoutSession(session.workout.id, session.id)
      await workoutSessionStore.fetchSelectedWorkoutSession(ws.id)
      router.push(`/session/${ws.id}`)
    } catch (error) {
      console.error('Failed to start workout:', error)
    }
  } else if (session.type === 'activity' && session.activity) {
    router.push(`/log-activity?activityId=${session.activity.id}&scheduledSessionId=${session.id}`)
  }
}

onMounted(() => {
  loadStreakInfo()
  scheduledSessionStore.fetchForDate(getTodayStr())
})

// Re-fetch when navigating back (e.g. after completing a session)
onActivated(() => {
  scheduledSessionStore.fetchForDate(getTodayStr())
})
</script>
