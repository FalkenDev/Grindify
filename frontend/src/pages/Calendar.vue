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
  <div class="pa-5 d-flex flex-column ga-5">
    <!-- Month Navigation Header -->
    <div>
      <h1>{{ $t('calendar.calendar') }}</h1>
      <p>{{ $t('calendar.trackYourWorkoutHistory') }}</p>
    </div>

    <!-- Dynamic Stats Card -->
    <v-card
      class="bg-cardBg pa-3 rounded-lg"
      :style="{ border: '1px solid rgb(var(--v-theme-borderColor))' }"
    >
      <div class="d-flex justify-space-between">
        <!-- Workouts this month -->
        <div class="d-flex flex-column align-center" style="flex: 1 1 0">
          <span
            class="text-caption text-textSecondary text-center text-uppercase"
            style="font-size: 10px"
            >{{ $t('calendar.workout') }}</span
          >
          <span class="text-subtitle-1 font-weight-bold mt-1">{{ workoutSessionsThisMonth }}</span>
        </div>

        <v-divider vertical class="mx-1" />

        <!-- Activities this month -->
        <div class="d-flex flex-column align-center" style="flex: 1 1 0">
          <span
            class="text-caption text-textSecondary text-center text-uppercase"
            style="font-size: 10px"
            >{{ $t('calendar.activity') }}</span
          >
          <span class="text-subtitle-1 font-weight-bold mt-1">{{ activitiesThisMonth }}</span>
        </div>

        <v-divider vertical class="mx-1" />

        <!-- Streak freezes -->
        <div class="d-flex flex-column align-center" style="flex: 1 1 0">
          <span
            class="text-caption text-textSecondary text-center text-uppercase"
            style="font-size: 10px"
            >{{ $t('calendar.freezes') }}</span
          >
          <span class="text-subtitle-1 font-weight-bold text-blue-lighten-2 mt-1">{{
            streakInfo?.streakFreezes ?? 1
          }}</span>
        </div>
      </div>
    </v-card>

    <!-- Calendar Grid -->
    <v-card
      elevation="0"
      class="calendar-card bg-cardBg pt-5 px-1 rounded-lg"
      :style="{ border: '1px solid rgb(var(--v-theme-borderColor))' }"
    >
      <div class="d-flex align-center justify-space-between">
        <v-btn icon variant="text" size="large" @click="previousMonth">
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>
        <div class="text-center" style="flex: 1">
          <div class="text-h5 font-weight-bold" style="letter-spacing: -0.5px">{{ monthName }}</div>
          <div class="text-body-2" style="opacity: 0.6">{{ yearName }}</div>
        </div>
        <v-btn icon variant="text" size="large" @click="nextMonth">
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </div>
      <v-card-text class="pa-2">
        <div class="modern-calendar">
          <!-- Weekday headers -->
          <div
            v-for="day in weekdays"
            :key="day"
            class="text-center text-caption font-weight-bold text-uppercase text-textSecondary"
          >
            {{ day }}
          </div>

          <!-- Calendar days -->
          <div
            v-for="day in calendarDays"
            :key="day.date"
            class="calendar-cell bg-cardBg"
            :class="{
              'other-month': !day.isCurrentMonth,
              'is-today': day.isToday,
              'is-selected': day.date === selectedDate,
              'is-frozen-week': day.isFrozenWeek,
            }"
            @click="selectDay(day)"
          >
            <div class="cell-content">
              <div
                class="day-badge"
                :class="{
                  'badge-workout': day.trainingType === 'workout',
                  'badge-activity': day.trainingType === 'activity',
                  'badge-both': day.trainingType === 'both',
                  'badge-scheduled': day.hasScheduledOnly,
                  'badge-frozen': day.isFrozenWeek && !day.trainingType && !day.hasScheduledOnly,
                }"
              >
                <span class="day-number">{{ day.dayNumber }}</span>
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
      <v-divider />
      <v-card-text class="d-flex align-center ga-4 flex-wrap">
        <div class="d-flex align-center ga-2">
          <div class="legend-badge badge-workout"></div>
          <span class="text-caption text-textSecondary">{{ $t('calendar.workout') }}</span>
        </div>
        <div class="d-flex align-center ga-2">
          <div class="legend-badge badge-activity"></div>
          <span class="text-caption text-textSecondary">{{ $t('calendar.activity') }}</span>
        </div>
        <div class="d-flex align-center ga-2">
          <div class="legend-badge badge-both"></div>
          <span class="text-caption text-textSecondary">{{
            $t('calendar.workoutAndActivity')
          }}</span>
        </div>
        <div class="d-flex align-center ga-2">
          <div class="legend-badge badge-scheduled"></div>
          <span class="text-caption text-textSecondary">{{ $t('calendar.scheduled') }}</span>
        </div>
        <div class="d-flex align-center ga-2">
          <div class="legend-badge badge-frozen"></div>
          <span class="text-caption text-textSecondary">{{ $t('calendar.frozenWeek') }}</span>
        </div>
      </v-card-text>
    </v-card>

    <!-- Day Detail View -->
    <div class="d-flex flex-column ga-3 pb-16">
      <!-- Date Header -->
      <div class="d-flex align-center justify-space-between">
        <h3 class="text-h6 font-weight-bold">{{ selectedDateLabel }}</h3>
        <v-btn
          v-if="isSelectedDateFutureOrToday"
          variant="text"
          size="small"
          color="primary"
          class="pa-0"
          @click="openScheduleDialog"
        >
          {{ $t('calendar.scheduleSession') }}
        </v-btn>
        <v-btn
          v-else
          variant="text"
          size="small"
          color="primary"
          class="pa-0"
          @click="openAddPastDialog"
        >
          {{ $t('calendar.addPastSession') }}
        </v-btn>
      </div>

      <!-- Scheduled Sessions (not completed) -->
      <template v-if="scheduledForSelectedDate.length > 0">
        <v-card
          v-for="session in scheduledForSelectedDate"
          :key="'sched-' + session.id + session.resolvedDate"
          class="bg-cardBg rounded-lg px-4 py-3"
          :style="{ border: '1px solid rgb(var(--v-theme-borderColor))' }"
          @click="openBottomSheet(session)"
        >
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center ga-3">
              <v-avatar color="blue-darken-4" size="40" tile class="rounded-lg">
                <v-icon size="20" color="blue-lighten-1">
                  {{ session.type === 'workout' ? 'mdi-dumbbell' : 'mdi-run' }}
                </v-icon>
              </v-avatar>
              <div>
                <p class="text-body-1 font-weight-bold">
                  {{
                    session.type === 'workout'
                      ? session.workout?.title
                      : session.activity
                        ? displayActivityName(session.activity, lang)
                        : ''
                  }}
                </p>
                <div class="d-flex align-center ga-2">
                  <v-chip size="x-small" color="blue" variant="flat">
                    {{ $t('schedule.scheduled') }}
                  </v-chip>
                </div>
              </div>
            </div>
            <div class="d-flex align-center ga-2">
              <v-btn
                v-if="isSelectedDateToday"
                size="x-small"
                color="primary"
                density="compact"
                variant="flat"
                @click.stop="startScheduledSession(session)"
              >
                {{ session.type === 'workout' ? $t('schedule.start') : $t('schedule.logActivity') }}
              </v-btn>
              <v-icon size="20" class="text-textSecondary">mdi-chevron-right</v-icon>
            </div>
          </div>
        </v-card>
      </template>

      <!-- Completed Sessions -->
      <template v-if="completedForSelectedDate.length > 0">
        <p class="text-caption text-uppercase font-weight-bold text-textSecondary">
          {{ $t('calendar.completedSessions') }}
        </p>
        <v-card
          v-for="event in completedForSelectedDate"
          :key="event.id"
          class="bg-cardBg rounded-lg px-4 py-3 cursor-pointer"
          :style="{ border: '1px solid rgb(var(--v-theme-borderColor))' }"
          @click="openCompletedSession(event)"
        >
          <div class="d-flex align-center ga-3">
            <v-avatar
              :color="event.type === 'workout' ? 'green-darken-4' : 'amber-darken-4'"
              size="40"
              tile
              class="rounded-lg"
            >
              <v-icon
                size="20"
                :color="event.type === 'workout' ? 'green-lighten-1' : 'amber-lighten-1'"
              >
                {{
                  event.type === 'workout'
                    ? 'mdi-dumbbell'
                    : 'mdi-' +
                      (event.rawData && 'activity' in event.rawData && event.rawData.activity?.icon
                        ? event.rawData.activity.icon
                        : 'run')
                }}
              </v-icon>
            </v-avatar>
            <div class="flex-grow-1">
              <p class="text-body-1 font-weight-bold">{{ event.name }}</p>
              <div class="d-flex align-center ga-2 mt-1">
                <v-chip
                  size="x-small"
                  :color="event.type === 'workout' ? 'green' : 'amber'"
                  variant="flat"
                >
                  {{ event.type === 'workout' ? $t('schedule.workout') : $t('schedule.activity') }}
                </v-chip>
                <span v-if="event.duration" class="text-caption text-textSecondary">
                  <v-icon size="12">mdi-clock-outline</v-icon>
                  {{ event.duration }}
                </span>
                <span v-if="event.totalWeight" class="text-caption text-textSecondary">
                  <v-icon size="12">mdi-weight-kilogram</v-icon>
                  {{ event.totalWeight }} kg
                </span>
              </div>
            </div>
          </div>
        </v-card>
      </template>

      <!-- Empty State -->
      <v-card
        v-if="completedForSelectedDate.length === 0 && scheduledForSelectedDate.length === 0"
        class="bg-cardBg rounded-lg pa-8 d-flex flex-column align-center ga-3"
        :style="{ border: '1px solid rgb(var(--v-theme-borderColor))' }"
      >
        <v-icon size="48" class="text-textSecondary">mdi-calendar-blank</v-icon>
        <p class="text-body-1 font-weight-bold text-textSecondary">
          {{
            isSelectedDateFutureOrToday
              ? $t('calendar.noWorkoutScheduled')
              : $t('calendar.noWorkoutDone')
          }}
        </p>
        <v-btn
          v-if="isSelectedDateToday"
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          @click="$router.push('/workout')"
        >
          {{ $t('calendar.startWorkout') }}
        </v-btn>
        <v-btn
          v-else-if="isSelectedDateFuture"
          color="primary"
          variant="tonal"
          prepend-icon="mdi-plus"
          @click="openScheduleDialog"
        >
          {{ $t('calendar.scheduleSession') }}
        </v-btn>
        <v-btn
          v-else
          color="primary"
          variant="tonal"
          prepend-icon="mdi-plus"
          @click="openAddPastDialog"
        >
          {{ $t('calendar.addPastSession') }}
        </v-btn>
      </v-card>

      <!-- Freeze Week Card (current week only) -->
      <div
        v-if="isSelectedDateInCurrentWeek"
        class="bg-background rounded-lg px-4 py-3"
        :style="{
          border: '2px solid rgb(var(--v-theme-borderColor)) !important',
          borderStyle: 'dashed',
        }"
      >
        <div class="d-flex align-center justify-space-between">
          <div>
            <p class="text-body-2 font-weight-bold">
              {{
                streakInfo?.freezeUsedThisWeek
                  ? $t('calendar.freezeActive')
                  : $t('calendar.freezeWeek')
              }}
            </p>
            <p class="text-caption text-textSecondary">
              {{ $t('calendar.freezesRemaining', { count: streakInfo?.streakFreezes ?? 1 }) }} •
              {{ $t('calendar.protectsStreak') }}
            </p>
          </div>
          <v-btn
            v-if="!streakInfo?.freezeUsedThisWeek"
            size="small"
            color="blue-lighten-2"
            variant="tonal"
            :disabled="!streakInfo || (streakInfo.streakFreezes ?? 1) <= 0"
            @click="isFreezeDialogOpen = true"
          >
            {{ $t('calendar.useFreeze') }}
          </v-btn>
          <v-chip
            v-else
            size="small"
            color="blue-lighten-2"
            variant="tonal"
            prepend-icon="mdi-check"
          >
            {{ $t('calendar.active') }}
          </v-chip>
        </div>
      </div>

      <!-- Empty State -->
      <v-card
        v-if="completedForSelectedDate.length === 0 && scheduledForSelectedDate.length === 0"
        class="bg-cardBg rounded-lg pa-8 d-flex flex-column align-center ga-3"
        :style="{ border: '1px solid rgb(var(--v-theme-borderColor))' }"
      >
        <v-icon size="48" class="text-textSecondary">mdi-calendar-blank</v-icon>
        <p class="text-body-1 font-weight-bold text-textSecondary">
          {{
            isSelectedDateFutureOrToday
              ? $t('calendar.noWorkoutScheduled')
              : $t('calendar.noWorkoutDone')
          }}
        </p>
        <v-btn
          v-if="isSelectedDateToday"
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          @click="$router.push('/workout')"
        >
          {{ $t('calendar.startWorkout') }}
        </v-btn>
        <v-btn
          v-else-if="isSelectedDateFuture"
          color="primary"
          variant="tonal"
          prepend-icon="mdi-plus"
          @click="openScheduleDialog"
        >
          {{ $t('calendar.scheduleSession') }}
        </v-btn>
        <v-btn
          v-else
          color="primary"
          variant="tonal"
          prepend-icon="mdi-plus"
          @click="openAddPastDialog"
        >
          {{ $t('calendar.addPastSession') }}
        </v-btn>
      </v-card>

      <!-- Freeze Week Card (current week only) -->
      <div
        v-if="isSelectedDateInCurrentWeek"
        class="bg-background rounded-lg px-4 py-3"
        :style="{
          border: '2px solid rgb(var(--v-theme-borderColor)) !important',
          borderStyle: 'dashed',
        }"
      >
        <div class="d-flex align-center justify-space-between">
          <div>
            <p class="text-body-2 font-weight-bold">
              {{
                streakInfo?.freezeUsedThisWeek
                  ? $t('calendar.freezeActive')
                  : $t('calendar.freezeWeek')
              }}
            </p>
            <p class="text-caption text-textSecondary">
              {{ $t('calendar.freezesRemaining', { count: streakInfo?.streakFreezes ?? 0 }) }} •
              {{ $t('calendar.protectsStreak') }}
            </p>
          </div>
          <v-btn
            v-if="!streakInfo?.freezeUsedThisWeek"
            size="small"
            color="blue-lighten-2"
            variant="tonal"
            :disabled="!streakInfo || streakInfo.streakFreezes <= 0"
            @click="isFreezeDialogOpen = true"
          >
            {{ $t('calendar.useFreeze') }}
          </v-btn>
          <v-chip
            v-else
            size="small"
            color="blue-lighten-2"
            variant="tonal"
            prepend-icon="mdi-check"
          >
            {{ $t('calendar.active') }}
          </v-chip>
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <ScheduleSessionDialog
      v-model="isScheduleDialogOpen"
      :preselected-date="selectedDate"
      @scheduled="onScheduleCreated"
    />

    <AddPastSessionDialog
      v-model="isAddPastDialogOpen"
      :date="selectedDate"
      :preselected-type="pastSessionPreselectedType"
      :preselected-workout-id="pastSessionPreselectedWorkoutId"
      :preselected-activity-id="pastSessionPreselectedActivityId"
      :preselected-scheduled-session-id="pastSessionPreselectedScheduledSessionId"
      @session-added="onPastSessionAdded"
    />

    <ScheduledSessionBottomSheet
      v-model="isBottomSheetOpen"
      :scheduled-session="selectedScheduledSession"
      @deleted="onScheduleDeleted"
      @started="onScheduleStarted"
      @log-past="onLogPastFromSchedule"
    />

    <!-- Freeze Confirmation Dialog -->
    <v-dialog v-model="isFreezeDialogOpen" max-width="360">
      <v-card class="bg-cardBg rounded-lg pa-2">
        <v-card-title class="d-flex align-center ga-2">
          <v-icon color="blue-lighten-2">mdi-snowflake</v-icon>
          {{ $t('calendar.freezeDialogTitle') }}
        </v-card-title>
        <v-card-text>
          <p>{{ $t('calendar.freezeDialogBody') }}</p>
          <p class="text-caption text-textSecondary mt-2">
            {{ $t('calendar.freezesRemaining', { count: streakInfo?.streakFreezes ?? 1 }) }}
          </p>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="isFreezeDialogOpen = false">{{
            $t('common.cancel')
          }}</v-btn>
          <v-btn
            color="blue-lighten-2"
            variant="flat"
            :loading="isFreezeLoading"
            @click="freezeWeek"
          >
            {{ $t('calendar.freeze') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { useWorkoutSessionStore } from '@/stores/workoutSession.store'
import { useActivityStore } from '@/stores/activity.store'
import { useScheduledSessionStore } from '@/stores/scheduledSession.store'
import { useRouter } from 'vue-router'
import { getStreakInfo, useStreakFreeze } from '@/services/user.service'
import { startWorkoutSession } from '@/services/workoutSession.service'
import type { WorkoutSession } from '@/interfaces/workoutSession.interface'
import type { ActivityLog } from '@/interfaces/Activity.interface'
import type { ScheduledSessionForDate } from '@/interfaces/ScheduledSession.interface'
import type { StreakInfo } from '@/interfaces/User.interface'
import ScheduleSessionDialog from '@/components/Session/ScheduleSessionDialog.vue'
import AddPastSessionDialog from '@/components/Session/AddPastSessionDialog.vue'
import ScheduledSessionBottomSheet from '@/components/Session/ScheduledSessionBottomSheet.vue'
import { displayActivityName } from '@/utils/exerciseDisplay'
import { useUserLanguage } from '@/composables/useUserLanguage'

const { t, locale } = useI18n({ useScope: 'global' })
const { lang } = useUserLanguage()
const router = useRouter()

const dateLocale = computed(() => (locale.value === 'sv' ? 'sv-SE' : 'en-US'))

const currentDate = ref(new Date())
const selectedDate = ref(toLocalDateString(new Date()))
const workoutSessionStore = useWorkoutSessionStore()
const activityStore = useActivityStore()
const scheduledSessionStore = useScheduledSessionStore()
const streakInfo = ref<StreakInfo | null>(null)

// Dialog state
const isScheduleDialogOpen = ref(false)
const isAddPastDialogOpen = ref(false)
const isBottomSheetOpen = ref(false)
const selectedScheduledSession = ref<ScheduledSessionForDate | null>(null)
const isFreezeDialogOpen = ref(false)
const isFreezeLoading = ref(false)

// Pre-selection state for AddPastSessionDialog (from scheduled session)
const pastSessionPreselectedType = ref<'workout' | 'activity' | undefined>(undefined)
const pastSessionPreselectedWorkoutId = ref<number | null>(null)
const pastSessionPreselectedActivityId = ref<number | null>(null)
const pastSessionPreselectedScheduledSessionId = ref<number | null>(null)

interface CalendarEvent {
  id: string
  sessionId: number
  name: string
  date: Date
  type: 'workout' | 'activity' | 'scheduled'
  rawData: WorkoutSession | ActivityLog | ScheduledSessionForDate
  duration?: string
  totalWeight?: number | null
}

interface CalendarDay {
  date: string
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  hasCompletedTraining: boolean
  trainingType: 'workout' | 'activity' | 'both' | null
  hasScheduledOnly: boolean
  isFrozenWeek: boolean
  events: CalendarEvent[]
}

const weekdays = computed(() => {
  const base = new Date(2024, 0, 1) // Monday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    return d.toLocaleDateString(dateLocale.value, { weekday: 'short' })
  })
})

