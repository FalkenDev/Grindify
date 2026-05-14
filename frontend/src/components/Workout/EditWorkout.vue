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
  <div class="d-flex flex-column fill-height bg-background content-scroll">
    <BackHeader
      :title="$t('workoutForm.editTitle')"
      :show-menu="false"
      :show-save="true"
      class="sticky-header"
      @close="emit('close')"
      @save="saveWorkout"
    />

    <v-form class="mx-5 mt-2 pb-10">
      <!-- Workout Title -->
      <div>
        <v-label class="text-body-2 font-weight-bold text-textPrimary mb-1">
          {{ $t('workoutForm.nameLabel') }}<span class="text-error text-h6 ml-1">*</span>
        </v-label>
        <v-text-field
          v-model="form.title"
          variant="outlined"
          required
          density="compact"
          :rules="[v => !!v || $t('workoutForm.nameLabel')]"
        />
      </div>

      <!-- Description -->
      <div>
        <v-label class="text-body-2 font-weight-bold text-textPrimary mb-2">
          {{ $t('common.description') }}
        </v-label>
        <v-textarea
          v-model="form.description"
          variant="outlined"
          rows="3"
          auto-grow
          class="small-textarea"
        />
      </div>

      <!-- Type + Duration -->
      <div class="d-flex w-100 ga-5">
        <div class="w-100">
          <v-label class="text-body-2 font-weight-bold text-textPrimary mb-1">
            {{ $t('editWorkout.trainingType') }}
          </v-label>
          <v-select
            v-model="form.type"
            variant="outlined"
            density="compact"
            :items="workoutTypeItems"
            item-title="label"
            item-value="value"
            clearable
          />
        </div>
        <div class="w-100">
          <v-label class="text-body-2 font-weight-bold text-textPrimary mb-1 ga-1">
            <v-icon color="primary">mdi-timer-outline</v-icon>
            {{ $t('workout.duration') }}<span class="text-error text-h6 ml-1">*</span>
          </v-label>
          <v-text-field
            v-model.number="form.time"
            variant="outlined"
            required
            density="compact"
            type="number"
            :suffix="$t('units.minShort')"
          />
        </div>
      </div>

      <!-- Target Muscles -->
      <div>
        <v-label class="text-body-2 font-weight-bold text-textPrimary mb-1">
          {{ $t('exerciseDetails.targetMuscles') }}
        </v-label>
        <div class="d-flex flex-wrap ga-2">
          <v-chip
            v-for="mg in availableMuscleGroups"
            :key="mg.id"
            :color="selectedTargetMuscleIds.has(mg.id) ? 'primary' : undefined"
            :variant="selectedTargetMuscleIds.has(mg.id) ? 'flat' : 'outlined'"
            class="cursor-pointer"
            @click="toggleTargetMuscle(mg.id)"
          >
            {{ $t(`muscleGroups.${mg.name}`) }}
          </v-chip>
          <p v-if="availableMuscleGroups.length === 0" class="text-body-2 text-textSecondary">
            {{ $t('editWorkout.addExercisesToSeeMuscles') }}
          </p>
        </div>
      </div>

      <!-- Exercises -->
      <div class="mt-5">
        <div class="d-flex justify-space-between align-center">
          <v-label class="text-h6 font-weight-bold text-textPrimary mb-1">
            {{ $t('workout.exercises') }}
          </v-label>
          <v-btn
            color="primary"
            density="compact"
            variant="outlined"
            class="mb-2"
            @click="isAddExerciseOpen = true"
          >
            {{ $t('session.addExercise') }}
          </v-btn>
        </div>

        <draggable
          v-model="form.exercises"
          item-key="exerciseId"
          handle=".drag-handle"
          :animation="200"
          class="d-flex ga-5 flex-column"
          @end="onDragEnd"
        >
          <template #item="{ element: exercise, index }">
            <v-card
              class="d-flex bg-cardBg pa-3 rounded-lg ga-3"
              style="border: 1px solid rgb(var(--v-theme-borderColor)); box-shadow: none"
            >
              <div class="drag-handle d-flex align-center" style="cursor: grab">
                <v-icon size="32" color="textSecondary">mdi-drag</v-icon>
              </div>
              <div class="d-flex flex-column ga-2 w-100">
                <div class="d-flex w-100 ga-5 align-center">
                  <v-avatar color="avatarBg" size="30">
                    <span class="text-primary text-body-2">{{ index + 1 }}</span>
                  </v-avatar>
                  <v-text-field
                    :model-value="getExerciseName(exercise.exerciseId)"
                    variant="outlined"
                    density="compact"
                    class="w-100"
                    disabled
                    hide-details
                  />
                  <v-avatar
                    color="red-darken-4"
                    size="30"
                    tile
                    class="rounded-lg cursor-pointer"
                    @click="removeExercise(index)"
                  >
                    <v-icon color="red-lighten-1" size="18">mdi-close</v-icon>
                  </v-avatar>
                </div>
                <div class="d-flex w-100 ga-5">
                  <div class="w-100">
                    <v-label class="text-body-2 font-weight-bold text-textSecondary mb-1">
                      {{ $t('exerciseForm.setsLabel') }}
                    </v-label>
                    <v-text-field
                      v-model.number="exercise.sets"
                      variant="outlined"
                      density="compact"
                      hide-details
                      type="number"
                      @update:model-value="resizeSetWeights(exercise)"
                    />
                  </div>
                  <div class="w-100">
                    <v-label class="text-body-2 font-weight-bold text-textSecondary mb-1">
                      {{ $t('exerciseForm.repsLabel') }}
                    </v-label>
                    <v-text-field
                      v-model.number="exercise.reps"
                      variant="outlined"
                      density="compact"
                      hide-details
                      type="number"
                    />
                  </div>
                  <div class="w-100">
                    <v-label class="text-body-2 font-weight-bold text-textSecondary mb-1">
                      {{ $t('editWorkout.restSeconds') }}
                    </v-label>
                    <v-text-field
                      v-model.number="exercise.pauseSeconds"
                      variant="outlined"
                      density="compact"
                      hide-details
                      type="number"
                    />
                  </div>
                </div>
                <div class="w-100">
                  <v-label class="text-body-2 font-weight-bold text-textSecondary mb-1">
                    {{ $t('workoutList.weightKg') }}
                  </v-label>
                  <div
                    v-for="(w, i) in exercise.setWeights"
                    :key="i"
                    class="d-flex align-center ga-2 mb-1"
                  >
                    <span class="text-body-2 text-textSecondary" style="min-width: 44px">
                      {{ $t('table.set') }} {{ Number(i) + 1 }}
                    </span>
                    <v-text-field
                      v-model.number="exercise.setWeights[Number(i)]"
                      type="text"
                      inputmode="decimal"
                      variant="outlined"
                      hide-details
                      density="compact"
                      suffix="kg"
                    />
                    <v-btn
                      v-if="Number(i) < exercise.setWeights.length - 1"
                      icon
                      size="x-small"
                      variant="text"
                      title="Fill down"
                      @click="fillDownWeight(exercise, Number(i))"
                    >
                      <v-icon size="18">mdi-arrow-down-bold</v-icon>
                    </v-btn>
                    <div v-else style="width: 28px" />
                  </div>
                </div>
              </div>
            </v-card>
          </template>
        </draggable>

        <div v-if="form.exercises.length === 0" class="text-center py-6">
          <p class="text-body-2 text-textSecondary">{{ $t('workout.noExercisesYet') }}</p>
        </div>
      </div>

      <v-btn color="error" variant="outlined" class="w-100 mt-5" @click="isDeleteDialogOpen = true">
        {{ $t('workout.deleteWorkoutTitle') }}
      </v-btn>
    </v-form>

    <!-- Add Exercise Dialog -->
    <v-dialog v-model="isAddExerciseOpen" fullscreen>
      <AddExerciseList
        v-if="isAddExerciseOpen"
        :initial-selected-ids="form.exercises.map(e => e.exerciseId)"
        @close="isAddExerciseOpen = false"
        @save="onExerciseListSave"
      />
    </v-dialog>

    <!-- Delete Workout Confirm -->
    <AcceptDialog
      v-model="isDeleteDialogOpen"
      :title="$t('workout.deleteWorkoutTitle')"
      :description="$t('workout.deleteWorkoutConfirm')"
      @accept="confirmDelete"
      @cancel="isDeleteDialogOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import type {
  Workout,
  Exercise as WorkoutExercise,
  WorkoutType,
  UpdateWorkoutExercise,
} from '@/interfaces/Workout.interface'
import type { Exercise as ExerciseCatalog } from '@/interfaces/Exercise.interface'
import type { MuscleGroup } from '@/interfaces/MuscleGroup.interface'
import {
  updateWorkout,
  addExercisesToWorkout,
  removeExercisesFromWorkout,
  updateExerciseInWorkout,
  reorderExercises,
  deleteWorkout,
} from '@/services/workout.service'
import { useWorkoutStore } from '@/stores/workout.store'
import { useMuscleGroupStore } from '@/stores/muscleGroup.store'
import { useExerciseStore } from '@/stores/exercise.store'
import AddExerciseList from '@/components/Exercise/AddExerciseList.vue'
import AcceptDialog from '@/components/basicUI/AcceptDialog.vue'
import { toast } from 'vuetify-sonner'
import { useI18n } from 'vue-i18n'
import { displayExerciseName } from '@/utils/exerciseDisplay'
import { useUserLanguage } from '@/composables/useUserLanguage'
import router from '@/router'
import { parseDecimalInput } from '@/utils/decimalInput'

