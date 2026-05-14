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
      padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
      overscroll-behavior: none;
    "
  >
    <!-- Header -->
    <BackHeader
      :title="workout?.title || ''"
      show-menu
      @close="isDialogMode ? emit('close') : $router.back()"
    >
      <template #menuAppend>
        <v-list
          class="bg-cardBg"
          width="140"
          :style="{ border: '1px solid rgb(var(--v-theme-borderColor))' }"
        >
          <v-list-item @click="isWeightAndRepsOpen = true">
            <v-list-item-title>{{ $t('workout.weightAndReps') }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="isEditWorkoutOpen = true">
            <v-list-item-title>{{ $t('common.edit') }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="duplicate">
            <v-list-item-title>{{ $t('workout.duplicate') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </template>
    </BackHeader>

    <!-- Avatar -->
    <v-avatar size="70" tile color="avatarBg" class="mx-5 mb-3 mt-4 rounded-lg">
      <v-icon color="primary" size="35">mdi-dumbbell</v-icon>
    </v-avatar>

    <div v-if="isHydratingWorkout && !workout" class="mx-5 mt-3">
      <v-card
        class="bg-cardBg pa-4 rounded-lg"
        :style="{ border: '1px solid rgb(var(--v-theme-borderColor))', boxShadow: 'none' }"
      >
        <div class="d-flex align-center ga-3">
          <v-progress-circular indeterminate size="20" width="2" color="primary" />
          <p class="text-body-2 text-textSecondary">{{ t('common.loading') }}</p>
        </div>
      </v-card>
    </div>

    <div v-else-if="hydrationError && !workout" class="mx-5 mt-3">
      <v-card
        class="bg-cardBg pa-4 rounded-lg"
        :style="{ border: '1px solid rgb(var(--v-theme-borderColor))', boxShadow: 'none' }"
      >
        <p class="text-body-2 text-textSecondary mb-3">{{ hydrationError }}</p>
        <v-btn color="primary" variant="tonal" @click="loadWorkout(effectiveWorkoutId)">
          Retry
        </v-btn>
      </v-card>
    </div>

    <div v-else class="mx-5 d-flex flex-column ga-4">
      <!-- Title + Type badge -->
      <div class="pt-4">
        <div class="d-flex align-center ga-2">
          <p class="text-primary text-body-1 text-capitalize">{{ $t('workout.workoutTitle') }}</p>
          <v-chip v-if="workout?.type" size="x-small" color="primary" variant="outlined">
            {{ $t(`editWorkout.types.${workout.type}`) }}
          </v-chip>
        </div>
        <h1 class="text-h5 font-weight-bold">{{ workout?.title }}</h1>
      </div>

      <!-- Stat Cards -->
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
          <v-icon color="primary" size="24" aria-hidden="true">mdi-timer-outline</v-icon>
          <div class="text-body-1 text-textPrimary mt-2">{{ workout?.time || 0 }} min</div>
          <p class="text-textSecondary text-body-2">{{ $t('workout.duration') }}</p>
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
          <v-icon color="primary" size="24" aria-hidden="true">mdi-dumbbell</v-icon>
          <div class="text-body-1 text-textPrimary mt-2">
            {{ workout?.exercises?.length || 0 }}
          </div>
          <p class="text-textSecondary text-body-2">{{ $t('workout.exercisesCount') }}</p>
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
          <v-icon color="primary" size="24" aria-hidden="true">mdi-arm-flex</v-icon>
          <div class="text-body-1 text-textPrimary mt-2">{{ totalSets }}</div>
          <p class="text-textSecondary text-body-2">{{ $t('workoutList.setsUnit') }}</p>
        </v-card>
      </div>

      <!-- About -->
      <div v-if="workout?.description">
        <h1 class="text-h6">{{ $t('exerciseDetails.about') }}</h1>
        <p class="text-body-1 text-textSecondary mt-1">{{ workout.description }}</p>
      </div>

      <!-- Target Muscles -->
      <div v-if="targetMuscleNames.length > 0">
        <h1 class="text-h6">{{ $t('exerciseDetails.targetMuscles') }}</h1>
        <div class="d-flex ga-2 mt-2 flex-wrap">
          <v-chip
            v-for="(mg, idx) in targetMuscleNames"
            :key="mg"
            :color="idx === 0 ? 'primary' : 'textSecondary'"
            :style="
              idx === 0
                ? 'border: 1px solid rgb(var(--v-theme-primary))'
                : 'border: 1px solid rgb(var(--v-theme-borderColor))'
            "
          >
            {{ $t(`muscleGroups.${mg}`) }}
          </v-chip>
        </div>
      </div>

      <!-- Exercises -->
      <div v-if="sortedExercises.length > 0">
        <h1 class="text-h6">{{ $t('workout.exercises') }}</h1>
        <div class="mt-2 d-flex flex-column ga-3">
          <v-card
            v-for="(exercise, idx) in sortedExercises"
            :key="exercise.id"
            class="bg-cardBg rounded-lg d-flex align-center pa-3 cursor-pointer"
            :style="{ border: '1px solid rgb(var(--v-theme-borderColor))', boxShadow: 'none' }"
            @click="openExerciseDetails(exercise)"
          >
            <v-avatar color="avatarBg" size="40" class="rounded-lg mr-3 flex-shrink-0">
              <p class="text-primary">{{ idx + 1 }}</p>
            </v-avatar>

            <div class="flex-grow-1" style="min-width: 0">
              <p class="text-body-1 font-weight-bold text-textPrimary text-truncate">
                {{ displayName(exercise.exercise) }}
              </p>
              <p
                v-if="exercise.exercise.description"
                class="text-body-2 text-textSecondary text-truncate mb-1"
              >
                {{ displayDesc(exercise.exercise) }}
              </p>
              <p class="text-body-2 text-textSecondary">
                {{ $t('workout.setsTimesReps', { sets: exercise.sets, reps: exercise.reps }) }}
                <span v-if="exercise.setWeights && exercise.setWeights.some(w => w > 0)">
                  · {{ exercise.setWeights.join(' / ') }} kg
                </span>
                <span v-else-if="exercise.weight"> · {{ exercise.weight }}kg</span>
                <span v-if="exercise.pauseSeconds">
                  · {{ $t('workout.pauseSeconds', { seconds: exercise.pauseSeconds }) }}
                </span>
              </p>
            </div>
            <div
              v-if="exercise.exercise.primaryMuscleGroups?.length"
              class="flex-shrink-0 ml-2 d-flex ga-1 flex-wrap"
            >
              <v-chip
                v-for="pm in exercise.exercise.primaryMuscleGroups"
                :key="pm.id"
                size="x-small"
                variant="outlined"
                color="textSecondary"
              >
                {{ $t(`muscleGroups.${pm.name}`) }}
              </v-chip>
            </div>
          </v-card>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-10">
        <v-icon size="48" color="textSecondary" class="mb-3">mdi-dumbbell</v-icon>
        <p class="text-subtitle-1 text-textSecondary mb-4">
          {{ $t('workout.noExercisesYet') }}
        </p>
        <v-btn color="primary" variant="tonal" @click="isEditWorkoutOpen = true">
          {{ $t('common.edit') }}
        </v-btn>
      </div>
    </div>

    <!-- Sticky Start Button -->
    <div v-if="workout?.exercises && workout.exercises.length > 0" class="pa-5">
      <v-btn block color="primary" size="large" class="font-weight-bold" @click="startSession">
        {{ $t('workout.startSession') }}
      </v-btn>
    </div>
  </div>

  <!-- Dialogs -->
  <v-dialog v-model="isEditWorkoutOpen" fullscreen>
    <EditWorkout
      :workout="workout"
      @close="onEditWorkoutClose"
      @save="workoutStore.setWorkouts(true)"
    />
  </v-dialog>

  <v-dialog v-model="isWeightAndRepsOpen" fullscreen>
    <WeightAndRepsSettings
      :workout-id="workout?.id || undefined"
      :default-weight-and-reps="workout?.defaultWeightAndReps ?? ''"
      @close="isWeightAndRepsOpen = false"
    />
  </v-dialog>

  <v-dialog v-model="isExerciseDetailsOpen" fullscreen>
    <ExerciseDetails
      v-if="isExerciseDetailsOpen && selectedExerciseForDetails"
      :selected-exercise="selectedExerciseForDetails"
      :is-view-exercise="true"
      :hide-menu="true"
      @close="isExerciseDetailsOpen = false"
    />
  </v-dialog>
</template>

<script setup lang="ts">
import { useWorkoutStore } from '@/stores/workout.store'
import { dublicateWorkout, getWorkoutById } from '@/services/workout.service'
import { startWorkoutSession } from '@/services/workoutSession.service'
import { useWorkoutSessionStore } from '@/stores/workoutSession.store'
import type { Workout, Exercise } from '@/interfaces/Workout.interface'
import type { Exercise as ExerciseCatalog } from '@/interfaces/Exercise.interface'
import { toast } from 'vuetify-sonner'
import EditWorkout from '@/components/Workout/EditWorkout.vue'
import WeightAndRepsSettings from '@/components/Workout/WeightAndRepsSettings.vue'
import ExerciseDetails from '@/components/Exercise/ExerciseDetails.vue'
import { fetchExerciseById } from '@/services/exercise.service'
import { useI18n } from 'vue-i18n'
import { displayExerciseName, resolveI18n } from '@/utils/exerciseDisplay'
import { useUserLanguage } from '@/composables/useUserLanguage'
import router from '@/router'
import { useRoute } from 'vue-router'
import BackHeader from '@/components/BackHeader.vue'

const props = defineProps<{ workoutId?: number }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const { t } = useI18n({ useScope: 'global' })
const { lang } = useUserLanguage()
const route = useRoute()

const workoutStore = useWorkoutStore()
const workoutSessionStore = useWorkoutSessionStore()

const isDialogMode = computed(() => props.workoutId !== undefined)

const isHydratingWorkout = ref(false)
const hydrationError = ref<string | null>(null)

const isEditWorkoutOpen = ref(false)
const isWeightAndRepsOpen = ref(false)
const isExerciseDetailsOpen = ref(false)
const selectedExerciseForDetails = ref<ExerciseCatalog | null>(null)

const workout = computed<Workout | null>(() => workoutStore.currentWorkout)

const sortedExercises = computed(() => {
  if (!workout.value?.exercises) return []
  return [...workout.value.exercises].sort((a, b) => a.order - b.order)
})

const totalSets = computed(
  () => workout.value?.exercises?.reduce((sum, ex) => sum + (ex.sets || 0), 0) ?? 0
)

// --- Target muscles from the workout's targetMuscleGroups ---
const targetMuscleNames = computed<string[]>(() => {
  if (workout.value?.targetMuscleGroups?.length) {
    return workout.value.targetMuscleGroups.map(mg => mg.name)
  }
  // Fallback: derive from exercises' muscle groups
  if (!workout.value?.exercises?.length) return []
  const freq = new Map<string, number>()
  for (const ex of workout.value.exercises) {
    for (const mg of ex.exercise.muscleGroups || []) {
      freq.set(mg.name, (freq.get(mg.name) ?? 0) + 1)
    }
  }
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)
})

// --- Helpers ---
const displayName = (exercise: NonNullable<Exercise['exercise']>) =>
  displayExerciseName(exercise, lang.value)

const displayDesc = (exercise: NonNullable<Exercise['exercise']>) =>
  resolveI18n(exercise.description, lang.value)

const openExerciseDetails = async (workoutExercise: Exercise) => {
  try {
    const exercise = await fetchExerciseById(workoutExercise.exercise.id)
    if (exercise) {
      selectedExerciseForDetails.value = exercise
      isExerciseDetailsOpen.value = true
    }
  } catch (error) {
    console.error('Error fetching exercise details:', error)
  }
}

const onEditWorkoutClose = async () => {
  isEditWorkoutOpen.value = false
  await workoutStore.setWorkouts(true)
}

const getWorkoutIdFromRoute = () => {
  const params = route.params as Record<string, string | string[] | undefined>
  const rawId = params.workoutId
  const parsed = Number(Array.isArray(rawId) ? rawId[0] : rawId)
  if (!Number.isFinite(parsed)) {
    return null
  }
  return parsed
}

const effectiveWorkoutId = computed(() => props.workoutId ?? getWorkoutIdFromRoute())

const loadWorkout = async (workoutId: number | null) => {
  hydrationError.value = null

  if (workoutId === null) {
    workoutStore.currentWorkout = null
    hydrationError.value = 'Invalid workout id.'
    return
  }

  isHydratingWorkout.value = true
  try {
    const inStore = await workoutStore.setCurrentWorkout(workoutId)
    if (inStore) {
      return
    }

    const workoutById = await getWorkoutById(workoutId)
    workoutStore.currentWorkout = workoutById
  } catch (error) {
    console.error('Error loading workout details:', error)
    workoutStore.currentWorkout = null
    hydrationError.value = 'Unable to load workout details.'
  } finally {
    isHydratingWorkout.value = false
  }
}

watch(effectiveWorkoutId, loadWorkout, { immediate: true })

// --- Actions ---
const startSession = async () => {
  if (!workout.value) return
  try {
    const response = await startWorkoutSession(workout.value.id)
    if (response?.id) {
      await workoutSessionStore.fetchSelectedWorkoutSession(response.id)
      router.push(`/session/${response.id}`)
    } else {
      toast.error(t('workout.failedToStartSession'), { progressBar: true, duration: 1000 })
    }
  } catch (error) {
    console.error('Error starting session:', error)
    toast.error(t('workout.failedToStartSession'), { progressBar: true, duration: 1000 })
  }
}

const duplicate = async () => {
  if (!workout.value) return
  try {
    const response = await dublicateWorkout(workout.value.id)
    if (response?.id) {
      await workoutStore.setWorkouts(true)
      toast.success(t('workout.duplicated'), { progressBar: true, duration: 1000 })
      if (isDialogMode.value) {
        emit('close')
      } else {
        workoutStore.setCurrentWorkout(response.id)
        router.push(`/workout/${response.id}`)
      }
    }
  } catch (error) {
    console.error('Error duplicating workout:', error)
  }
}
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