const monthName = computed(() => {
  const name = currentDate.value.toLocaleDateString(dateLocale.value, { month: 'long' })
  return name.charAt(0).toUpperCase() + name.slice(1)
})

const yearName = computed(() => {
  return currentDate.value.getFullYear().toString()
})

const todayStr = computed(() => toLocalDateString(new Date()))

const isSelectedDateToday = computed(() => selectedDate.value === todayStr.value)

const isSelectedDateFuture = computed(() => selectedDate.value > todayStr.value)

const isSelectedDateFutureOrToday = computed(() => selectedDate.value >= todayStr.value)

/** Whether the selected date falls in the current ISO week */
const isSelectedDateInCurrentWeek = computed(() => {
  const today = new Date()
  const getMondayOfWeek = (date: Date): Date => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
  }
  const monday = getMondayOfWeek(today)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  const selected = new Date(selectedDate.value + 'T12:00:00')
  return selected >= monday && selected <= sunday
})

/** Set of date strings belonging to the currently frozen ISO week */
const frozenWeekDates = computed<Set<string>>(() => {
  const key = streakInfo.value?.streakFreezeUsedWeek
  if (!key) return new Set()
  const [yearStr, weekStr] = key.split('-W')
  const year = parseInt(yearStr)
  const week = parseInt(weekStr)
  // Get Monday of ISO week 1 for that year
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7
  const week1Monday = new Date(jan4)
  week1Monday.setDate(jan4.getDate() - dayOfWeek + 1)
  // Advance to the target week's Monday
  const monday = new Date(week1Monday)
  monday.setDate(week1Monday.getDate() + (week - 1) * 7)
  const dates = new Set<string>()
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.add(toLocalDateString(d))
  }
  return dates
})