const { t } = useI18n({ useScope: 'global' })
const { lang } = useUserLanguage()

const props = defineProps<{
  workout: Workout | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save'): void
}>()

const workoutStore = useWorkoutStore()
const muscleGroupStore = useMuscleGroupStore()
const exerciseStore = useExerciseStore()

const isAddExerciseOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isSaving = ref(false)

// -- Form state --
interface ExerciseForm {
  exerciseId: number
  workoutExerciseId: number | null
  sets: number
  reps: number
  weight: number
  setWeights: number[]
  pauseSeconds: number
  order: number
}

const form = reactive({
  title: props.workout?.title ?? '',
  description: props.workout?.description ?? '',
  type: (props.workout?.type ?? null) as WorkoutType | null,
  time: props.workout?.time ?? 0,
  exercises: [] as ExerciseForm[],
})

const selectedTargetMuscleIds = ref(new Set<number>())

// Initialize form from workout
const initForm = () => {
  if (!props.workout) return
  form.title = props.workout.title
  form.description = props.workout.description ?? ''
  form.type = props.workout.type ?? null
  form.time = props.workout.time

  const sorted = [...(props.workout.exercises || [])].sort((a, b) => a.order - b.order)
  form.exercises = sorted.map((ex, idx) => ({
    exerciseId: ex.exercise.id,
    workoutExerciseId: ex.id,
    sets: ex.sets,
    reps: ex.reps,
    weight: parseDecimalInput(ex.weight),
    setWeights: ex.setWeights?.length
      ? ex.setWeights.map(weight => parseDecimalInput(weight))
      : Array.from({ length: ex.sets }, () => parseDecimalInput(ex.weight)),
    pauseSeconds: ex.pauseSeconds,
    order: idx + 1,
  }))

  // Load target muscle group IDs
  const targetIds = (props.workout.targetMuscleGroups || []).map(mg => mg.id)
  selectedTargetMuscleIds.value = new Set(targetIds)
}

