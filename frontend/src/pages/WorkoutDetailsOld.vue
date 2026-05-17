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
  <div>
    <BackHeader :show-menu="true" :title="$t('workout.workoutTitle')" :route-to="`/`">
      <template #menuAppend>
        <v-list>
          <v-list-item @click="isWeightAndRepsOpen = true">
            <v-list-item-title>{{ $t('workout.weightAndReps') }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="isAddExerciseOpen = true">
            <v-list-item-title>{{ $t('session.addExercise') }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="isEditWorkoutOpen = true">
            <v-list-item-title>{{ $t('common.edit') }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="dublicate">
            <v-list-item-title>{{ $t('workout.duplicate') }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="() => (isDeleteDialogOpen = true)">
            <v-list-item-title>{{ $t('common.delete') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </template>
    </BackHeader>

    <div class="px-5">
      <div class="py-4">
        <h1 class="text-h5 font-weight-bold">
          {{ workout?.title }}
        </h1>
        <p>{{ workout?.description }}</p>

        <div class="d-flex ga-2 align-center mt-2 flex-wrap">
          <v-chip label color="orange-lighten-1"> {{ workout?.time }} min </v-chip>

          <v-chip
            v-for="group in visibleGroups"
            :key="group"
            color="green-lighten-1"
            label
            size="small"
          >
            {{ group }}
          </v-chip>

          <v-chip
            v-if="hiddenCount > 0"
            label
            variant="tonal"
            color="green-lighten-1"
            size="small"
            :aria-label="$t('workout.showMoreMuscleGroupsAria', { count: hiddenCount })"
            @click="isAllGroupsOpen = true"
          >
            {{ $t('workout.moreCount', { count: hiddenCount }) }}
          </v-chip>
        </div>
      </div>

      <v-divider />

      <v-btn
        v-if="workout?.exercises && workout.exercises.length > 0"
        class="w-100"
        color="primary"
        @click="startSession"
      >
        {{ $t('workout.startSession') }}
      </v-btn>

      <div v-else class="text-center my-5">
        <p class="text-subtitle-1 mb-4">
          {{ $t('workout.noExercisesYet') }}
        </p>
        <v-btn color="primary" @click="isAddExerciseOpen = true">
          {{ $t('session.addExercise') }}
        </v-btn>
      </div>

      <!-- Compact Workout History -->
      <div v-if="workoutQuickStats" class="mt-3 mb-2">
        <p class="text-caption text-uppercase font-weight-bold text-textSecondary mb-2">
          {{ $t('statistics.workoutStats') }}
        </p>
        <div class="d-flex flex-wrap ga-2 mb-3">
          <v-chip size="small" variant="tonal">
            {{ workoutQuickStats.timesCompleted }}
            {{ $t('statistics.timesCompleted').toLowerCase() }}
          </v-chip>
          <v-chip v-if="workoutQuickStats.averageDuration" size="small" variant="tonal">
            ~{{ Math.round(workoutQuickStats.averageDuration) }} min
            {{ $t('statistics.avgDuration').toLowerCase() }}
          </v-chip>
          <v-chip v-if="workoutQuickStats.lastPerformed" size="small" variant="tonal">
            {{ $t('statistics.lastPerformed') }}: {{ formatDate(workoutQuickStats.lastPerformed) }}
          </v-chip>
        </div>
        <div v-if="workoutQuickStats.recentSessions.length > 0">
          <p class="text-caption text-uppercase font-weight-bold text-textSecondary mb-1">
            {{ $t('statistics.recentSessions') }}
          </p>
          <v-card
            v-for="(session, idx) in workoutQuickStats.recentSessions"
            :key="idx"
            class="bg-cardBg pa-2 px-3 rounded-lg mb-1"
            :style="{ border: '1px solid rgb(var(--v-theme-borderColor))', boxShadow: 'none' }"
          >
            <div class="d-flex align-center justify-space-between">
              <span class="text-caption">{{ formatDate(session.date) }}</span>
              <span class="text-caption text-textSecondary">
                {{ formatDuration(session.duration) }}
                · {{ session.totalVolume?.toLocaleString() ?? 0 }} kg
              </span>
            </div>
          </v-card>
        </div>
        <v-btn
          variant="text"
          color="primary"
          size="small"
          class="px-0"
          @click="$router.push('/statistics')"
        >
          {{ $t('statistics.viewFullHistory') }}
          <v-icon end size="14">mdi-arrow-right</v-icon>
        </v-btn>
      </div>

      <div class="mt-4">
        <v-card
          v-for="(exercise, index) in sortedExercises"
          :key="exercise.id"
          class="mb-4 d-flex pa-2 px-4 align-center justify-space-between"
          style="border-radius: 5px; cursor: move"
          draggable="true"
          @dragstart="onDragStart(index)"
          @dragover.prevent="onDragOver(index)"
          @drop="onDrop(index)"
          @dragend="onDragEnd"
          @click="selectExercise(exercise)"
        >
          <div class="d-flex ga-5 align-center flex-grow-1">
            <v-icon>mdi-drag-vertical</v-icon>
            <img
              v-if="false /*TODO: Remove when image upload is added */"
              class="bg-grey"
              style="width: 65px; height: 65px"
            />
            <div class="d-flex flex-column ga-1">
              <h2 class="text-h6">
                {{ exercise.exercise ? displayName(exercise.exercise) : '' }}
              </h2>
              <div class="d-flex ga-2">
                <p class="text-body-2">
                  {{ $t('workout.setsTimesReps', { sets: exercise.sets, reps: exercise.reps }) }}
                </p>
                <p class="text-body-2">
                  {{ $t('workout.pauseSeconds', { seconds: exercise.pauseSeconds }) }}
                </p>
                <p class="text-body-2">{{ exercise.weight }}kg</p>
              </div>
            </div>
          </div>
        </v-card>
      </div>
    </div>
  </div>

  <v-bottom-sheet v-model="isAllGroupsOpen">
    <v-card>
      <v-card-title class="text-subtitle-1 font-weight-bold">
        Muscle groups ({{ groups.length }})
      </v-card-title>
      <v-divider />
      <div class="pa-4 d-flex flex-wrap ga-2">
        <v-chip v-for="group in groups" :key="group" label size="small" color="green-lighten-1">
          {{ group }}
        </v-chip>
      </div>
    </v-card>
  </v-bottom-sheet>

  <v-dialog v-model="isAddExerciseOpen" fullscreen>
    <AddExerciseList
      v-if="isAddExerciseOpen"
      :initial-selected-ids="selectedExerciseIds"
      @close="isAddExerciseOpen = false"
      @save="updateWorkoutExercises"
    />
  </v-dialog>

  <v-dialog v-model="isEditExerciseOpen" fullscreen>
    <EditWorkoutExercise
      :selected-exercise="selectedExercise!"
      :workout-id="workout?.id ? Number(workout.id) : undefined"
      :is-view-exercise="false"
      :is-view-workout-exercise="true"
      @close="onEditExerciseClose"
    />
  </v-dialog>

  <v-dialog v-model="isEditWorkoutOpen" fullscreen>
    <EditWorkout
      :workout="workout"
      @close="isEditWorkoutOpen = false"
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

  <AcceptDialog
    v-model="isDeleteDialogOpen"
    :title="$t('workout.deleteWorkoutTitle')"
    :description="$t('workout.deleteWorkoutConfirm')"
    @accept="deleteExercise"
    @cancel="isDeleteDialogOpen = false"
  />
</template>

<script lang="ts" setup>
import BackHeader from '@/components/BackHeader.vue'
import router from '@/router'
import { useWorkoutStore } from '@/stores/workout.store'
import { startWorkoutSession } from '@/services/workoutSession.service'
import { useWorkoutSessionStore } from '@/stores/workoutSession.store'
import { useMuscleGroupStore } from '@/stores/muscleGroup.store'
import type { MuscleGroup } from '@/interfaces/MuscleGroup.interface'
import type { Workout, Exercise } from '@/interfaces/Workout.interface'
import {
  deleteWorkout,
  dublicateWorkout,
  removeExercisesFromWorkout,
  addExercisesToWorkout,
  reorderExercises,
} from '@/services/workout.service'
import { toast } from 'vuetify-sonner'
import EditWorkoutExercise from '@/components/Workout/EditWorkoutExercise.vue'
import { useI18n } from 'vue-i18n'
import { displayExerciseName } from '@/utils/exerciseDisplay'
import { useUserLanguage } from '@/composables/useUserLanguage'
import { useStatisticsStore } from '@/stores/statistics.store'
import type { WorkoutQuickStats } from '@/interfaces/Statistics.interface'

const { t } = useI18n({ useScope: 'global' })
const { lang } = useUserLanguage()

const isAddExerciseOpen = ref<boolean>(false)
const isEditExerciseOpen = ref<boolean>(false)
const isDeleteDialogOpen = ref<boolean>(false)
const isEditWorkoutOpen = ref<boolean>(false)
const isWeightAndRepsOpen = ref<boolean>(false)
const isUpdatingWorkout = ref<boolean>(false)

const muscleGroupStore = useMuscleGroupStore()
const workoutStore = useWorkoutStore()
const workoutSessionStore = useWorkoutSessionStore()
const statisticsStore = useStatisticsStore()
const workout = computed<Workout | null>(() => workoutStore.currentWorkout)
const selectedExercise = ref<Exercise | null>(null)

// Drag and drop state
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

// Sorted exercises for display
const sortedExercises = computed(() => {
  if (!workout.value?.exercises) return []
  return [...workout.value.exercises].sort((a, b) => a.order - b.order)
})

const displayName = (exercise: NonNullable<Exercise['exercise']>) =>
  displayExerciseName(exercise, lang.value)

type GroupStat = { name: string; count: number }

const groupStats = computed<GroupStat[]>(() => {
  if (!workout.value?.exercises || workout.value.exercises.length === 0) {
    return []
  }

  const muscleGroups = muscleGroupStore.muscleGroups as MuscleGroup[]
  const names: string[] = workout.value.exercises.flatMap(ex => {
    const ids =
      (ex.exercise.muscleGroups || []).map(mg =>
        typeof mg === 'object' && mg !== null ? mg.id : mg
      ) ?? []
    return ids
      .map(id => muscleGroups.find(g => g.id === id)?.name || t('common.unknown'))
      .filter(Boolean)
  })

  const freq = new Map<string, number>()
  for (const n of names) freq.set(n, (freq.get(n) ?? 0) + 1)

  return Array.from(freq.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
})

const groups = computed<string[]>(() => groupStats.value.map(g => g.name))

const MAX_VISIBLE = 3
const visibleGroups = computed<string[]>(() => groups.value.slice(0, MAX_VISIBLE))
const hiddenCount = computed<number>(() => Math.max(groups.value.length - MAX_VISIBLE, 0))
const isAllGroupsOpen = ref(false)

const selectedExerciseIds = computed<number[]>(() => {
  return (
    workout.value?.exercises.map(item => item.exercise?.id).filter((id): id is number => !!id) ?? []
  )
})

const updateWorkoutExercises = async (newExerciseIds: number[]) => {
  if (!workout.value) return

  isUpdatingWorkout.value = true
  try {
    await workoutStore.setWorkouts(true)

    const existingExerciseIds = selectedExerciseIds.value

    const exercisesToAdd = newExerciseIds.filter(id => !existingExerciseIds.includes(id))

    const exercisesToRemove = existingExerciseIds.filter(id => !newExerciseIds.includes(id))

    if (exercisesToRemove.length > 0) {
      await removeExercisesFromWorkout(+workout.value.id, exercisesToRemove)
    }

    if (exercisesToAdd.length > 0) {
      await addExercisesToWorkout(+workout.value!.id, exercisesToAdd)
    }

    const hasBeenUpdated = exercisesToAdd.length > 0 || exercisesToRemove.length > 0

    if (hasBeenUpdated) {
      toast.success(t('workout.updatedNoBang'), { progressBar: true, duration: 1000 })
      await workoutStore.setWorkouts(true)
    }
  } catch (error) {
    console.error('Error updating workout exercises:', error)
    toast.error(t('workout.failedToUpdate'), { progressBar: true, duration: 1000 })
  } finally {
    isUpdatingWorkout.value = false
  }
}

const dublicate = async () => {
  if (workout.value) {
    const response = await dublicateWorkout(workout.value.id)
    if (response && response.id) {
      await workoutStore.setWorkouts(true)
      workoutStore.setCurrentWorkout(response.id)
      toast.success(t('workout.duplicated'), { progressBar: true, duration: 1000 })
      router.push(`/workout/${response.id}`)
    } else {
      console.error('Failed to duplicate workout')
    }
  }
}

const deleteExercise = async () => {
  try {
    if (workout.value) {
      const response = await deleteWorkout(workout.value.id)
      if (response) {
        workoutStore.setWorkouts(true)
        workoutStore.currentWorkout = null
        isDeleteDialogOpen.value = false
        toast.success(t('workout.deleted'), { progressBar: true, duration: 1000 })
        router.push('/')
      } else {
        console.error('Failed to delete exercise')
      }
    }
  } catch (error) {
    console.error('Error deleting exercise:', error)
    toast.error(t('workout.failedToDelete'), { progressBar: true, duration: 1000 })
    isDeleteDialogOpen.value = false
  }
}

const selectExercise = (exercise: Exercise) => {
  selectedExercise.value = exercise
  isEditExerciseOpen.value = true
}

const onEditExerciseClose = async () => {
  isEditExerciseOpen.value = false
  // Refresh workout to get updated exercise details
  await workoutStore.setWorkouts(true)
}

const startSession = async () => {
  if (workout.value) {
    const response = await startWorkoutSession(workout.value.id)
    if (response && response.id) {
      await workoutSessionStore.fetchSelectedWorkoutSession(response.id)
      router.push(`/session/${response.id}`)
    } else {
      console.error('Failed to start session:', response)
      toast.error(t('workout.failedToStartSession'), { progressBar: true, duration: 1000 })
    }
  }
}

// Drag and drop handlers
const onDragStart = (index: number) => {
  draggedIndex.value = index
}

const onDragOver = (index: number) => {
  if (draggedIndex.value !== null && draggedIndex.value !== index) {
    dragOverIndex.value = index
  }
}

const onDrop = async (dropIndex: number) => {
  if (draggedIndex.value === null || draggedIndex.value === dropIndex || !workout.value) {
    return
  }

  const exercises = [...sortedExercises.value]
  const [draggedExercise] = exercises.splice(draggedIndex.value, 1)
  exercises.splice(dropIndex, 0, draggedExercise)

  // Update order values for all exercises
  const reorderedExercises = exercises.map((ex, idx) => ({
    workoutExerciseId: ex.id,
    order: idx + 1,
  }))

  try {
    await reorderExercises(workout.value.id, reorderedExercises)
    await workoutStore.setWorkouts(true)
    toast.success(t('workout.exercisesReordered'), { progressBar: true, duration: 1000 })
  } catch (error) {
    console.error('Error reordering exercises:', error)
    toast.error(t('workout.failedToReorder'), { progressBar: true, duration: 1000 })
  }
}

const onDragEnd = () => {
  draggedIndex.value = null
  dragOverIndex.value = null
}

// Workout quick stats
const workoutQuickStats = computed<WorkoutQuickStats | null>(
  () => statisticsStore.workoutQuickStats
)

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDuration(minutes: number): string {
  if (!minutes) return '0 min'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m} min`
}

watch(
  workout,
  w => {
    if (w?.id) {
      statisticsStore.fetchWorkoutQuickStats(w.id)
    }
  },
  { immediate: true }
)
</script>