const selectedDateLabel = computed(() => {
  if (isSelectedDateToday.value) return t('calendar.today')

  const d = new Date(selectedDate.value + 'T12:00:00')
  return d.toLocaleDateString(dateLocale.value, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
})

// Workouts this month (sessions only)
const workoutSessionsThisMonth = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  let count = 0
  if (workoutSessionStore.workoutSessions) {
    ;(workoutSessionStore.workoutSessions as WorkoutSession[]).forEach(session => {
      if (session.status === 'finished' && session.endedAt) {
        const d = new Date(session.endedAt)
        if (d.getFullYear() === year && d.getMonth() === month) count++
      }
    })
  }
  return count
})

// Activities this month (activity logs only)
const activitiesThisMonth = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  let count = 0
  if (activityStore.activityLogs) {
    ;(activityStore.activityLogs as ActivityLog[]).forEach(log => {
      const d = new Date(log.date)
      if (d.getFullYear() === year && d.getMonth() === month) count++
    })
  }
  return count
})

// Fetch data on mount
onMounted(async () => {
  await Promise.all([
    workoutSessionStore.setWorkoutSessions(true),
    activityStore.fetchActivityLogs(true),
    loadStreakInfo(),
    fetchScheduledRange(),
    scheduledSessionStore.fetchForDate(selectedDate.value),
  ])
})