initForm()

// Watch for workout changes (when store refreshes) — skip during save
watch(
  () => props.workout,
  () => {
    if (!isSaving.value) {
      initForm()
    }
  },
  { deep: true }
)

// -- Workout type items --
const workoutTypeItems = computed(() => [
  { label: t('editWorkout.types.strength'), value: 'strength' },
  { label: t('editWorkout.types.cardio'), value: 'cardio' },
  { label: t('editWorkout.types.hiit'), value: 'hiit' },
  { label: t('editWorkout.types.flexibility'), value: 'flexibility' },
  { label: t('editWorkout.types.endurance'), value: 'endurance' },
])

// -- Get all muscle groups from exercises in this workout --
const availableMuscleGroups = computed(() => {
  const mgMap = new Map<number, { id: number; name: string }>()

  // Collect muscle groups from all exercises in the workout
  for (const exForm of form.exercises) {
    const exerciseData = findExerciseData(exForm.exerciseId)
    if (exerciseData) {
      for (const mg of exerciseData.muscleGroups || []) {
        mgMap.set(mg.id, { id: mg.id, name: mg.name })
      }
    }
  }

  // Also include any currently-selected targets that may not be in exercises anymore
  for (const id of selectedTargetMuscleIds.value) {
    if (!mgMap.has(id)) {
      const mg = (muscleGroupStore.muscleGroups as MuscleGroup[]).find(g => g.id === id)
      if (mg) mgMap.set(id, { id: mg.id, name: mg.name })
    }
  }

  return Array.from(mgMap.values()).sort((a, b) => a.name.localeCompare(b.name))
})

