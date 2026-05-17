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
  <v-dialog v-model="dialogOpen" fullscreen :scrim="false" transition="dialog-bottom-transition">
    <v-card class="bg-background d-flex flex-column" style="height: 100dvh">
      <!-- Header -->
      <BackHeader
        :title="$t('schedule.registerWorkout')"
        :show-menu="false"
        :show-save="true"
        class="sticky-header"
        @close="close"
        @save="submit"
      />

      <div class="pa-5" style="flex: 1 1 auto; overflow-y: auto; -webkit-overflow-scrolling: touch">
        <!-- Date display -->
        <v-card
          class="bg-cardBg rounded-lg pa-4 mb-5"
          style="border: 1px solid rgb(var(--v-theme-borderColor)); height: fit-content !important"
        >
          <div class="d-flex align-center ga-3">
            <v-icon color="primary">mdi-calendar</v-icon>
            <div>
              <p class="text-caption text-textSecondary">{{ $t('common.date') }}</p>
              <p class="text-body-1 font-weight-bold">{{ formattedDate }}</p>
            </div>
          </div>
        </v-card>

        <!-- Type toggle: Workout or Activity -->
        <div class="mb-5">
          <p class="text-caption text-uppercase font-weight-bold text-textSecondary mb-2">
            {{ $t('schedule.selectType') }}
          </p>
          <v-btn-toggle
            v-model="sessionType"
            mandatory
            color="primary"
            variant="outlined"
            class="w-100"
          >
            <v-btn value="workout" class="flex-grow-1">
              <v-icon start>mdi-dumbbell</v-icon>
              {{ $t('schedule.workout') }}
            </v-btn>
            <v-btn value="activity" class="flex-grow-1">
              <v-icon start>mdi-run</v-icon>
              {{ $t('schedule.activity') }}
            </v-btn>
          </v-btn-toggle>
        </div>

        <!-- ==================== WORKOUT MODE ==================== -->
        <template v-if="sessionType === 'workout'">
          <div class="mb-5">
            <p class="text-caption text-uppercase font-weight-bold text-textSecondary mb-2">
              {{ $t('schedule.selectWorkout') }}
            </p>
            <v-list
              v-if="workoutList.length > 0"
              class="bg-cardBg rounded-lg"
              style="border: 1px solid rgb(var(--v-theme-borderColor))"
            >
              <v-list-item
                v-for="w in workoutList"
                :key="w.id"
                :active="selectedWorkoutId === w.id"
                color="primary"
                @click="selectedWorkoutId = w.id"
              >
                <template #prepend>
                  <v-icon :color="selectedWorkoutId === w.id ? 'primary' : undefined"
                    >mdi-dumbbell</v-icon
                  >
                </template>
                <v-list-item-title class="font-weight-bold">{{ w.title }}</v-list-item-title>
                <template #append>
                  <v-icon v-if="selectedWorkoutId === w.id" color="primary">mdi-check</v-icon>
                </template>
              </v-list-item>
            </v-list>
          </div>

          <!-- Time fields -->
          <div class="d-flex ga-3 mb-5">
            <v-text-field
              v-model="startTime"
              type="time"
              :label="$t('schedule.startTime')"
              variant="outlined"
              density="compact"
              hide-details
              class="bg-cardBg rounded-lg"
            />
            <v-text-field
              v-model="endTime"
              type="time"
              :label="$t('schedule.endTime')"
              variant="outlined"
              density="compact"
              hide-details
              class="bg-cardBg rounded-lg"
            />
          </div>

          <!-- Exercise cards with inline sets -->
          <div v-if="selectedWorkout" class="mb-5">
            <p class="text-caption text-uppercase font-weight-bold text-textSecondary mb-2">
              {{ $t('schedule.exercises') }}
            </p>
            <v-card
              v-for="ex in selectedWorkout.exercises"
              :key="ex.id"
              class="bg-cardBg rounded-lg pa-4 mb-3"
              style="border: 1px solid rgb(var(--v-theme-borderColor)); overflow: visible"
            >
              <p class="text-body-1 font-weight-bold mb-3">{{ ex.exercise ? displayExerciseName(ex.exercise, lang) : '' }}</p>

              <!-- Set header row -->
              <div class="d-flex align-center ga-2 mb-1 text-caption text-textSecondary">
                <span style="width: 40px">{{ $t('schedule.setLabel') }}</span>
                <span class="flex-grow-1">{{ $t('schedule.weight') }} (kg)</span>
                <span class="flex-grow-1">{{ $t('schedule.reps') }}</span>
                <span style="width: 40px; text-align: center">
                  <v-icon size="16">mdi-check</v-icon>
                </span>
                <span style="width: 28px"></span>
              </div>

              <!-- Set rows -->
              <div
                v-for="(s, idx) in exerciseSets[ex.id]"
                :key="`${ex.id}-${idx}`"
                class="d-flex align-center ga-2 mb-1"
              >
                <span class="text-body-2 font-weight-bold" style="width: 40px">{{ s.set }}</span>
                <v-text-field
                  :model-value="s.weight"
                  type="text"
                  inputmode="decimal"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="flex-grow-1"
                  @update:model-value="s.weight = normalizeDecimalStr($event)"
                  @change="onWeightChange(ex.id, idx, s.weight)"
                />
                <v-text-field
                  :model-value="String(s.reps)"
                  type="text"
                  inputmode="numeric"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="flex-grow-1"
                  @update:model-value="s.reps = parseIntInput($event)"
                />
                <v-checkbox
                  v-model="s.done"
                  hide-details
                  density="compact"
                  color="primary"
                  style="width: 40px; flex: none"
                />
                <v-btn
                  icon
                  variant="text"
                  size="x-small"
                  color="error"
                  @click="removeSet(ex.id, idx)"
                >
                  <v-icon size="16">mdi-close</v-icon>
                </v-btn>
              </div>

              <!-- Add set button -->
              <v-btn
                variant="text"
                color="primary"
                size="small"
                prepend-icon="mdi-plus"
                class="mt-2"
                @click="addSet(ex.id)"
              >
                {{ $t('session.addSet') }}
              </v-btn>
            </v-card>
          </div>
        </template>

        <!-- ==================== ACTIVITY MODE ==================== -->
        <template v-if="sessionType === 'activity'">
          <div class="mb-5">
            <p class="text-caption text-uppercase font-weight-bold text-textSecondary mb-2">
              {{ $t('schedule.selectActivity') }}
            </p>
            <v-list
              v-if="activityList.length > 0"
              class="bg-cardBg rounded-lg"
              style="border: 1px solid rgb(var(--v-theme-borderColor))"
            >
              <v-list-item
                v-for="a in activityList"
                :key="a.id"
                :active="selectedActivityId === a.id"
                color="primary"
                @click="selectedActivityId = a.id"
              >
                <template #prepend>
                  <v-icon :color="selectedActivityId === a.id ? 'primary' : undefined"
                    >mdi-run</v-icon
                  >
                </template>
                <v-list-item-title class="font-weight-bold">{{ displayActivityName(a, lang) }}</v-list-item-title>
                <template #append>
                  <v-icon v-if="selectedActivityId === a.id" color="primary">mdi-check</v-icon>
                </template>
              </v-list-item>
            </v-list>
          </div>

          <!-- Duration (always shown) -->
          <v-text-field
            :model-value="activityDurationStr"
            type="text"
            inputmode="decimal"
            :label="$t('schedule.duration')"
            variant="outlined"
            density="compact"
            hide-details
            class="bg-cardBg rounded-lg mb-5"
            suffix="min"
            @update:model-value="activityDurationStr = normalizeDecimalStr($event)"
          />

          <!-- Conditional tracking fields based on selected activity -->
          <template v-if="selectedActivity">
            <!-- Distance -->
            <v-text-field
              v-if="selectedActivity.trackDistance"
              :model-value="activityDistanceStr"
              type="text"
              inputmode="decimal"
              :label="$t('schedule.distance')"
              variant="outlined"
              density="compact"
              hide-details
              class="bg-cardBg rounded-lg mb-4"
              suffix="km"
              @update:model-value="activityDistanceStr = normalizeDecimalStr($event)"
            />

            <!-- Calculated Pace (read-only) -->
            <v-text-field
              v-if="selectedActivity.trackPace && calculatedPace"
              :model-value="calculatedPace"
              :label="$t('schedule.pace')"
              readonly
              suffix="/km"
              variant="outlined"
              density="compact"
              hide-details
              class="bg-cardBg rounded-lg mb-4"
            />

            <!-- Elevation Gain -->
            <v-text-field
              v-if="selectedActivity.trackElevation"
              :model-value="activityElevationGainStr"
              type="text"
              inputmode="decimal"
              :label="$t('schedule.elevationGain')"
              variant="outlined"
              density="compact"
              hide-details
              class="bg-cardBg rounded-lg mb-4"
              suffix="m"
              @update:model-value="activityElevationGainStr = normalizeDecimalStr($event)"
            />

            <!-- Max Elevation -->
            <v-text-field
              v-if="selectedActivity.trackElevation"
              :model-value="activityMaxElevationStr"
              type="text"
              inputmode="decimal"
              :label="$t('schedule.maxElevation')"
              variant="outlined"
              density="compact"
              hide-details
              class="bg-cardBg rounded-lg mb-4"
              suffix="m"
              @update:model-value="activityMaxElevationStr = normalizeDecimalStr($event)"
            />

            <!-- Calories -->
            <v-text-field
              v-if="selectedActivity.trackCalories"
              :model-value="activityCaloriesStr"
              type="text"
              inputmode="decimal"
              :label="$t('schedule.calories')"
              variant="outlined"
              density="compact"
              hide-details
              class="bg-cardBg rounded-lg mb-4"
              suffix="kcal"
              @update:model-value="activityCaloriesStr = normalizeDecimalStr($event)"
            />
          </template>
        </template>

        <!-- Notes (shared) -->
        <div class="pb-6">
          <p class="text-caption text-uppercase font-weight-bold text-textSecondary mb-2">
            {{ $t('schedule.notes') }}
          </p>
          <v-textarea
            v-model="notesText"
            variant="outlined"
            density="compact"
            rows="2"
            hide-details
            class="bg-cardBg rounded-lg"
            :placeholder="$t('schedule.noNotes')"
          />
        </div>
      </div>

      <!-- Weight propagation dialog -->
      <v-dialog v-model="showPropagateDialog" max-width="500" persistent>
        <v-card>
          <v-card-title>{{ $t('session.updateSubsequentSets') }}</v-card-title>
          <v-card-text>
            {{
              $t('session.updateSetsPrompt', {
                sets: propagateSetsLabel,
                weight: pendingWeight,
                reps: pendingReps,
              })
            }}
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="grey" variant="text" @click="confirmPropagate(false)">
              {{ $t('session.noJustThisOne') }}
            </v-btn>
            <v-btn color="primary" variant="text" @click="confirmPropagate(true)">
              {{ $t('session.yesUpdateAll') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { useWorkoutStore } from '@/stores/workout.store'
import { useActivityStore } from '@/stores/activity.store'
import { logPastWorkoutSession } from '@/services/workoutSession.service'
import { createActivityLog } from '@/services/activityLog.service'
import type { Activity } from '@/interfaces/Activity.interface'
import type { Workout } from '@/interfaces/Workout.interface'
import { parseDecimalInput, parseIntInput, normalizeDecimalStr } from '@/utils/decimalInput'
import { displayExerciseName, displayActivityName } from '@/utils/exerciseDisplay'
import { useUserLanguage } from '@/composables/useUserLanguage'

interface InlineSet {
  set: number
  weight: string // stored as string to allow decimal input like "90." mid-typing
  reps: number
  done: boolean
}

const props = defineProps<{
  modelValue: boolean
  date: string // YYYY-MM-DD
  preselectedType?: 'workout' | 'activity'
  preselectedWorkoutId?: number | null
  preselectedActivityId?: number | null
  preselectedScheduledSessionId?: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'session-added': []
}>()

const dialogOpen = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const { locale } = useI18n()
const { lang } = useUserLanguage()

const workoutStore = useWorkoutStore()
const activityStore = useActivityStore()

// --- shared state ---
const sessionType = ref<'workout' | 'activity'>('workout')
const notesText = ref('')
const isSubmitting = ref(false)

// --- workout state ---
const selectedWorkoutId = ref<number | null>(null)
const startTime = ref('09:00')
const endTime = ref('10:00')
const exerciseSets = reactive<Record<number, InlineSet[]>>({})

// --- weight propagation state ---
const showPropagateDialog = ref(false)
const pendingExId = ref<number | null>(null)
const pendingSetIndex = ref<number | null>(null)
const pendingWeight = ref(0)
const pendingReps = ref(0)
const propagateSetsLabel = computed(() => {
  if (pendingExId.value == null || pendingSetIndex.value == null) return ''
  const sets = exerciseSets[pendingExId.value] || []
  const indices = sets.slice(pendingSetIndex.value + 1).map(s => s.set)
  if (indices.length === 0) return ''
  if (indices.length === 1) return indices[0].toString()
  const last = indices.pop()
  return indices.join(', ') + ' & ' + last
})

// --- activity state ---
const selectedActivityId = ref<number | null>(null)
const activityDuration = ref(30)
const activityDistance = ref<number | undefined>(undefined)
const activityElevationGain = ref<number | undefined>(undefined)
const activityMaxElevation = ref<number | undefined>(undefined)
const activityCalories = ref<number | undefined>(undefined)

// String refs for activity decimal fields
const activityDurationStr = ref('30')
const activityDistanceStr = ref('')
const activityElevationGainStr = ref('')
const activityMaxElevationStr = ref('')
const activityCaloriesStr = ref('')

// --- computeds ---
const formattedDate = computed(() => {
  const d = new Date(props.date + 'T12:00:00')
  return d.toLocaleDateString(locale.value, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
})

const workoutList = computed(() => workoutStore.workouts || [])
const activityList = computed(() => activityStore.activities || [])

const selectedWorkout = computed<Workout | undefined>(() =>
  workoutList.value.find((w: Workout) => w.id === selectedWorkoutId.value)
)

const selectedActivity = computed<Activity | undefined>(() =>
  activityList.value.find((a: Activity) => a.id === selectedActivityId.value)
)

const calculatedPace = computed(() => {
  const dur = parseDecimalInput(activityDurationStr.value)
  const dist = parseDecimalInput(activityDistanceStr.value)
  if (!dur || !dist) return null
  const paceMinutes = dur / dist
  const minutes = Math.floor(paceMinutes)
  const seconds = Math.round((paceMinutes - minutes) * 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

const canSubmit = computed(() => {
  if (sessionType.value === 'workout') {
    return !!selectedWorkoutId.value && !!startTime.value && !!endTime.value
  } else {
    return !!selectedActivityId.value && parseDecimalInput(activityDurationStr.value) > 0
  }
})

// --- watchers ---
watch(dialogOpen, async open => {
  if (open) {
    sessionType.value = props.preselectedType || 'workout'
    selectedWorkoutId.value = props.preselectedWorkoutId ?? null
    selectedActivityId.value = props.preselectedActivityId ?? null
    startTime.value = '09:00'
    endTime.value = '10:00'
    activityDuration.value = 30
    activityDistance.value = undefined
    activityElevationGain.value = undefined
    activityMaxElevation.value = undefined
    activityCalories.value = undefined
    activityDurationStr.value = '30'
    activityDistanceStr.value = ''
    activityElevationGainStr.value = ''
    activityMaxElevationStr.value = ''
    activityCaloriesStr.value = ''
    notesText.value = ''
    // Clear exerciseSets
    Object.keys(exerciseSets).forEach(k => delete exerciseSets[Number(k)])

    await Promise.all([workoutStore.setWorkouts(), activityStore.fetchActivities()])

    // Re-apply preselected IDs after store data is loaded (watch triggers populate sets)
    if (props.preselectedType === 'workout' && props.preselectedWorkoutId) {
      selectedWorkoutId.value = props.preselectedWorkoutId
    } else if (props.preselectedType === 'activity' && props.preselectedActivityId) {
      selectedActivityId.value = props.preselectedActivityId
    }
  } else {
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')))
  }
})

watch(sessionType, () => {
  selectedWorkoutId.value = null
  selectedActivityId.value = null
  Object.keys(exerciseSets).forEach(k => delete exerciseSets[Number(k)])
})

// Populate inline sets from workout template when a workout is selected
watch(selectedWorkoutId, () => {
  const workout = selectedWorkout.value
  // Clear old sets
  Object.keys(exerciseSets).forEach(k => delete exerciseSets[Number(k)])
  if (!workout) return
  for (const ex of workout.exercises) {
    const sets: InlineSet[] = []
    for (let i = 1; i <= ex.sets; i++) {
      sets.push({
        set: i,
        weight: String(ex.weight),
        reps: ex.reps,
        done: true,
      })
    }
    exerciseSets[ex.id] = sets
  }
})

// Reset tracking fields when activity changes
watch(selectedActivityId, () => {
  activityDistance.value = undefined
  activityElevationGain.value = undefined
  activityMaxElevation.value = undefined
  activityCalories.value = undefined
})

function close() {
  dialogOpen.value = false
}

function addSet(exId: number) {
  const sets = exerciseSets[exId]
  if (!sets) return
  const lastSet = sets[sets.length - 1]
  sets.push({
    set: sets.length + 1,
    weight: lastSet?.weight ?? '0',
    reps: lastSet?.reps ?? 0,
    done: true,
  })
}

function removeSet(exId: number, idx: number) {
  const sets = exerciseSets[exId]
  if (!sets || sets.length <= 1) return
  sets.splice(idx, 1)
  sets.forEach((s, i) => {
    s.set = i + 1
  })
}

function onWeightChange(exId: number, idx: number, newWeightStr: string) {
  const sets = exerciseSets[exId]
  if (!sets) return
  const subsequentSets = sets.slice(idx + 1)
  if (subsequentSets.length > 0) {
    pendingExId.value = exId
    pendingSetIndex.value = idx
    pendingWeight.value = parseDecimalInput(newWeightStr)
    pendingReps.value = sets[idx].reps
    showPropagateDialog.value = true
  }
}

function confirmPropagate(shouldPropagate: boolean) {
  if (shouldPropagate && pendingExId.value != null && pendingSetIndex.value != null) {
    const sets = exerciseSets[pendingExId.value]
    if (sets) {
      for (let i = pendingSetIndex.value + 1; i < sets.length; i++) {
        sets[i].weight = String(pendingWeight.value)
        sets[i].reps = pendingReps.value
      }
    }
  }
  showPropagateDialog.value = false
  pendingExId.value = null
  pendingSetIndex.value = null
}

async function submit() {
  if (!canSubmit.value) return
  isSubmitting.value = true

  try {
    if (sessionType.value === 'workout') {
      const startedAt = new Date(`${props.date}T${startTime.value}:00`).toISOString()
      const endedAt = new Date(`${props.date}T${endTime.value}:00`).toISOString()

      // Build completedExercises from done sets
      const completedExercises: {
        exerciseId: number
        sets: { setNumber: number; weight: number; reps: number }[]
      }[] = []
      const workout = selectedWorkout.value
      if (workout) {
        for (const ex of workout.exercises) {
          const sets = exerciseSets[ex.id]
          if (!sets) continue
          const doneSets = sets.filter(s => s.done)
          if (doneSets.length > 0) {
            completedExercises.push({
              exerciseId: ex.exercise.id,
              sets: doneSets.map(s => ({
                setNumber: s.set,
                weight: parseDecimalInput(s.weight),
                reps: s.reps,
              })),
            })
          }
        }
      }

      await logPastWorkoutSession({
        workoutId: selectedWorkoutId.value!,
        startedAt,
        endedAt,
        notes: notesText.value || undefined,
        scheduledSessionId: props.preselectedScheduledSessionId ?? undefined,
        completedExercises: completedExercises.length > 0 ? completedExercises : undefined,
      })
    } else {
      await createActivityLog({
        activityId: selectedActivityId.value!,
        date: props.date,
        duration: parseDecimalInput(activityDurationStr.value),
        distance: activityDistanceStr.value
          ? parseDecimalInput(activityDistanceStr.value)
          : undefined,
        elevationGain: activityElevationGainStr.value
          ? parseDecimalInput(activityElevationGainStr.value)
          : undefined,
        maxElevation: activityMaxElevationStr.value
          ? parseDecimalInput(activityMaxElevationStr.value)
          : undefined,
        calories: activityCaloriesStr.value
          ? parseDecimalInput(activityCaloriesStr.value)
          : undefined,
        notes: notesText.value || undefined,
        scheduledSessionId: props.preselectedScheduledSessionId ?? undefined,
      })
    }

    emit('session-added')
    close()
  } catch (error) {
    console.error('Failed to log past session:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>