async function loadStreakInfo() {
  try {
    streakInfo.value = await getStreakInfo()
  } catch (error) {
    console.error('Failed to load streak info:', error)
  }
}

async function fetchScheduledRange() {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  let firstDayOfWeek = firstDay.getDay()
  firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
  const rangeStart = new Date(year, month, 1 - firstDayOfWeek)
  const rangeEnd = new Date(lastDay)
  rangeEnd.setDate(rangeEnd.getDate() + (42 - (lastDay.getDate() + firstDayOfWeek)))

  await scheduledSessionStore.fetchForRange(
    toLocalDateString(rangeStart),
    toLocalDateString(rangeEnd)
  )
}

// All completed events (workout sessions and activity logs)
const allCompletedEvents = computed<CalendarEvent[]>(() => {
  const events: CalendarEvent[] = []

  if (workoutSessionStore.workoutSessions) {
    ;(workoutSessionStore.workoutSessions as WorkoutSession[]).forEach((session, index) => {
      if (session.status === 'finished' && session.endedAt) {
        const startTime = new Date(session.startedAt).getTime()
        const endTime = new Date(session.endedAt).getTime()
        const durationMins = Math.round((endTime - startTime) / 60000)

        events.push({
          id: `workout-${session.id}`,
          sessionId: session.id,
          name: session.workout?.title || t('calendar.workoutNumber', { number: index + 1 }),
          date: new Date(session.endedAt),
          type: 'workout',
          rawData: session,
          duration: `${durationMins} min`,
          totalWeight: session.totalWeight || null,
        })
      }
    })
  }

  if (activityStore.activityLogs) {
    ;(activityStore.activityLogs as ActivityLog[]).forEach(log => {
      events.push({
        id: `activity-${log.id}`,
        sessionId: log.id,
        name: log.activity ? displayActivityName(log.activity, lang.value) : 'Activity',
        date: new Date(log.date),
        type: 'activity',
        rawData: log,
        duration: `${log.duration} min`,
      })
    })
  }

  return events
})