const toggleTargetMuscle = (id: number) => {
  const set = new Set(selectedTargetMuscleIds.value)
  if (set.has(id)) {
    set.delete(id)
  } else {
    set.add(id)
  }
  selectedTargetMuscleIds.value = set
}

// -- Helpers to look up exercise data --
const findExerciseData = (exerciseId: number) => {
  // First look in current workout exercises
  if (props.workout?.exercises) {
    const found = props.workout.exercises.find(ex => ex.exercise.id === exerciseId)
    if (found) return found.exercise
  }
  // Then look in exercise store
  const exercises = exerciseStore.exercises as ExerciseCatalog[]
  return exercises?.find(ex => ex.id === exerciseId) ?? null
}

const getExerciseName = (exerciseId: number) => {
  const data = findExerciseData(exerciseId)
  if (!data) return t('exercise.exerciseFallback', { id: exerciseId })
  return displayExerciseName(data, lang.value)
}

// -- Exercise management --
const removeExercise = (index: number) => {
  form.exercises.splice(index, 1)
  // Re-order remaining
  form.exercises.forEach((ex, i) => {
    ex.order = i + 1
  })
}

const onExerciseListSave = (newExerciseIds: number[]) => {
  const currentIds = form.exercises.map(e => e.exerciseId)

  // Remove exercises no longer selected
  form.exercises = form.exercises.filter(e => newExerciseIds.includes(e.exerciseId))

  // Add new exercises
  const toAdd = newExerciseIds.filter(id => !currentIds.includes(id))
  for (const id of toAdd) {
    form.exercises.push({
      exerciseId: id,
      workoutExerciseId: null,
      sets: 3,
      reps: 10,
      weight: 0,
      setWeights: [0, 0, 0],
      pauseSeconds: 60,
      order: form.exercises.length + 1,
    })
  }

  // Re-order
  form.exercises.forEach((ex, i) => {
    ex.order = i + 1
  })

  isAddExerciseOpen.value = false
}

const onDragEnd = () => {
  form.exercises.forEach((ex, i) => {
    ex.order = i + 1
  })
}

function resizeSetWeights(exercise: ExerciseForm) {
  const n = Math.max(1, exercise.sets || 1)
  const current = exercise.setWeights
  if (current.length < n) {
    const last = current[current.length - 1] ?? 0
    exercise.setWeights = [...current, ...Array.from({ length: n - current.length }, () => last)]
  } else if (current.length > n) {
    exercise.setWeights = current.slice(0, n)
  }
}

function fillDownWeight(exercise: ExerciseForm, fromIndex: number) {
  const val = exercise.setWeights[fromIndex]
  for (let i = fromIndex + 1; i < exercise.setWeights.length; i++) {
    exercise.setWeights[i] = val
  }
}

