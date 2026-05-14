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
  <div class="d-flex flex-column fill-height bg-background">
    <BackHeader :title="$t('sessionList.title')" @close="emit('close')" />

    <!-- Search -->
    <div class="mx-5 mt-2 mb-4">
      <v-text-field
        v-model="searchQuery"
        variant="outlined"
        prepend-inner-icon="mdi-magnify"
        :label="$t('common.search')"
        clearable
        hide-details
        density="compact"
      />
    </div>

    <!-- List -->
    <div class="flex-grow-1 overflow-y-auto pb-5 d-flex ga-3 flex-column" style="overscroll-behavior-y: contain">
      <template v-if="sessions.length > 0">
        <div
          v-for="session in sessions"
          :key="`${session.type}-${session.data.id}`"
          class="bg-cardBg rounded-lg mx-5 py-3 px-4 cursor-pointer"
          style="border: 1px solid rgb(var(--v-theme-borderColor))"
          @click="openSessionDetail(session)"
        >
          <div class="d-flex align-center ga-4">
            <v-avatar color="avatarBg" size="50" tile class="rounded-lg flex-shrink-0">
              <v-icon color="primary">{{ sessionIcon(session) }}</v-icon>
            </v-avatar>

            <div class="flex-grow-1" style="min-width: 0">
              <div class="d-flex align-center ga-1 mb-1 flex-wrap">
                <v-chip
                  :color="session.type === 'workout' ? 'primary' : 'secondary'"
                  size="x-small"
                  variant="tonal"
                >
                  {{
                    session.type === 'workout'
                      ? $t('sessionList.workoutSession')
                      : $t('sessionList.activityLog')
                  }}
                </v-chip>
                <v-chip
                  v-if="session.type === 'workout'"
                  :color="statusColor((session.data as WorkoutSession).status)"
                  size="x-small"
                  variant="flat"
                  class="text-uppercase"
                >
                  {{ statusLabel((session.data as WorkoutSession).status) }}
                </v-chip>
              </div>

              <p class="text-body-1 font-weight-bold text-textPrimary text-truncate">
                {{ title(session) }}
              </p>

              <p class="text-caption text-textSecondary">
                <template v-if="session.type === 'workout'">
                  {{ formatDate((session.data as WorkoutSession).startedAt) }}
                  &nbsp;·&nbsp;
                  {{
                    durationMinutes(
                      (session.data as WorkoutSession).startedAt,
                      (session.data as WorkoutSession).endedAt || undefined
                    )
                  }}
                  &nbsp;·&nbsp;
                  {{ (session.data as WorkoutSession).totalWeight }} kg
                </template>
                <template v-else>
                  {{ formatDate((session.data as ActivityLog).date) }}
                  &nbsp;·&nbsp;
                  {{ (session.data as ActivityLog).duration }} {{ $t('units.minShort') }}
                  <template v-if="(session.data as ActivityLog).distance">
                    &nbsp;·&nbsp;{{ (session.data as ActivityLog).distance }} {{ $t('units.km') }}
                  </template>
                </template>
              </p>
            </div>

            <v-icon color="grey-lighten-1" class="flex-shrink-0">mdi-chevron-right</v-icon>
          </div>
        </div>
      </template>

      <!-- Empty state -->
      <div
        v-if="sessions.length === 0"
        class="d-flex flex-column align-center justify-center flex-grow-1 py-16"
      >
        <v-icon size="56" color="textSecondary" class="mb-4">mdi-history</v-icon>
        <p class="text-subtitle-1 font-weight-bold text-textPrimary mb-1">
          {{ $t('sessionList.noSessionsFound') }}
        </p>
        <p class="text-body-2 text-textSecondary text-center">
          {{ $t('statistics.noHistory') }}
        </p>
      </div>
    </div>
  </div>

  <v-dialog v-model="isSessionDetailOpen" fullscreen>
    <SessionDetail
      v-if="selectedSession !== null"
      :session-type="selectedSession.type"
      :session-id="selectedSession.id"
      @close="isSessionDetailOpen = false"
    />
  </v-dialog>
</template>