// Scheduled events (not completed) from range cache
const scheduledEvents = computed<CalendarEvent[]>(() => {
  return scheduledSessionStore.rangeCache
    .filter(s => !s.isCompleted)
    .map(s => ({
      id: `scheduled-${s.id}-${s.resolvedDate}`,
      sessionId: s.id,
      name:
        s.type === 'workout'
          ? s.workout?.title || 'Workout'
          : s.activity
            ? displayActivityName(s.activity, lang.value)
            : 'Activity',
      date: new Date(s.resolvedDate + 'T12:00:00'),
      type: 'scheduled' as const,
      rawData: s,
    }))
})

// Completed events for selected date
const completedForSelectedDate = computed(() => {
  return allCompletedEvents.value.filter(e => toLocalDateString(e.date) === selectedDate.value)
})

// Scheduled (not completed) for selected date
const scheduledForSelectedDate = computed(() => {
  return scheduledSessionStore.selectedDateSessions.filter(s => !s.isCompleted)
})

// Build calendar days
const calendarDays = computed<CalendarDay[]>(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  let firstDayOfWeek = firstDay.getDay()
  firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  const days: CalendarDay[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Previous month days
  const prevMonthLastDay = new Date(year, month, 0)
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = new Date(year, month - 1, prevMonthLastDay.getDate() - i)
    const dateStr = toLocalDateString(day)
    const events = getEventsForDate(dateStr)
    days.push({
      date: dateStr,
      dayNumber: day.getDate(),
      isCurrentMonth: false,
      isToday: false,
      hasCompletedTraining: hasCompletedTrainingEvents(events),
      trainingType: getTrainingType(events),
      hasScheduledOnly: hasScheduledOnlyEvents(events),
      isFrozenWeek: frozenWeekDates.value.has(dateStr),
      events,
    })
  }

  // Current month days
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const day = new Date(year, month, i)
    day.setHours(0, 0, 0, 0)
    const dateStr = toLocalDateString(day)
    const events = getEventsForDate(dateStr)
    days.push({
      date: dateStr,
      dayNumber: i,
      isCurrentMonth: true,
      isToday: day.getTime() === today.getTime(),
      hasCompletedTraining: hasCompletedTrainingEvents(events),
      trainingType: getTrainingType(events),
      hasScheduledOnly: hasScheduledOnlyEvents(events),
      isFrozenWeek: frozenWeekDates.value.has(dateStr),
      events,
    })
  }

  // Next month days
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    const day = new Date(year, month + 1, i)
    const dateStr = toLocalDateString(day)
    const events = getEventsForDate(dateStr)
    days.push({
      date: dateStr,
      dayNumber: i,
      isCurrentMonth: false,
      isToday: false,
      hasCompletedTraining: hasCompletedTrainingEvents(events),
      trainingType: getTrainingType(events),
      hasScheduledOnly: hasScheduledOnlyEvents(events),
      isFrozenWeek: frozenWeekDates.value.has(dateStr),
      events,
    })
  }

  return days
})

