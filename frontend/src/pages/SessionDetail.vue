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
  <div
    class="w-100 fill-height bg-background overflow-y-auto"
    style="
      background: linear-gradient(135deg, rgba(171, 255, 26, 0.15) 0%, rgba(12, 14, 18, 0) 35%);
      min-height: 100dvh;
      padding-bottom: calc(100px + env(safe-area-inset-bottom, 0px));
      overscroll-behavior: none;
    "
  >
    <!-- Header -->
    <BackHeader
      :title="sessionTitle"
      show-menu
      @close="isDialogMode ? emit('close') : $router.back()"
    >
      <template #menuAppend>
        <v-list
          class="bg-cardBg"
          width="160"
          :style="{ border: '1px solid rgb(var(--v-theme-borderColor))' }"
        >
          <v-list-item v-if="canEditSession" @click="openEditDialog">
            <v-list-item-title>{{ $t('common.edit') }}</v-list-item-title>
          </v-list-item>
          <v-list-item v-if="isEmptyWorkout" @click="saveAsWorkoutDialog = true">
            <v-list-item-title>{{ $t('workout.saveAsWorkout') }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="confirmDelete">
            <v-list-item-title class="text-error">{{
              $t('sessionDetail.deleteSession')
            }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </template>
    </BackHeader>

    <!-- Avatar -->
    <v-avatar size="70" tile color="avatarBg" class="mx-5 mb-3 mt-4 rounded-lg">
      <v-icon color="primary" size="35">{{ sessionIcon }}</v-icon>
    </v-avatar>

    <div class="mx-5 d-flex flex-column ga-4">
      <!-- Title + type/status badges -->
      <div class="pt-4">
        <div class="d-flex align-center ga-2 flex-wrap">
          <p class="text-primary text-body-1 text-capitalize">
            {{
              type === 'workout'
                ? $t('sessionDetail.workoutSession')
                : $t('sessionDetail.activityLog')
            }}
          </p>
          <v-chip
            v-if="type === 'workout' && workoutSession"
            :color="statusColor(workoutSession.status)"
            size="x-small"
            variant="flat"
            class="text-uppercase"
          >
            {{ statusLabel(workoutSession.status) }}
          </v-chip>
        </div>
        <h1 class="text-h5 font-weight-bold">{{ sessionTitle }}</h1>
        <p class="text-body-2 text-textSecondary mt-1">{{ sessionSubtitle }}</p>
      </div>

      <!-- Stat cards -->
      <div class="d-flex w-100 ga-3" style="align-items: stretch">
        <v-card
          class="text-center pa-4 rounded-lg bg-cardBg"
          :style="{
            border: '1px solid rgb(var(--v-theme-borderColor))',
            boxShadow: 'none',
            flex: '1 1 0',
            minWidth: '0',
          }"
        >
          <v-icon color="primary" size="24">mdi-timer-outline</v-icon>
          <div class="text-body-1 text-textPrimary mt-2">{{ durationDisplay }}</div>
          <p class="text-textSecondary text-body-2">{{ $t('sessionDetail.duration') }}</p>
        </v-card>

        <v-card
          class="text-center pa-4 rounded-lg bg-cardBg"
          :style="{
            border: '1px solid rgb(var(--v-theme-borderColor))',
            boxShadow: 'none',
            flex: '1 1 0',
            minWidth: '0',
          }"
        >
          <v-icon color="primary" size="24">{{
            type === 'workout' ? 'mdi-weight-kilogram' : 'mdi-fire'
          }}</v-icon>
          <div class="text-body-1 text-textPrimary mt-2">{{ statMidValue }}</div>
          <p class="text-textSecondary text-body-2">{{ statMidLabel }}</p>
        </v-card>

        <v-card
          class="text-center pa-4 rounded-lg bg-cardBg"
          :style="{
            border: '1px solid rgb(var(--v-theme-borderColor))',
            boxShadow: 'none',
            flex: '1 1 0',
            minWidth: '0',
          }"
        >
          <v-icon color="primary" size="24">{{
            type === 'workout' ? 'mdi-dumbbell' : 'mdi-map-marker-distance'
          }}</v-icon>
          <div class="text-body-1 text-textPrimary mt-2">{{ statRightValue }}</div>
          <p class="text-textSecondary text-body-2">{{ statRightLabel }}</p>
        </v-card>
      </div>

      <!-- Calories burned (workout sessions only, shown when logged) -->
      <div
        v-if="type === 'workout' && workoutSession && workoutSession.caloriesBurned"
        class="d-flex ga-3"
      >
        <v-card
          class="pa-4 rounded-lg bg-cardBg d-flex align-center ga-3"
          :style="{
            border: '1px solid rgb(var(--v-theme-borderColor))',
            boxShadow: 'none',
            flex: '1 1 0',
          }"
        >
          <v-icon color="primary" size="24">mdi-fire</v-icon>
          <div>
            <div class="text-body-1 font-weight-bold text-textPrimary">
              {{ workoutSession.caloriesBurned }} kcal
            </div>
            <p class="text-textSecondary text-body-2">{{ $t('sessionDetail.calories') }}</p>
          </div>
        </v-card>
      </div>

      <!-- Notes -->
      <div v-if="sessionNotes">
        <h1 class="text-h6">{{ $t('sessionDetail.notes') }}</h1>
        <p class="text-body-1 text-textSecondary mt-1">{{ sessionNotes }}</p>
      </div>

      <!-- WORKOUT SESSION: exercise list -->
      <template v-if="type === 'workout' && workoutSession">
        <div v-if="workoutSession.exercises?.length">
          <h1 class="text-h6 mb-3">{{ $t('sessionDetail.exerciseDetails') }}</h1>
          <div class="d-flex flex-column ga-3">
            <v-card
              v-for="(ex, idx) in workoutSession.exercises"
              :key="ex.exerciseId"
              class="bg-cardBg rounded-lg pa-3 cursor-pointer"
              :style="{ border: '1px solid rgb(var(--v-theme-borderColor))', boxShadow: 'none' }"
              @click="openExercise(ex)"
            >
              <div class="d-flex align-center ga-3 mb-3">
                <v-avatar color="avatarBg" size="36" class="rounded-lg flex-shrink-0">
                  <p class="text-primary text-caption font-weight-bold">{{ idx + 1 }}</p>
                </v-avatar>
                <div class="flex-grow-1" style="min-width: 0">
                  <p class="text-body-2 font-weight-bold text-textPrimary text-truncate">
                    {{ ex.exercise ? displayExerciseName(ex.exercise, lang) : $t('sessionList.exerciseFallback') }}
                  </p>
                  <p
                    v-if="ex.exercise && resolveI18n(ex.exercise.description, lang)"
                    class="text-caption text-textSecondary text-truncate"
                  >
                    {{ resolveI18n(ex.exercise.description, lang) }}
                  </p>
                </div>
                <div class="d-flex align-center ga-1 flex-shrink-0">
                  <template v-if="ex.exercise?.primaryMuscleGroups?.length">
                    <v-chip
                      v-for="pm in ex.exercise.primaryMuscleGroups"
                      :key="pm.id"
                      size="x-small"
                      variant="outlined"
                      color="textSecondary"
                    >
                      {{ $t(`muscleGroups.${pm.name}`) }}
                    </v-chip>
                  </template>
                  <v-btn
                    v-if="workoutSession?.status === 'finished'"
                    variant="text"
                    size="small"
                    color="primary"
                    @click.stop="openEditExerciseSets(ex)"
                  >
                    {{ $t('sessionDetail.editExerciseSets') }}
                  </v-btn>
                  <v-icon color="grey-lighten-1" size="16">mdi-chevron-right</v-icon>
                </div>
              </div>

              <div v-if="ex.sets?.length">
                <v-divider class="mb-2" />
                <div class="d-flex ga-1 text-caption text-textSecondary font-weight-bold mb-1 px-1">
                  <span style="width: 36px">#</span>
                  <span class="flex-grow-1">{{ $t('sessionDetail.weight') }}</span>
                  <span style="width: 60px; text-align: right">{{ $t('sessionDetail.reps') }}</span>
                </div>
                <div
                  v-for="s in ex.sets"
                  :key="s.setNumber"
                  class="d-flex ga-1 text-body-2 py-1 px-1 rounded"
                >
                  <span class="text-textSecondary" style="width: 36px">#{{ s.setNumber }}</span>
                  <span class="flex-grow-1 text-textPrimary">
                    {{ s.weight != null ? `${s.weight} kg` : '—' }}
                  </span>
                  <span class="text-textPrimary" style="width: 60px; text-align: right">
                    {{ s.reps != null ? s.reps : '—' }}
                  </span>
                </div>
              </div>
              <div v-else class="text-caption text-textSecondary mt-1">
                {{ $t('sessionDetail.noSetsRecorded') }}
              </div>
            </v-card>
          </div>
        </div>
      </template>

      <!-- ACTIVITY LOG: details grid -->
      <template v-else-if="type === 'activity' && activityLog">
        <div>
          <h1 class="text-h6 mb-3">{{ $t('sessionDetail.activityDetails') }}</h1>
          <div class="d-flex flex-wrap ga-3">
            <v-card
              v-if="activityLog.distance"
              class="bg-cardBg rounded-lg pa-3 d-flex align-center ga-3"
              :style="{
                border: '1px solid rgb(var(--v-theme-borderColor))',
                boxShadow: 'none',
                minWidth: '140px',
                flex: '1 1 0',
              }"
            >
              <v-icon color="primary" size="20">mdi-map-marker-distance</v-icon>
              <div>
                <p class="text-body-1 font-weight-bold text-textPrimary">
                  {{ activityLog.distance }} {{ $t('units.km') }}
                </p>
                <p class="text-caption text-textSecondary">{{ $t('sessionDetail.distance') }}</p>
              </div>
            </v-card>

            <v-card
              v-if="activityLog.pace"
              class="bg-cardBg rounded-lg pa-3 d-flex align-center ga-3"
              :style="{
                border: '1px solid rgb(var(--v-theme-borderColor))',
                boxShadow: 'none',
                minWidth: '140px',
                flex: '1 1 0',
              }"
            >
              <v-icon color="primary" size="20">mdi-speedometer</v-icon>
              <div>
                <p class="text-body-1 font-weight-bold text-textPrimary">{{ activityLog.pace }}</p>
                <p class="text-caption text-textSecondary">{{ $t('sessionDetail.pace') }}</p>
              </div>
            </v-card>

            <v-card
              v-if="activityLog.calories"
              class="bg-cardBg rounded-lg pa-3 d-flex align-center ga-3"
              :style="{
                border: '1px solid rgb(var(--v-theme-borderColor))',
                boxShadow: 'none',
                minWidth: '140px',
                flex: '1 1 0',
              }"
            >
              <v-icon color="primary" size="20">mdi-fire</v-icon>
              <div>
                <p class="text-body-1 font-weight-bold text-textPrimary">
                  {{ activityLog.calories }} kcal
                </p>
                <p class="text-caption text-textSecondary">{{ $t('sessionDetail.calories') }}</p>
              </div>
            </v-card>

            <v-card
              v-if="activityLog.elevationGain"
              class="bg-cardBg rounded-lg pa-3 d-flex align-center ga-3"
              :style="{
                border: '1px solid rgb(var(--v-theme-borderColor))',
                boxShadow: 'none',
                minWidth: '140px',
                flex: '1 1 0',
              }"
            >
              <v-icon color="primary" size="20">mdi-terrain</v-icon>
              <div>
                <p class="text-body-1 font-weight-bold text-textPrimary">
                  {{ activityLog.elevationGain }} m
                </p>
                <p class="text-caption text-textSecondary">
                  {{ $t('sessionDetail.elevationGain') }}
                </p>
              </div>
            </v-card>
          </div>
        </div>
      </template>
    </div>

    <!-- Exercise Details Dialog -->
    <v-dialog v-model="exerciseDialog" fullscreen>
      <ExerciseDetails
        v-if="selectedExercise"
        :selected-exercise="selectedExercise"
        :is-view-exercise="true"
        :hide-menu="true"
        @close="exerciseDialog = false"
      />
    </v-dialog>

    <v-dialog v-model="editActivityDialog" fullscreen>
      <EditActivityLog
        v-if="editActivityDialog && activityLog"
        :log="activityLog"
        @close="editActivityDialog = false"
        @saved="handleActivitySaved"
      />
    </v-dialog>

    <v-dialog v-model="editWorkoutDialog" fullscreen>
      <EditWorkoutSessionDialog
        v-if="editWorkoutDialog && workoutSession"
        :session="workoutSession"
        @close="editWorkoutDialog = false"
        @saved="handleWorkoutSaved"
      />
    </v-dialog>

    <v-dialog v-model="editExerciseSetsDialog" fullscreen>
      <EditSessionExerciseSetsDialog
        v-if="editExerciseSetsDialog && selectedSessionExercise && workoutSession"
        :session-id="workoutSession.id"
        :exercise="selectedSessionExercise"
        @close="editExerciseSetsDialog = false"
        @saved="handleExerciseSetsSaved"
      />
    </v-dialog>

    <!-- Delete confirm dialog -->
    <v-dialog v-model="deleteDialog" max-width="360">
      <v-card
        class="bg-cardBg rounded-lg pa-4"
        :style="{ border: '1px solid rgb(var(--v-theme-borderColor))' }"
      >
        <v-card-title class="text-body-1 font-weight-bold pa-0 mb-3">
          {{ $t('sessionDetail.deleteSession') }}
        </v-card-title>
        <v-card-text class="pa-0 mb-4 text-textSecondary text-body-2">
          {{ $t('sessionDetail.deleteConfirm') }}
        </v-card-text>
        <v-card-actions class="pa-0 d-flex ga-2 justify-end">
          <v-btn variant="text" color="textSecondary" @click="deleteDialog = false">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn variant="flat" color="error" :loading="isDeleting" @click="executeDelete">
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Save as Workout dialog -->
    <v-dialog v-model="saveAsWorkoutDialog" fullscreen>
      <CreateWorkout
        v-if="saveAsWorkoutDialog && workoutInitialData"
        :initial-data="workoutInitialData"
        @close="saveAsWorkoutDialog = false"
      />
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import BackHeader from '@/components/BackHeader.vue'
import EditActivityLog from '@/components/Activity/EditActivityLog.vue'
import { useWorkoutSessionStore } from '@/stores/workoutSession.store'
import { useActivityStore } from '@/stores/activity.store'
import { deleteActivityLog, fetchActivityLogById } from '@/services/activityLog.service'
import { getWorkoutSessionById } from '@/services/workoutSession.service'
import type { WorkoutSession } from '@/interfaces/workoutSession.interface'
import type { ActivityLog } from '@/interfaces/Activity.interface'
import type { Exercise } from '@/interfaces/Exercise.interface'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import ExerciseDetails from '@/components/Exercise/ExerciseDetails.vue'
import { mapSessionToWorkoutInitialData } from '@/utils/sessionToWorkout'
import CreateWorkout from '@/components/Workout/CreateWorkout.vue'
import EditWorkoutSessionDialog from '@/components/Session/EditWorkoutSessionDialog.vue'
import EditSessionExerciseSetsDialog from '@/components/Session/EditSessionExerciseSetsDialog.vue'
import { displayExerciseName, displayActivityName, resolveI18n } from '@/utils/exerciseDisplay'
import { useUserLanguage } from '@/composables/useUserLanguage'