// -- Save --
const saveWorkout = async () => {
  if (!props.workout || isSaving.value) return
  isSaving.value = true

  try {
    const workoutId = props.workout.id

    // 1. Update workout metadata
    await updateWorkout(workoutId, {
      title: form.title,
      description: form.description || undefined,
      type: form.type ?? undefined,
      time: form.time,
      targetMuscleGroupIds: Array.from(selectedTargetMuscleIds.value),
    })

    // 2. Diff exercises: add/remove/update
    const originalIds = props.workout.exercises.map(ex => ex.exercise.id)
    const newIds = form.exercises.map(e => e.exerciseId)

    const toRemove = originalIds.filter(id => !newIds.includes(id))
    const toAdd = newIds.filter(id => !originalIds.includes(id))

    if (toRemove.length > 0) {
      await removeExercisesFromWorkout(workoutId, toRemove)
    }

    if (toAdd.length > 0) {
      await addExercisesToWorkout(workoutId, toAdd)
    }

    // 3. Refresh store to get new workout exercise IDs from backend
    await workoutStore.setWorkouts(true)
    const refreshedWorkout = workoutStore.workouts.find((w: Workout) => w.id === workoutId)

    // 4. Update each exercise's sets/reps/rest + reorder
    if (refreshedWorkout) {
      for (const exForm of form.exercises) {
        const matchingWe = refreshedWorkout.exercises.find(
          (we: WorkoutExercise) => we.exercise.id === exForm.exerciseId
        )
        if (matchingWe) {
          const changes: Record<string, unknown> = {}
          if (matchingWe.sets !== exForm.sets) changes.sets = exForm.sets
          if (matchingWe.reps !== exForm.reps) changes.reps = exForm.reps
          if (matchingWe.pauseSeconds !== exForm.pauseSeconds)
            changes.pauseSeconds = exForm.pauseSeconds
          const normalizedSetWeights = exForm.setWeights.map(weight => parseDecimalInput(weight))
          // Always send setWeights; keep weight in sync with first set
          changes.setWeights = normalizedSetWeights
          changes.weight = normalizedSetWeights[0] ?? 0

          if (Object.keys(changes).length > 0) {
            await updateExerciseInWorkout(
              workoutId,
              matchingWe.id,
              changes as UpdateWorkoutExercise
            )
          }
        }
      }

      // 5. Reorder
      const reorderPayload = form.exercises
        .map(exForm => {
          const matchingWe = refreshedWorkout.exercises.find(
            (we: WorkoutExercise) => we.exercise.id === exForm.exerciseId
          )
          if (!matchingWe) return null
          return { workoutExerciseId: matchingWe.id, order: exForm.order }
        })
        .filter(Boolean) as Array<{ workoutExerciseId: number; order: number }>

      if (reorderPayload.length > 0) {
        await reorderExercises(workoutId, reorderPayload)
      }
    }

    await workoutStore.setWorkouts(true)
    toast.success(t('workout.updated'), { progressBar: true, duration: 1000 })
    emit('save')
    emit('close')
  } catch (error) {
    console.error('Error saving workout:', error)
    toast.error(t('workout.failedToUpdate'), { progressBar: true, duration: 1000 })
  } finally {
    isSaving.value = false
  }
}

// -- Delete --
const confirmDelete = async () => {
  if (!props.workout) return
  try {
    const response = await deleteWorkout(props.workout.id)
    if (response) {
      await workoutStore.setWorkouts(true)
      workoutStore.currentWorkout = null
      isDeleteDialogOpen.value = false
      toast.success(t('workout.deleted'), { progressBar: true, duration: 1000 })
      emit('close')
      router.push('/')
    }
  } catch (error) {
    console.error('Error deleting workout:', error)
    toast.error(t('workout.failedToDelete'), { progressBar: true, duration: 1000 })
    isDeleteDialogOpen.value = false
  }
}
</script>

<style scoped>
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: rgb(var(--v-theme-background));
}

.content-scroll {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.small-textarea :deep(textarea) {
  font-size: 0.9rem;
}

.cursor-pointer {
  cursor: pointer;
}

:deep(.v-field) {
  background-color: rgb(var(--v-theme-cardBg)) !important;
  border-radius: 12px !important;
}

:deep(.v-field__outline__start) {
  border-radius: 12px 0 0 12px !important;
}

:deep(.v-field__outline__end) {
  border-radius: 0 12px 12px 0 !important;
}
</style>
