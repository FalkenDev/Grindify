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
  <div class="h-100 w-100 bg-grey-darken-4">
    <BackHeader
      :show-menu="true"
      :title="
        isViewExercise ? $t('exerciseForm.viewTitle') : $t('workoutExerciseForm.editInWorkoutTitle')
      "
      @close="emit('close')"
    >
      <template #menuAppend>
        <v-list>
          <v-list-item @click="removeExercise">
            <v-list-item-title>{{ $t('common.delete') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </template>
    </BackHeader>

    <div v-if="selectedExercise">
      <v-card height="200" class="bg-white" />
      <div class="mx-5">
        <div class="py-4">
          <h1 class="text-h5 font-weight-bold">
            {{ displayName }}
          </h1>
          <p>
            {{ displayDescription }}
          </p>
          <div class="d-flex ga-2 align-center mt-2 flex-wrap">
            <v-chip
              v-for="group in props.selectedExercise?.exercise?.muscleGroups || []"
              :key="group.id"
              color="green-lighten-1"
              label
            >
              {{ $t(group.name) }}
            </v-chip>
          </div>
        </div>
        <v-divider />
        <div v-if="isViewExercise">
          <v-list lines="one">
            <v-list-item>
              <template #prepend>
                <v-icon color="primary"> mdi-numeric </v-icon>
              </template>
              <v-list-item-title>
                <span class="font-weight-medium">{{ $t('exerciseForm.setsLabel') }}:</span>
                <span class="ml-2">
                  {{ selectedExercise.sets }}
                </span>
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon color="primary"> mdi-repeat </v-icon>
              </template>
              <v-list-item-title>
                <span class="font-weight-medium">{{ $t('exerciseForm.repsLabel') }}:</span>
                <span class="ml-2">
                  {{ selectedExercise.reps }}
                </span>
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon color="primary"> mdi-timer-outline </v-icon>
              </template>
              <v-list-item-title>
                <span class="font-weight-medium">{{ $t('exerciseForm.pauseSecondsLabel') }}:</span>
                <span class="ml-2">
                  {{ selectedExercise.pauseSeconds }}
                  {{ $t('units.sec') }}
                </span>
              </v-list-item-title>
            </v-list-item>
            <v-divider class="my-2" />
            <v-list-item>
              <template #prepend>
                <v-icon color="grey"> mdi-calendar-plus </v-icon>
              </template>
              <v-list-item-title>
                <span class="font-weight-medium">{{ $t('common.createdAt') }}:</span>
                <span class="ml-2">
                  {{ new Date(selectedExercise.exercise.createdAt).toLocaleDateString() }}
                </span>
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon color="grey"> mdi-calendar-edit </v-icon>
              </template>
              <v-list-item-title>
                <span class="font-weight-medium">{{ $t('common.updatedAt') }}:</span>
                <span class="ml-2">
                  {{ new Date(selectedExercise.exercise.updatedAt).toLocaleDateString() }}
                </span>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </div>
        <div v-else>
          <v-btn class="w-100 my-4" color="primary" :loading="isLoading" @click="updateExercise">
            {{ $t('common.saveChanges') }}
          </v-btn>
          <v-form v-if="editExercise" class="pt-2 d-flex ga-5 flex-column">
            <v-text-field
              v-model="editExercise.sets"
              :label="$t('exerciseForm.setsLabel')"
              type="text"
              inputmode="numeric"
              variant="outlined"
              hide-details
              density="compact"
            />
            <v-text-field
              v-model="editExercise.reps"
              :label="$t('exerciseForm.repsLabel')"
              type="text"
              inputmode="numeric"
              variant="outlined"
              hide-details
              density="compact"
            />
            <div v-if="isViewWorkoutExercise && editExercise?.setWeights">
              <p class="text-body-2 font-weight-bold text-textSecondary mb-2">
                {{ $t('workoutList.weightKg') }}
              </p>
              <div
                v-for="(_, i) in editExercise.setWeights"
                :key="i"
                class="d-flex align-center ga-2 mb-2"
              >
                <span class="text-body-2 text-textSecondary" style="min-width: 48px">
                  {{ $t('table.set') }} {{ Number(i) + 1 }}
                </span>
                <v-text-field
                  v-model.number="editExercise.setWeights[Number(i)]"
                  type="text"
                  inputmode="decimal"
                  variant="outlined"
                  hide-details
                  density="compact"
                  suffix="kg"
                />
                <v-btn
                  v-if="Number(i) < editExercise.setWeights.length - 1"
                  icon
                  size="x-small"
                  variant="text"
                  title="Fill down"
                  @click="fillDown(Number(i))"
                >
                  <v-icon size="18">mdi-arrow-down-bold</v-icon>
                </v-btn>
                <div v-else style="width: 28px" />
              </div>
            </div>
            <v-text-field
              v-model="editExercise.pauseSeconds"
              :label="$t('workoutList.pauseSeconds')"
              type="text"
              inputmode="numeric"
              variant="outlined"
              hide-details
              density="compact"
            />
          </v-form>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { Exercise as workoutExercise } from '@/interfaces/Workout.interface'
import type { AddExerciseToWorkout } from '@/interfaces/Workout.interface'
import { useExerciseStore } from '@/stores/exercise.store'
import { updateExerciseInWorkout, removeExercisesFromWorkout } from '@/services/workout.service'
import { useWorkoutStore } from '@/stores/workout.store'
import { toast } from 'vuetify-sonner'
import { useI18n } from 'vue-i18n'
import { displayExerciseName, resolveI18n } from '@/utils/exerciseDisplay'
import { useUserLanguage } from '@/composables/useUserLanguage'
import { parseDecimalInput, parseIntInput } from '@/utils/decimalInput'

const props = defineProps<{
  workoutId?: number
  selectedExercise: workoutExercise
  isViewExercise: boolean
  isViewWorkoutExercise: boolean
}>()

const isViewExercise = ref(props.isViewExercise)

const { t } = useI18n({ useScope: 'global' })
const { lang } = useUserLanguage()

const displayName = computed(() => displayExerciseName(props.selectedExercise.exercise, lang.value))

const displayDescription = computed(() =>
  resolveI18n(props.selectedExercise.exercise.description, lang.value) || t('common.noDescription')
)

const exerciseStore = useExerciseStore()
const workoutStore = useWorkoutStore()
const isLoading = ref<boolean>(false)

const initSetWeights = (): number[] => {
  const ex = props.selectedExercise
  if (ex.setWeights && ex.setWeights.length > 0) return [...ex.setWeights]
  return Array.from({ length: ex.sets || 1 }, () => ex.weight || 0)
}

const editExercise = ref<AddExerciseToWorkout | null>({
  exerciseId: Number(props.selectedExercise.exercise.id),
  sets: props.selectedExercise.sets,
  reps: props.selectedExercise.reps,
  pauseSeconds: props.selectedExercise?.pauseSeconds,
  order: props.selectedExercise?.order || 0,
  weight: props.selectedExercise?.weight || 0,
  setWeights: initSetWeights(),
})

watch(
  () => editExercise.value?.sets,
  newSets => {
    if (!editExercise.value) return
    const n = parseIntInput(newSets) || 1
    const current = editExercise.value.setWeights ?? []
    if (current.length < n) {
      const last = current[current.length - 1] ?? 0
      editExercise.value.setWeights = [
        ...current,
        ...Array.from({ length: n - current.length }, () => last),
      ]
    } else if (current.length > n) {
      editExercise.value.setWeights = current.slice(0, n)
    }
  }
)

function fillDown(fromIndex: number) {
  if (!editExercise.value?.setWeights) return
  const val = editExercise.value.setWeights[fromIndex]
  for (let i = fromIndex + 1; i < editExercise.value.setWeights.length; i++) {
    editExercise.value.setWeights[i] = val
  }
}

const emit = defineEmits<{
  (e: 'close'): void
}>()

const removeExercise = async () => {
  try {
    if (!props.selectedExercise || !props.workoutId) {
      console.error('No exercise or workout ID provided.')
      return
    }

    let response = null

    if (!props.workoutId) {
      console.error('No workout ID provided for removing exercise from workout.')
      return
    }
    response = await removeExercisesFromWorkout(props.workoutId, [
      props.selectedExercise.exercise.id,
    ])

    if (response) {
      toast.success(t('exercise.removed'), { progressBar: true, duration: 1000 })
      if (props.isViewWorkoutExercise) {
        await workoutStore.setWorkouts(true)
      } else {
        await exerciseStore.setExercises(true)
      }
      emit('close')
    } else {
      console.error('Failed to remove exercise.')
    }
  } catch (error) {
    toast.error(t('exercise.removeError'), { progressBar: true, duration: 1000 })
    console.error('Error in removeExerciseFromWorkout:', error)
  }
}

const getSanitizedExerciseDataForWorkout = () => {
  if (!props.selectedExercise || !editExercise.value) return {}

  const parsedSetWeights = (editExercise.value.setWeights ?? []).map(w => parseDecimalInput(w))
  const firstSetWeight = parsedSetWeights[0] ?? 0

  const original = {
    sets: props.selectedExercise.sets,
    reps: props.selectedExercise.reps,
    pauseSeconds: props.selectedExercise.pauseSeconds,
    order: props.selectedExercise.order,
    weight: props.selectedExercise.weight,
    exerciseId: Number(props.selectedExercise.exercise.id),
  }

  const edited = {
    sets: parseIntInput(editExercise.value.sets),
    reps: parseIntInput(editExercise.value.reps),
    pauseSeconds: parseIntInput(editExercise.value.pauseSeconds),
    order: Number(editExercise.value.order || 0),
    weight: firstSetWeight,
    exerciseId: Number(editExercise.value.exerciseId || 0),
  }

  const changes: Record<string, unknown> = Object.fromEntries(
    (Object.entries(edited) as [keyof typeof edited, number][]).filter(
      ([key, value]) => (original as Record<string, number>)[key as string] !== value
    )
  )

  // Always include setWeights — array diff is unreliable
  changes.setWeights = parsedSetWeights

  return changes
}

const updateExercise = async () => {
  try {
    isLoading.value = true
    if (!editExercise.value) {
      toast.error(t('exercise.updateNoData'), { progressBar: true, duration: 1000 })
      return
    }
    if (!props.workoutId) {
      toast.error(t('exercise.updateNoWorkoutId'), { progressBar: true, duration: 1000 })
      return
    }

    const workoutExercise = workoutStore.currentWorkout?.exercises.find(
      ex => ex.id === props.selectedExercise.id
    )

    if (!workoutExercise) {
      toast.error(t('exercise.updateNotFoundInWorkout'), { progressBar: true, duration: 1000 })
      return
    }

    const response = await updateExerciseInWorkout(
      props.workoutId,
      workoutExercise.id,
      getSanitizedExerciseDataForWorkout() || {}
    )
    if (response) {
      toast.success(t('exercise.updated'), { progressBar: true, duration: 1000 })
      await workoutStore.setWorkouts(true)
      emit('close')
    } else {
      toast.error(t('exercise.failedToUpdate'), { progressBar: true, duration: 1000 })
    }
  } catch (error) {
    toast.error(t('exercise.updateError'), { progressBar: true, duration: 1000 })
    console.error('Error in updateExercise:', error)
  } finally {
    isLoading.value = false
  }
}
</script>