const props = defineProps<{ sessionType?: 'workout' | 'activity'; sessionId?: number }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const { t } = useI18n({ useScope: 'global' })
const { lang } = useUserLanguage()
const route = useRoute()
const router = useRouter()

const workoutSessionStore = useWorkoutSessionStore()
const activityStore = useActivityStore()

const isDialogMode = computed(() => props.sessionId !== undefined)

const type = computed(
  () =>
    props.sessionType ?? ((route.params as Record<string, string>).type as 'workout' | 'activity')
)
const id = computed(() => props.sessionId ?? Number((route.params as Record<string, string>).id))

const deleteDialog = ref(false)
const isDeleting = ref(false)
const saveAsWorkoutDialog = ref(false)
const exerciseDialog = ref(false)
const editActivityDialog = ref(false)
const editWorkoutDialog = ref(false)
const editExerciseSetsDialog = ref(false)
const selectedExercise = ref<Exercise | null>(null)
const selectedSessionExercise = ref<WorkoutSession['exercises'][number] | null>(null)

// Local ref for the session being viewed — does NOT write into the shared store
const localWorkoutSession = ref<WorkoutSession | null>(null)
const localActivityLog = ref<ActivityLog | null>(null)

const workoutSession = computed<WorkoutSession | null>(() => {
  if (type.value !== 'workout') return null
  if (localWorkoutSession.value && localWorkoutSession.value.id === id.value)
    return localWorkoutSession.value
  // Fallback to list data while full session is loading
  const sessions = (workoutSessionStore.workoutSessions as WorkoutSession[]) || []
  return sessions.find(s => s.id === id.value) ?? null
})

