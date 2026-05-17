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
    <BackHeader :show-menu="true" :title="$t('session.workoutSessionTitle')" :route-to="'/'">
      <template #menuAppend>
        <v-list>
          <v-list-item @click="isAddExerciseOpen = true">
            <v-list-item-title>{{ $t('session.addExercise') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </template>
    </BackHeader>

    <div class="mb-3 d-flex justify-space-between align-center bg-grey-darken-4 pa-5">
      <p class="text-h6">
        {{ clock }}
      </p>
      <v-btn color="primary" :loading="isLoading" @click="finnishSession">
        {{ $t('session.finish') }}
      </v-btn>
    </div>

    <div class="d-flex flex-column ga-5">
      <WorkoutExerciseCard
        v-for="exercise in processedExercises"
        :key="exercise.exerciseId"
        :exercise="exercise"
        :default-weight-and-reps="workoutSession?.workout?.defaultWeightAndReps"
        :workout-sets="liveSets(exercise.exerciseId)"
        :show-rpe="showRpe"
        :rpe="liveEx(exercise.exerciseId)?.rpe"
        :notes="liveEx(exercise.exerciseId)?.notes"
        @update:set="onUpdateSet(exercise.exerciseId, $event)"
        @delete:set="onDeleteSet(exercise.exerciseId, $event)"
        @delete:exercise="onDeleteExercise(exercise.exerciseId)"
        @add:set="onAddSet(exercise.exerciseId)"
        @update:rpe="showRpe && onUpdateMeta(exercise.exerciseId, { rpe: $event })"
        @update:notes="onUpdateMeta(exercise.exerciseId, { notes: $event })"
        @move-to-top="onMoveToTop(exercise.exerciseId)"
        @view-details="onViewExerciseDetails(exercise.exerciseId)"
      />
    </div>

    <div class="d-flex flex-column justify-space-between my-5 mx-5 ga-5">
      <v-btn color="secondary" @click="isAddExerciseOpen = true">
        {{ $t('session.addExercise') }}
      </v-btn>
      <v-btn color="primary" :loading="isLoading" @click="finnishSession">
        {{ $t('session.finishSession') }}
      </v-btn>
    </div>

    <v-dialog v-model="isAddExerciseOpen" fullscreen>
      <AddExerciseList
        v-if="isAddExerciseOpen"
        :initial-selected-ids="processedExercises.map(e => e.exerciseId)"
        @close="isAddExerciseOpen = false"
        @save="updateWorkoutSessionExercises"
      />
    </v-dialog>

    <v-dialog v-model="isViewExerciseDetailsOpen" fullscreen>
      <ExerciseDetails
        v-if="isViewExerciseDetailsOpen && viewExerciseDetails"
        :selected-exercise="viewExerciseDetails"
        :is-view-exercise="true"
        hide-menu
        @close="onCloseExerciseDetails"
      />
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
import router from '@/router'
import { useRoute } from 'vue-router'
import { toast } from 'vuetify-sonner'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'
import { useWorkoutSessionStore } from '@/stores/workoutSession.store'
import type { FinishedExercisePayload, WorkoutSession } from '@/interfaces/workoutSession.interface'
import type { Exercise, WorkoutSet } from '@/interfaces/Workout.interface'

import { fetchExerciseById } from '@/services/exercise.service'
import {
  abandonWorkoutSession,
  finishWorkoutSession,
  fetchPreviousSets,
} from '@/services/workoutSession.service'
import type { Exercise as ExerciseDetailType } from '@/interfaces/Exercise.interface'

const isAddExerciseOpen = ref(false)
const isViewExerciseDetailsOpen = ref(false)
const viewExerciseDetails = ref<ExerciseDetailType | null>(null)
const { t } = useI18n({ useScope: 'global' })
const route = useRoute()
const workoutSessionStore = useWorkoutSessionStore()
const authStore = useAuthStore()
const processedExercises = ref<Exercise[]>([])
const isLoading = ref(false)

const workoutSession = computed<WorkoutSession | null>(
  () => workoutSessionStore.selectedWorkoutSession as WorkoutSession | null
)
const clock = computed(() => workoutSessionStore.formattedClock)
const sessionId = computed(() => workoutSession.value?.id || 0)

const showRpe = computed(() => authStore.user?.showRpe ?? true)

function liveEx(exerciseId: number) {
  return workoutSessionStore.getLiveSession(sessionId.value)?.exercises[exerciseId]
}

function liveSets(exerciseId: number): WorkoutSet[] {
  const ex = workoutSessionStore.getLiveSession(sessionId.value)?.exercises[exerciseId]
  return ex
    ? ex.sets.map(s => ({
        set: s.set,
        weight: s.weight,
        reps: s.reps,
        done: s.done,
        previous: s.previous ?? t('common.na'),
      }))
    : []
}

async function updateWorkoutSessionExercises(newExerciseIds: number[]) {
  if (!workoutSession.value) return
  isLoading.value = true
  try {
    const existingIds = processedExercises.value.map(e => e.exerciseId)
    const toAdd = newExerciseIds.filter(id => !existingIds.includes(id))
    const toRemove = existingIds.filter(id => !newExerciseIds.includes(id))

    for (const id of toRemove) {
      workoutSessionStore.removeExercise(sessionId.value, id)
      const idx = processedExercises.value.findIndex(e => e.exerciseId === id)
      if (idx !== -1) processedExercises.value.splice(idx, 1)
    }

    if (toAdd.length) {
      // Use the live workout relation for default sets/reps/weight
      const workoutExById = new Map<
        number,
        {
          sets: number
          reps: number
          weight: number
          setWeights: number[] | null
          pauseSeconds?: number
        }
      >()
      for (const base of workoutSession.value.workout?.exercises || []) {
        const exId = base.exerciseId ?? base.exercise?.id
        if (exId != null) {
          workoutExById.set(exId, {
            sets: base.sets ?? 0,
            reps: base.reps ?? 0,
            weight: base.weight ?? 0,
            setWeights: base.setWeights ?? null,
            pauseSeconds: base.pauseSeconds ?? 0,
          })
        }
      }

      for (const id of toAdd) {
        const details = await fetchExerciseById(id)

        const snap = workoutExById.get(id)
        const plannedSets = (snap?.sets ?? 0) || 3
        const plannedReps = (snap?.reps ?? 0) || 11
        const plannedWeight = (snap?.weight ?? 0) || 0
        const setWeights = snap?.setWeights ?? null
        const pauseSeconds = snap?.pauseSeconds ?? 60

        workoutSessionStore.upsertExercise(sessionId.value, id)

        const live = workoutSessionStore.getLiveSession(sessionId.value)
        const exLive = live?.exercises[id]
        if (exLive && exLive.sets.length === 0) {
          for (let i = 1; i <= plannedSets; i++) {
            workoutSessionStore.addSet(sessionId.value, id)
            workoutSessionStore.updateSet(sessionId.value, id, {
              set: i,
              weight: setWeights?.[i - 1] ?? plannedWeight,
              reps: plannedReps,
              done: false,
              previous: 'N/A',
            })
          }
        }

        processedExercises.value.push({
          exerciseId: id,
          id,
          order: 0,
          sets: plannedSets,
          reps: plannedReps,
          weight: plannedWeight,
          pauseSeconds,
          exercise: {
            id: details.id,
            title: details.title,
            description: details.description,
            img: details.image ?? '',
            muscleGroups: details.muscleGroups ?? [],
            primaryMuscleGroups: details.primaryMuscleGroups,
            isGlobal: details.isGlobal,
            personalizedFromGlobalId: details.personalizedFromGlobalId,
            createdBy: details.createdBy ?? '',
            createdAt: details.createdAt ?? '',
            updatedAt: details.updatedAt ?? '',
          },
        } as Exercise)
      }

      const previousSets = await fetchPreviousSets(sessionId.value, toAdd)
      workoutSessionStore.applyPreviousSets(sessionId.value, previousSets)
      if (workoutSession.value.workout?.defaultWeightAndReps === 'latest') {
        workoutSessionStore.applyPreviousSetsAsWeightAndReps(sessionId.value, previousSets)
      }
    }
  } finally {
    isLoading.value = false
    isAddExerciseOpen.value = false
  }
}

function onDeleteExercise(exerciseId: number) {
  workoutSessionStore.removeExercise(sessionId.value, exerciseId)
  const idx = processedExercises.value.findIndex(e => e.exerciseId === exerciseId)
  if (idx !== -1) processedExercises.value.splice(idx, 1)
}

function onUpdateMeta(exerciseId: number, data: { rpe?: number; notes?: string }) {
  workoutSessionStore.updateExerciseMeta(sessionId.value, exerciseId, data)
}

function onUpdateSet(exerciseId: number, updatedSet: WorkoutSet) {
  workoutSessionStore.updateSet(sessionId.value, exerciseId, {
    set: updatedSet.set,
    weight: updatedSet.weight,
    reps: updatedSet.reps,
    done: !!updatedSet.done,
    previous: updatedSet.previous,
  })
}

function onDeleteSet(exerciseId: number, setToDelete: WorkoutSet) {
  workoutSessionStore.deleteSet(sessionId.value, exerciseId, setToDelete.set)
}

function onAddSet(exerciseId: number) {
  workoutSessionStore.addSet(sessionId.value, exerciseId)
}

// Move exercise to top (temporary reordering, doesn't save to workout)
const onMoveToTop = (exerciseId: number) => {
  const currentIndex = processedExercises.value.findIndex(e => e.exerciseId === exerciseId)
  if (currentIndex > 0) {
    const exercises = [...processedExercises.value]
    const [exercise] = exercises.splice(currentIndex, 1)
    exercises.unshift(exercise)
    processedExercises.value = exercises
  }
}

const onViewExerciseDetails = (exerciseId: number) => {
  const exercise = processedExercises.value.find(e => e.exerciseId === exerciseId)
  if (exercise) {
    const ex = exercise.exercise
    viewExerciseDetails.value = {
      id: ex.id,
      title: ex.title,
      description: ex.description,
      image: ex.img,
      muscleGroups: ex.muscleGroups,
      primaryMuscleGroups: ex.primaryMuscleGroups,
      isGlobal: ex.isGlobal,
      personalizedFromGlobalId: ex.personalizedFromGlobalId,
      createdBy: ex.createdBy,
      createdAt: ex.createdAt,
      updatedAt: ex.updatedAt,
      deletedAt: ex.deletedAt,
    } as ExerciseDetailType
    isViewExerciseDetailsOpen.value = true
  }
}

const onCloseExerciseDetails = () => {
  isViewExerciseDetailsOpen.value = false
  viewExerciseDetails.value = null
}

const finnishSession = async () => {
  if (isLoading.value) return
  if (!workoutSession.value?.id) {
    toast.error(t('session.activeNotFound'), { progressBar: true, duration: 1000 })
    return
  }

  isLoading.value = true

  const live = workoutSessionStore.getLiveSession(sessionId.value)
  const completedExercises: FinishedExercisePayload[] = []

  if (live) {
    for (const ex of Object.values(live.exercises)) {
      const performed = (ex.sets || [])
        .filter(s => s.done)
        .map(s => ({ setNumber: s.set, weight: s.weight, reps: s.reps }))
      if (performed.length > 0) {
        completedExercises.push({
          exerciseId: ex.exerciseId,
          sets: performed,
          rpe: ex.rpe,
          notes: ex.notes,
        })
      }
    }
  }

  try {
    if (completedExercises.length === 0) {
      await abandonWorkoutSession(sessionId.value)
      toast.info(t('session.noExercisesCompleted'), { progressBar: true, duration: 1000 })
      workoutSessionStore.stopClock()
      workoutSessionStore.selectedWorkoutSession = null
      workoutSessionStore.resetClock()
      workoutSessionStore.clearLiveSession(sessionId.value)
      await workoutSessionStore.setWorkoutSessions(true)
      router.push((route.query.returnTo as string) || '/')
    } else {
      const finalPayload = { completedExercises, notes: '' }
      const durationSeconds = workoutSessionStore.secondsElapsed
      const result = await finishWorkoutSession(sessionId.value, finalPayload)

      // Store summary for the post-workout summary page (ephemeral, not persisted)
      workoutSessionStore.lastCompletedSummary = {
        session: result,
        durationSeconds,
      }

      workoutSessionStore.stopClock()
      workoutSessionStore.selectedWorkoutSession = null
      workoutSessionStore.resetClock()
      workoutSessionStore.clearLiveSession(sessionId.value)
      await workoutSessionStore.setWorkoutSessions(true)
      router.push('/session-summary')
    }
  } catch {
    toast.error(t('session.finishError'), { progressBar: true, duration: 1000 })
  } finally {
    isLoading.value = false
  }
}

watchEffect(async () => {
  const s = workoutSession.value
  if (!s) {
    processedExercises.value = []
    return
  }

  const isFirstInit = workoutSessionStore.initLiveSessionFromSnapshot(s)

  // Only apply previous-set data on first init — never on resume
  if (isFirstInit) {
    fetchPreviousSets(s.id).then(data => {
      workoutSessionStore.applyPreviousSets(s.id, data)
      if (s.workout?.defaultWeightAndReps === 'latest') {
        workoutSessionStore.applyPreviousSetsAsWeightAndReps(s.id, data)
      }
    })
  }

  const live = workoutSessionStore.getLiveSession(s.id)
  const idsFromLive = live ? Object.keys(live.exercises).map(Number) : []

  let exerciseIds: number[]
  if (idsFromLive.length) {
    // Sort live exercise IDs by workout exercise order
    const workoutExercises = [...(s.workout?.exercises || [])].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    )
    const orderedIds = workoutExercises
      .map(b => b.exerciseId ?? b.exercise?.id)
      .filter((id): id is number => typeof id === 'number')

    // Ordered IDs from workout first, then any extras added during session
    const orderedSet = new Set(orderedIds)
    const extras = idsFromLive.filter(id => !orderedSet.has(id))
    exerciseIds = [...orderedIds.filter(id => idsFromLive.includes(id)), ...extras]
  } else {
    // Use the live workout relation to get exercise IDs (sorted by order)
    exerciseIds = [...(s.workout?.exercises || [])]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map(b => b.exerciseId ?? b.exercise?.id)
      .filter((id): id is number => typeof id === 'number')
  }

  const detailsList = await Promise.all(
    exerciseIds.map(async id => {
      const d = await fetchExerciseById(id)
      return { id, d }
    })
  )

  processedExercises.value = detailsList.map(({ id, d }) => {
    const baseWorkoutEx = s.workout?.exercises?.find(b => (b.exerciseId ?? b.exercise?.id) === id)
    const liveEx = live?.exercises[id]

    const plannedSets = liveEx?.sets?.length || baseWorkoutEx?.sets || 1

    const plannedReps = (liveEx?.sets?.[0]?.reps ?? undefined) || baseWorkoutEx?.reps || 8

    const plannedWeight = (liveEx?.sets?.[0]?.weight ?? undefined) || baseWorkoutEx?.weight || 0

    const pauseSeconds = baseWorkoutEx?.pauseSeconds ?? 60

    return {
      exerciseId: id,
      id,
      order: 0,
      sets: plannedSets,
      reps: plannedReps,
      weight: plannedWeight,
      setWeights: baseWorkoutEx?.setWeights ?? null,
      pauseSeconds,
      exercise: {
        id: d.id,
        name: d.name,
        description: d.description,
        img: d.image ?? '',
        muscleGroups: d.muscleGroups ?? [],
        createdBy: d.createdBy ?? '',
        createdAt: d.createdAt ?? '',
        updatedAt: d.updatedAt ?? '',
      },
    } as Exercise
  })
})

watchEffect(() => {
  const s = workoutSession.value
  if (!s) return

  const raw = (s as WorkoutSession).startedAt as string | undefined
  if (raw) {
    const isoGuess = raw.includes('T') ? raw : raw.replace(' ', 'T') + 'Z'
    const ms = Date.parse(isoGuess)
    if (!Number.isNaN(ms)) {
      workoutSessionStore.startedAt = ms
    }
  }
  if (workoutSessionStore.startedAt != null) {
    workoutSessionStore.startClock()
  }
})

onMounted(() => {
  if (!workoutSessionStore.isRunning && workoutSessionStore.startedAt == null) {
    workoutSessionStore.startClock()
  }
})
</script>
