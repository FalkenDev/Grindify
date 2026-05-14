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
  <v-bottom-sheet v-model="sheetOpen" inset>
    <v-card v-if="scheduledSession" class="bg-cardBg rounded-t-lg">
      <!-- Header -->
      <div class="pa-4 d-flex align-center ga-3">
        <v-avatar
          :color="scheduledSession.type === 'workout' ? 'blue-darken-4' : 'blue-darken-4'"
          size="48"
        >
          <v-icon size="24" color="blue-lighten-1">
            {{ scheduledSession.type === 'workout' ? 'mdi-dumbbell' : 'mdi-run' }}
          </v-icon>
        </v-avatar>
        <div class="flex-grow-1">
          <p class="text-h6 font-weight-bold">
            {{
              scheduledSession.type === 'workout'
                ? scheduledSession.workout?.title
                : (scheduledSession.activity ? displayActivityName(scheduledSession.activity, lang) : '')
            }}
          </p>
          <div class="d-flex align-center ga-2">
            <v-chip size="x-small" color="blue" variant="flat">
              {{ $t('schedule.scheduled') }}
            </v-chip>
            <span v-if="scheduledSession.isRecurring" class="text-caption text-textSecondary">
              <v-icon size="12">mdi-repeat</v-icon>
              {{ $t('schedule.recurring') }}
            </span>
          </div>
        </div>
      </div>

      <v-divider />

      <!-- Notes -->
      <div v-if="scheduledSession.notes" class="pa-4">
        <p class="text-caption text-textSecondary mb-1">{{ $t('schedule.notes') }}</p>
        <p class="text-body-2">{{ scheduledSession.notes }}</p>
      </div>

      <!-- Actions -->
      <v-list class="bg-cardBg">
        <!-- Start / Log (today only) -->
        <v-list-item
          v-if="isToday"
          prepend-icon="mdi-play"
          :title="
            scheduledSession.type === 'workout' ? $t('schedule.start') : $t('schedule.logActivity')
          "
          @click="startSession"
        />

        <!-- Log Past Session (past dates only) -->
        <v-list-item
          v-if="isPast"
          prepend-icon="mdi-history"
          :title="$t('schedule.logPastSession')"
          @click="logPastSession"
        />

        <v-divider v-if="isToday || isPast" />

        <!-- Delete options -->
        <v-list-item
          v-if="scheduledSession.isRecurring"
          prepend-icon="mdi-calendar-remove"
          :title="$t('schedule.deleteThisOccurrence')"
          class="text-error"
          @click="deleteOccurrence"
        />
        <v-list-item
          prepend-icon="mdi-delete"
          :title="
            scheduledSession.isRecurring
              ? $t('schedule.deleteAllOccurrences')
              : $t('schedule.deleteSchedule')
          "
          class="text-error"
          @click="deleteAll"
        />

        <v-divider />

        <v-list-item prepend-icon="mdi-close" :title="$t('schedule.cancel')" @click="close" />
      </v-list>
    </v-card>
  </v-bottom-sheet>
</template>

<script lang="ts" setup>
import { useScheduledSessionStore } from '@/stores/scheduledSession.store'
import { useWorkoutSessionStore } from '@/stores/workoutSession.store'
import { startWorkoutSession } from '@/services/workoutSession.service'
import { useRouter } from 'vue-router'
import type { ScheduledSessionForDate } from '@/interfaces/ScheduledSession.interface'
import { displayActivityName } from '@/utils/exerciseDisplay'
import { useUserLanguage } from '@/composables/useUserLanguage'

const props = defineProps<{
  modelValue: boolean
  scheduledSession: ScheduledSessionForDate | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  deleted: []
  started: []
  logPast: [session: ScheduledSessionForDate]
}>()

const sheetOpen = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const router = useRouter()
const { lang } = useUserLanguage()
const scheduledSessionStore = useScheduledSessionStore()
const workoutSessionStore = useWorkoutSessionStore()

const isToday = computed(() => {
  if (!props.scheduledSession) return false
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return props.scheduledSession.resolvedDate === `${y}-${m}-${d}`
})

const isPast = computed(() => {
  if (!props.scheduledSession) return false
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  const todayStr = `${y}-${m}-${d}`
  return props.scheduledSession.resolvedDate < todayStr
})

function close() {
  sheetOpen.value = false
}

function logPastSession() {
  if (!props.scheduledSession) return
  const session = props.scheduledSession
  close()
  emit('logPast', session)
}

async function startSession() {
  if (!props.scheduledSession) return

  const session = props.scheduledSession
  close()

  if (session.type === 'workout' && session.workout) {
    try {
      const ws = await startWorkoutSession(session.workout.id, session.id)
      await workoutSessionStore.fetchSelectedWorkoutSession(ws.id)
      router.push(`/session/${ws.id}?returnTo=/calendar`)
      emit('started')
    } catch (error) {
      console.error('Failed to start workout:', error)
    }
  } else if (session.type === 'activity' && session.activity) {
    router.push(
      `/log-activity?activityId=${session.activity.id}&scheduledSessionId=${session.id}&returnTo=/calendar`
    )
    emit('started')
  }
}

async function deleteOccurrence() {
  if (!props.scheduledSession) return

  try {
    await scheduledSessionStore.remove(props.scheduledSession.id, {
      deleteType: 'this',
      occurrenceDate: props.scheduledSession.resolvedDate,
    })
    emit('deleted')
    close()
  } catch (error) {
    console.error('Failed to delete occurrence:', error)
  }
}

async function deleteAll() {
  if (!props.scheduledSession) return

  try {
    await scheduledSessionStore.remove(props.scheduledSession.id, {
      deleteType: 'all',
    })
    emit('deleted')
    close()
  } catch (error) {
    console.error('Failed to delete schedule:', error)
  }
}
</script>