const isEmptyWorkout = computed(
  () =>
    type.value === 'workout' &&
    workoutSession.value != null &&
    workoutSession.value.workout == null &&
    (workoutSession.value.exercises?.length ?? 0) > 0
)

const durationMinutes = computed(() => {
  if (!workoutSession.value) return 0
  const s = new Date(workoutSession.value.startedAt).getTime()
  const e = workoutSession.value.endedAt
    ? new Date(workoutSession.value.endedAt).getTime()
    : Date.now()
  return Math.max(0, Math.round((e - s) / 60000))
})

const workoutInitialData = computed(() =>
  workoutSession.value
    ? mapSessionToWorkoutInitialData(workoutSession.value, durationMinutes.value * 60) // convert minutes → seconds
    : undefined
)

const activityLog = computed<ActivityLog | null>(() => {
  if (type.value !== 'activity') return null
  if (localActivityLog.value && localActivityLog.value.id === id.value) {
    return localActivityLog.value
  }
  const logs = (activityStore.activityLogs as ActivityLog[]) || []
  return logs.find(l => l.id === id.value) ?? null
})

const canEditSession = computed(() => {
  if (type.value === 'activity') {
    return activityLog.value != null
  }

  return workoutSession.value?.status === 'finished'
})

const sessionIcon = computed(() => {
  if (type.value === 'activity') {
    const icon = activityLog.value?.activity?.icon
    return icon ? `mdi-${icon}` : 'mdi-run-fast'
  }
  return 'mdi-dumbbell'
})