function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getEventsForDate(dateStr: string): CalendarEvent[] {
  const completed = allCompletedEvents.value.filter(
    event => toLocalDateString(event.date) === dateStr
  )
  const scheduled = scheduledEvents.value.filter(event => toLocalDateString(event.date) === dateStr)
  return [...completed, ...scheduled]
}

function getTrainingType(events: CalendarEvent[]): 'workout' | 'activity' | 'both' | null {
  const hasWorkout = events.some(e => e.type === 'workout')
  const hasActivity = events.some(e => e.type === 'activity')
  if (hasWorkout && hasActivity) return 'both'
  if (hasWorkout) return 'workout'
  if (hasActivity) return 'activity'
  return null
}

function hasCompletedTrainingEvents(events: CalendarEvent[]): boolean {
  return events.some(e => e.type === 'workout' || e.type === 'activity')
}

function hasScheduledOnlyEvents(events: CalendarEvent[]): boolean {
  return (
    events.some(e => e.type === 'scheduled') &&
    !events.some(e => e.type === 'workout' || e.type === 'activity')
  )
}

async function selectDay(day: CalendarDay) {
  selectedDate.value = day.date
  await scheduledSessionStore.fetchForDate(day.date)
}

function previousMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
  fetchScheduledRange()
}

function nextMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
  fetchScheduledRange()
}