<script setup lang="ts">
import { useWorkoutSessionStore } from '@/stores/workoutSession.store'
import { useActivityStore } from '@/stores/activity.store'
import type { WorkoutSession } from '@/interfaces/workoutSession.interface'
import type { ActivityLog } from '@/interfaces/Activity.interface'
import { useI18n } from 'vue-i18n'
import SessionDetail from '@/pages/SessionDetail.vue'
import { displayExerciseName, displayActivityName, resolveI18n } from '@/utils/exerciseDisplay'
import { useUserLanguage } from '@/composables/useUserLanguage'

const { t } = useI18n({ useScope: 'global' })
const { lang } = useUserLanguage()

const searchQuery = ref('')
const workoutSessionStore = useWorkoutSessionStore()
const activityStore = useActivityStore()
const isSessionDetailOpen = ref(false)
const selectedSession = ref<{ type: 'workout' | 'activity'; id: number } | null>(null)

type UnifiedSession =
  | { type: 'workout'; data: WorkoutSession }
  | { type: 'activity'; data: ActivityLog }

const sessions = computed<UnifiedSession[]>(() => {
  const workoutSessions: UnifiedSession[] = (
    (workoutSessionStore.workoutSessions as WorkoutSession[]) || []
  ).map(session => ({ type: 'workout' as const, data: session }))

  const activityLogs: UnifiedSession[] = ((activityStore.activityLogs as ActivityLog[]) || []).map(
    log => ({ type: 'activity' as const, data: log })
  )

  const combined = [...workoutSessions, ...activityLogs]

  return combined
    .filter(session => {
      if (!searchQuery.value) return true

      const query = searchQuery.value.toLowerCase().trim()

      if (session.type === 'workout') {
        const ws = session.data as WorkoutSession
        if (ws.workout?.title?.toLowerCase().includes(query)) return true
        if (ws.notes?.toLowerCase().includes(query)) return true
        if (
          ws.exercises?.some(
            ex =>
              (ex.exercise ? displayExerciseName(ex.exercise, lang.value) : '').toLowerCase().includes(query) ||
              resolveI18n(ex.exercise?.description, lang.value).toLowerCase().includes(query)
          )
        )
          return true
      } else {
        const al = session.data as ActivityLog
        if (al.activity && displayActivityName(al.activity, lang.value).toLowerCase().includes(query)) return true
        if (al.notes?.toLowerCase().includes(query)) return true
      }

      return false
    })
    .sort((a, b) => {
      const dateA =
        a.type === 'workout'
          ? new Date((a.data as WorkoutSession).startedAt).getTime()
          : new Date((a.data as ActivityLog).date).getTime()
      const dateB =
        b.type === 'workout'
          ? new Date((b.data as WorkoutSession).startedAt).getTime()
          : new Date((b.data as ActivityLog).date).getTime()
      return dateB - dateA
    })
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

function sessionIcon(session: UnifiedSession) {
  if (session.type === 'activity') {
    const icon = (session.data as ActivityLog).activity?.icon
    return icon ? `mdi-${icon}` : 'mdi-run-fast'
  }
  return 'mdi-dumbbell'
}

function formatDate(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function durationMinutes(start?: string, end?: string) {
  if (!start) return ''
  const s = new Date(start).getTime()
  const e = end ? new Date(end).getTime() : Date.now()
  const mins = Math.max(0, Math.round((e - s) / 60000))
  return `${mins} ${t('units.minShort')}`
}

function openSessionDetail(session: UnifiedSession) {
  selectedSession.value = { type: session.type, id: session.data.id }
  isSessionDetailOpen.value = true
}

function statusLabel(status: WorkoutSession['status']) {
  const key = `session.status.${status}` as const
  return t(key)
}

function statusColor(status: WorkoutSession['status']) {
  switch (status) {
    case 'finished':
      return 'success'
    case 'in_progress':
      return 'warning'
    case 'abandoned':
      return 'error'
    default:
      return 'default'
  }
}

function title(session: UnifiedSession) {
  if (session.type === 'workout') {
    return (
      (session.data as WorkoutSession).workout?.title ||
      t('sessionList.sessionFallback', { id: (session.data as WorkoutSession).id })
    )
  } else {
    return (
      ((session.data as ActivityLog).activity ? displayActivityName((session.data as ActivityLog).activity!, lang.value) : '') ||
      t('sessionList.activityFallback', { id: (session.data as ActivityLog).id })
    )
  }
}

onMounted(() => {
  workoutSessionStore.setWorkoutSessions(true)
  activityStore.fetchActivityLogs(true)
})
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