const sessionTitle = computed(() => {
  if (type.value === 'workout') {
    return (
      workoutSession.value?.workout?.title ?? t('sessionDetail.sessionFallback', { id: id.value })
    )
  }
  return activityLog.value?.activity
    ? displayActivityName(activityLog.value.activity, lang.value)
    : t('sessionDetail.activityFallback', { id: id.value })
})

const sessionSubtitle = computed(() => {
  if (type.value === 'workout' && workoutSession.value) {
    return new Date(workoutSession.value.startedAt).toLocaleString()
  }
  if (type.value === 'activity' && activityLog.value) {
    return new Date(activityLog.value.date).toLocaleDateString()
  }
  return ''
})

const sessionNotes = computed(() => {
  if (type.value === 'workout') return workoutSession.value?.notes ?? ''
  return activityLog.value?.notes ?? ''
})

const durationDisplay = computed(() => {
  if (type.value === 'workout' && workoutSession.value) {
    return `${durationMinutes.value} ${t('units.minShort')}`
  }
  if (type.value === 'activity' && activityLog.value) {
    return `${activityLog.value.duration} ${t('units.minShort')}`
  }
  return '—'
})

const statMidValue = computed(() => {
  if (type.value === 'workout') {
    return `${workoutSession.value?.totalWeight ?? 0} kg`
  }
  return activityLog.value?.calories ? `${activityLog.value.calories}` : '—'
})