function openScheduleDialog() {
  isScheduleDialogOpen.value = true
}

function openAddPastDialog() {
  pastSessionPreselectedType.value = undefined
  pastSessionPreselectedWorkoutId.value = null
  pastSessionPreselectedActivityId.value = null
  pastSessionPreselectedScheduledSessionId.value = null
  isAddPastDialogOpen.value = true
}

function onLogPastFromSchedule(session: ScheduledSessionForDate) {
  pastSessionPreselectedType.value = session.type as 'workout' | 'activity'
  pastSessionPreselectedWorkoutId.value = session.workout?.id ?? null
  pastSessionPreselectedActivityId.value = session.activity?.id ?? null
  pastSessionPreselectedScheduledSessionId.value = session.id
  // Use the scheduled session's resolved date for the dialog
  selectedDate.value = session.resolvedDate
  isAddPastDialogOpen.value = true
}

function openBottomSheet(session: ScheduledSessionForDate) {
  selectedScheduledSession.value = session
  isBottomSheetOpen.value = true
}

async function startScheduledSession(session: ScheduledSessionForDate) {
  if (session.type === 'workout' && session.workout) {
    try {
      const ws = await startWorkoutSession(session.workout.id, session.id)
      await workoutSessionStore.fetchSelectedWorkoutSession(ws.id)
      router.push(`/session/${ws.id}?returnTo=/calendar`)
    } catch (error) {
      console.error('Failed to start scheduled workout:', error)
    }
  } else if (session.type === 'activity' && session.activity) {
    router.push(
      `/log-activity?activityId=${session.activity.id}&scheduledSessionId=${session.id}&returnTo=/calendar`
    )
  }
}

async function onScheduleCreated() {
  await Promise.all([fetchScheduledRange(), scheduledSessionStore.fetchForDate(selectedDate.value)])
}

async function onPastSessionAdded() {
  await Promise.all([
    workoutSessionStore.setWorkoutSessions(true),
    activityStore.fetchActivityLogs(true),
    scheduledSessionStore.fetchForDate(selectedDate.value),
    loadStreakInfo(),
  ])
}

