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
      :title="$t('workoutForm.createTitle')"
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
      <div class="d-flex w-100 ga-5 align-end">
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
              </div>
            </v-card>
          </template>
        </draggable>

        <div v-if="form.exercises.length === 0" class="text-center py-6">
          <p class="text-body-2 text-textSecondary">{{ $t('workout.noExercisesYet') }}</p>
        </div>
      </div>
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
  </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import type {
  WorkoutType,
  Workout,
  Exercise as WorkoutExercise,
  UpdateWorkoutExercise,
} from '@/interfaces/Workout.interface'
import type { Exercise as ExerciseCatalog } from '@/interfaces/Exercise.interface'
import type { MuscleGroup } from '@/interfaces/MuscleGroup.interface'
import {
  createWorkout,
  addExercisesToWorkout,
  updateExerciseInWorkout,
  reorderExercises,
} from '@/services/workout.service'
import { useWorkoutStore } from '@/stores/workout.store'
import { useMuscleGroupStore } from '@/stores/muscleGroup.store'
import { useExerciseStore } from '@/stores/exercise.store'
import AddExerciseList from '@/components/Exercise/AddExerciseList.vue'
import { toast } from 'vuetify-sonner'
import { useI18n } from 'vue-i18n'
import { displayExerciseName } from '@/utils/exerciseDisplay'
import { useUserLanguage } from '@/composables/useUserLanguage'
import { useRouter } from 'vue-router'
import type { WorkoutInitialData } from '@/utils/sessionToWorkout'

const { t } = useI18n({ useScope: 'global' })
const { lang } = useUserLanguage()
const router = useRouter()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const props = withDefaults(defineProps<{ initialData?: WorkoutInitialData }>(), {
  initialData: undefined,
})

const workoutStore = useWorkoutStore()
const muscleGroupStore = useMuscleGroupStore()
const exerciseStore = useExerciseStore()

const isAddExerciseOpen = ref(false)
const isSaving = ref(false)

// -- Form state --
interface ExerciseForm {
  exerciseId: number
  sets: number
  reps: number
  weight: number
  pauseSeconds: number
  order: number
}

const form = reactive({
  title: '',
  description: '',
  type: null as WorkoutType | null,
  time: 0,
  exercises: [] as ExerciseForm[],
})

const selectedTargetMuscleIds = ref(new Set<number>())

onMounted(() => {
  if (props.initialData) {
    if (props.initialData.time != null) form.time = props.initialData.time
    if (props.initialData.exercises.length) {
      // Shallow copy is sufficient; WorkoutExerciseInitialData contains only primitives.
      form.exercises = props.initialData.exercises.map(ex => ({ ...ex }))
    }
  }
})

// -- Workout type items --
const workoutTypeItems = computed(() => [
  { label: t('editWorkout.types.strength'), value: 'strength' },
  { label: t('editWorkout.types.cardio'), value: 'cardio' },
  { label: t('editWorkout.types.hiit'), value: 'hiit' },
  { label: t('editWorkout.types.flexibility'), value: 'flexibility' },
  { label: t('editWorkout.types.endurance'), value: 'endurance' },
])

// -- Get all muscle groups from exercises --
const availableMuscleGroups = computed(() => {
  const mgMap = new Map<number, { id: number; name: string }>()

  for (const exForm of form.exercises) {
    const exerciseData = findExerciseData(exForm.exerciseId)
    if (exerciseData) {
      for (const mg of exerciseData.muscleGroups || []) {
        mgMap.set(mg.id, { id: mg.id, name: mg.name })
      }
    }
  }

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

// -- Helpers --
const findExerciseData = (exerciseId: number) => {
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
  form.exercises.forEach((ex, i) => {
    ex.order = i + 1
  })
}

const onExerciseListSave = (newExerciseIds: number[]) => {
  const currentIds = form.exercises.map(e => e.exerciseId)

  form.exercises = form.exercises.filter(e => newExerciseIds.includes(e.exerciseId))

  const toAdd = newExerciseIds.filter(id => !currentIds.includes(id))
  for (const id of toAdd) {
    form.exercises.push({
      exerciseId: id,
      sets: 3,
      reps: 10,
      weight: 0,
      pauseSeconds: 60,
      order: form.exercises.length + 1,
    })
  }

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

// -- Save (Create) --
const saveWorkout = async () => {
  if (!form.title || isSaving.value) return
  isSaving.value = true

  try {
    // 1. Create the workout
    const created = await createWorkout({
      title: form.title,
      description: form.description || undefined,
      type: form.type ?? undefined,
      time: form.time,
      targetMuscleGroupIds: Array.from(selectedTargetMuscleIds.value),
    })

    if (!created) throw new Error('Failed to create workout')

    const workoutId = created.id

    // 2. Add exercises if any
    if (form.exercises.length > 0) {
      const exerciseIds = form.exercises.map(e => e.exerciseId)
      await addExercisesToWorkout(workoutId, exerciseIds)

      // 3. Refresh to get exercise IDs from backend
      await workoutStore.setWorkouts(true)
      const refreshedWorkout = workoutStore.workouts.find((w: Workout) => w.id === workoutId)

      if (refreshedWorkout) {
        // 4. Update each exercise's sets/reps/rest
        for (const exForm of form.exercises) {
          const matchingWe = refreshedWorkout.exercises.find(
            (we: WorkoutExercise) => we.exercise.id === exForm.exerciseId
          )
          if (matchingWe) {
            const changes: Record<string, number> = {}
            if (matchingWe.sets !== exForm.sets) changes.sets = exForm.sets
            if (matchingWe.reps !== exForm.reps) changes.reps = exForm.reps
            if (matchingWe.pauseSeconds !== exForm.pauseSeconds)
              changes.pauseSeconds = exForm.pauseSeconds
            if (matchingWe.weight !== exForm.weight) changes.weight = exForm.weight

            if (Object.keys(changes).length > 0) {
              await updateExerciseInWorkout(workoutId, matchingWe.id, changes as UpdateWorkoutExercise)
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
    }

    await workoutStore.setWorkouts(true)
    await workoutStore.setCurrentWorkout(workoutId)
    toast.success(t('workout.created'), { progressBar: true, duration: 1000 })
    router.push(`/workout/${workoutId}`)
    emit('close')
  } catch (error) {
    console.error('Error creating workout:', error)
    toast.error(t('workout.failedToCreate'), { progressBar: true, duration: 1000 })
  } finally {
    isSaving.value = false
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