const statMidLabel = computed(() =>
  type.value === 'workout' ? t('sessionDetail.totalWeight') : t('sessionDetail.calories')
)

const statRightValue = computed(() => {
  if (type.value === 'workout') {
    return `${workoutSession.value?.exercises?.length ?? 0}`
  }
  return activityLog.value?.distance ? `${activityLog.value.distance} km` : '—'
})

const statRightLabel = computed(() =>
  type.value === 'workout' ? t('sessionDetail.exercises') : t('sessionDetail.distance')
)

function statusLabel(status: WorkoutSession['status']) {
  return t(`session.status.${status}`)
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

function openExercise(ex: WorkoutSession['exercises'][number]) {
  if (ex.exercise) {
    selectedExercise.value = ex.exercise as unknown as Exercise
    exerciseDialog.value = true
  }
}

function confirmDelete() {
  deleteDialog.value = true
}

function openEditDialog() {
  if (type.value === 'activity') {
    editActivityDialog.value = true
    return
  }

  if (workoutSession.value?.status === 'finished') {
    selectedSessionExercise.value = null
    editWorkoutDialog.value = true
  }
}

function openEditExerciseSets(exercise: WorkoutSession['exercises'][number]) {
  selectedSessionExercise.value = exercise
  editExerciseSetsDialog.value = true
}

async function loadSessionDetail() {
  if (type.value === 'workout') {
    localWorkoutSession.value = await getWorkoutSessionById(id.value)
    return
  }

  localActivityLog.value = await fetchActivityLogById(id.value)
}

async function refreshSessionDetail() {
  await loadSessionDetail()

  if (type.value === 'workout') {
    await workoutSessionStore.setWorkoutSessions(true)
    return
  }

  await activityStore.fetchActivityLogs(true)
}

async function handleActivitySaved() {
  await refreshSessionDetail()
  editActivityDialog.value = false
}

async function handleWorkoutSaved() {
  await refreshSessionDetail()
  editWorkoutDialog.value = false
}

async function handleExerciseSetsSaved() {
  await refreshSessionDetail()
  editExerciseSetsDialog.value = false
}

async function executeDelete() {
  isDeleting.value = true
  try {
    if (type.value === 'workout') {
      await workoutSessionStore.deleteSession(id.value)
    } else {
      await deleteActivityLog(id.value)
      await activityStore.fetchActivityLogs(true)
    }
    if (isDialogMode.value) {
      emit('close')
    } else {
      router.back()
    }
  } finally {
    isDeleting.value = false
    deleteDialog.value = false
  }
}

onMounted(async () => {
  await loadSessionDetail()
})

watch(
  () => [props.sessionId, props.sessionType],
  async ([newId]) => {
    if (newId !== undefined) {
      await loadSessionDetail()
      return
    }

    if (type.value === 'activity' && !activityLog.value) {
      await activityStore.fetchActivityLogs(true)
    }
  }
)
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