async function onScheduleDeleted() {
  await Promise.all([fetchScheduledRange(), scheduledSessionStore.fetchForDate(selectedDate.value)])
}

async function onScheduleStarted() {
  await Promise.all([fetchScheduledRange(), scheduledSessionStore.fetchForDate(selectedDate.value)])
}

function openCompletedSession(event: CalendarEvent) {
  if (event.type === 'scheduled') return
  router.push(`/session-history/${event.type}/${event.sessionId}`)
}

async function freezeWeek() {
  isFreezeLoading.value = true
  try {
    const updated = await useStreakFreeze(selectedDate.value)
    streakInfo.value = updated
    isFreezeDialogOpen.value = false
  } catch (error) {
    console.error('Failed to use streak freeze:', error)
  } finally {
    isFreezeLoading.value = false
  }
}
</script>

<style scoped>
/* Calendar Grid — no Vuetify equivalent for CSS grid */
.modern-calendar {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  overflow: hidden;
  max-width: 100%;
}

/* Force grid children to shrink below content size */
.modern-calendar > * {
  min-width: 0;
  overflow: hidden;
}

.calendar-card {
  overflow: hidden;
  max-width: 100%;
}

.calendar-cell {
  aspect-ratio: 1;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-sizing: border-box;
}

.calendar-cell:hover {
  background: rgba(var(--v-theme-primary), 0.06) !important;
}

.calendar-cell.other-month {
  opacity: 0.25;
}

.calendar-cell.is-today .day-badge {
  box-shadow: 0 0 0 2px rgb(var(--v-theme-primary));
}

.calendar-cell.is-today
  .day-badge:not(.badge-workout):not(.badge-activity):not(.badge-both)
  .day-number {
  color: rgb(var(--v-theme-primary));
  font-weight: 700;
}

.calendar-cell.is-selected .day-badge {
  box-shadow:
    0 0 0 2px rgb(var(--v-theme-primary)),
    0 0 0 4px rgba(var(--v-theme-primary), 0.2);
}

.cell-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 4px 2px;
}

/* Badge circle */
.day-badge {
  width: 68%;
  aspect-ratio: 1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
}

.day-number {
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  user-select: none;
}

/* Trained: workout only — green */
.badge-workout {
  background: #4caf50;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.45);
}

.badge-workout .day-number {
  color: #fff;
  font-weight: 700;
}

/* Trained: activity only — amber */
.badge-activity {
  background: #ff8f00;
  box-shadow: 0 2px 8px rgba(255, 143, 0, 0.45);
}

.badge-activity .day-number {
  color: #fff;
  font-weight: 700;
}

/* Trained: workout + activity — gradient */
.badge-both {
  background: linear-gradient(135deg, #4caf50 0%, #ff8f00 100%);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.4);
}

.badge-both .day-number {
  color: #fff;
  font-weight: 700;
}

/* Scheduled but not done — outline ring */
.badge-scheduled {
  background: transparent;
  border: 2px dashed rgba(var(--v-theme-info), 0.7);
}

.badge-scheduled .day-number {
  color: rgb(var(--v-theme-info));
  font-weight: 600;
}

/* Frozen week — ice-blue tint */
.calendar-cell.is-frozen-week {
  background: rgba(100, 181, 246, 0.07) !important;
}

/* Frozen badge — when no training logged */
.badge-frozen {
  background: transparent;
  border: 2px solid rgba(100, 181, 246, 0.5);
}

.badge-frozen .day-number {
  color: rgb(100, 181, 246);
}

.legend-badge.badge-frozen {
  background: transparent;
  border: 2px solid rgba(100, 181, 246, 0.5);
}

/* Legend */
.legend-badge {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-badge.badge-workout {
  background: #4caf50;
}

.legend-badge.badge-activity {
  background: #ff8f00;
}

.legend-badge.badge-both {
  background: linear-gradient(135deg, #4caf50 0%, #ff8f00 100%);
}

.legend-badge.badge-scheduled {
  background: transparent;
  border: 2px dashed rgba(var(--v-theme-info), 0.7);
}

@media (max-width: 600px) {
  .day-number {
    font-size: 12px;
  }

  .modern-calendar {
    gap: 1px;
  }

  .calendar-cell {
    border-radius: 8px;
  }

  .cell-content {
    padding: 2px 1px;
  }

  .day-badge {
    width: 72%;
  }
}
</style>
