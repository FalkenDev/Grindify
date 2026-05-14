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
    <BackHeader
      :title="$t('settings.exercises')"
      show-menu
      :loading="isLoading"
      @close="emit('close')"
    >
      <template #menuAppend>
        <v-list>
          <v-list-item @click="isCreateExerciseOpen = true">
            <v-list-item-title>{{ $t('exercise.createExercise') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </template>
    </BackHeader>

    <div class="mx-5 mt-2 mb-8">
      <v-text-field
        v-model="searchQuery"
        variant="outlined"
        prepend-inner-icon="mdi-magnify"
        :label="$t('exercise.searchExercises')"
        clearable
        hide-details
        density="compact"
      >
        <template #append-inner>
          <v-badge
            :model-value="activeFilterCount > 0"
            color="error"
            :content="activeFilterCount"
            floating
            offset-x="-2"
            offset-y="-2"
          >
            <v-icon class="cursor-pointer" @click.stop="isFilterMenuOpen = !isFilterMenuOpen">
              mdi-filter-variant
            </v-icon>
          </v-badge>
          <v-menu
            v-model="isFilterMenuOpen"
            :close-on-content-click="false"
            location="bottom end"
            activator="parent"
          >
            <v-card
              class="bg-cardBg pa-3"
              :style="{ border: '1px solid rgb(var(--v-theme-borderColor))', minWidth: '220px' }"
            >
              <div class="d-flex justify-space-between align-center mb-2">
                <p class="text-body-2 font-weight-bold">{{ $t('common.filter') }}</p>
                <v-btn variant="text" size="small" color="textSecondary" @click="resetFilters">
                  {{ $t('common.reset') }}
                </v-btn>
              </div>

              <p class="text-caption text-textSecondary mb-1">
                {{ $t('exerciseForm.muscleGroupsLabel') }}
              </p>
              <v-chip-group
                v-model="selectedMuscleGroups"
                multiple
                column
                selected-class="text-primary"
              >
                <v-chip
                  v-for="mg in muscleGroups"
                  :key="mg.id"
                  :value="mg.id"
                  variant="outlined"
                  size="small"
                  filter
                >
                  {{ $t(`muscleGroups.${mg.name}`) }}
                </v-chip>
              </v-chip-group>

              <p class="text-caption text-textSecondary mt-3 mb-1">
                {{ $t('exerciseForm.exerciseTypeLabel') }}
              </p>
              <v-chip-group v-model="selectedTypes" multiple column selected-class="text-primary">
                <v-chip value="compound" variant="outlined" size="small" filter>{{ $t('exercise.types.compound') }}</v-chip>
                <v-chip value="isolation" variant="outlined" size="small" filter>{{ $t('exercise.types.isolation') }}</v-chip>
                <v-chip value="bodyweight" variant="outlined" size="small" filter
                  >{{ $t('exercise.types.bodyweight') }}</v-chip
                >
              </v-chip-group>
            </v-card>
          </v-menu>
        </template>
      </v-text-field>
    </div>

    <div
      class="flex-grow-1 overflow-y-auto pa-0 bg-background d-flex ga-3 flex-column"
      style="padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px))"
    >
      <v-list-item
        v-for="exercise in exercises"
        :key="exercise.id"
        class="border-sm py-2 bg-cardBg rounded-lg mx-5"
        two-line
        @click.stop="openViewExercise(exercise)"
      >
        <div class="d-flex justify-space-between align-center w-100">
          <div class="d-flex align-center ga-4">
            <v-avatar color="avatarBg" size="50" tile class="rounded-lg">
              <v-icon color="primary">mdi-dumbbell</v-icon>
            </v-avatar>
            <div class="d-flex flex-column">
              <v-list-item-title class="text-body-1 font-weight-bold">
                {{ displayName(exercise) }}
              </v-list-item-title>
              <div class="d-flex ga-2 align-center">
                <v-chip v-if="getPrimaryMuscle(exercise)" size="x-small">
                  {{ getPrimaryMuscle(exercise) }}
                </v-chip>
                <p
                  v-if="exercise.exerciseType"
                  class="text-textSecondary text-caption text-capitalize"
                >
                  {{ exercise.exerciseType }}
                </p>
              </div>
            </div>
          </div>
          <v-icon color="grey-lighten-1">mdi-chevron-right</v-icon>
        </div>
      </v-list-item>

      <div class="d-flex justify-center mt-2 mx-5">
        <v-btn
          outlined
          block
          color="cardBg"
          :style="{ border: '1px dashed rgb(var(--v-theme-borderColor))', boxShadow: 'none' }"
          class="text-primary rounded-lg"
          height="50"
          @click="isCreateExerciseOpen = true"
        >
          {{ $t('exercise.createNewExercise') }}
        </v-btn>
      </div>
    </div>
  </div>

  <v-dialog v-model="isCreateExerciseOpen" fullscreen>
    <CreateExercise @close="onCreateExerciseClose" />
  </v-dialog>
  <v-dialog v-model="isViewExerciseOpen" fullscreen>
    <ExerciseDetails
      :selected-exercise="viewExercise"
      :is-view-exercise="true"
      @close="onViewExerciseClose"
    />
  </v-dialog>
</template>

<script lang="ts" setup>
import type { Exercise } from '@/interfaces/Exercise.interface'
import type { MuscleGroup } from '@/interfaces/MuscleGroup.interface'
import { useExerciseStore } from '@/stores/exercise.store'
import { useMuscleGroupStore } from '@/stores/muscleGroup.store'
import { useI18n } from 'vue-i18n'
import { displayExerciseName, resolveI18n } from '@/utils/exerciseDisplay'
import { useUserLanguage } from '@/composables/useUserLanguage'

const muscleGroupStore = useMuscleGroupStore()
const searchQuery = ref('')
const exerciseStore = useExerciseStore()
const { t } = useI18n({ useScope: 'global' })
const { lang } = useUserLanguage()
const isLoading = ref(false)
const viewExercise = ref<Exercise | null>(null)
const isViewExerciseOpen = ref(false)
const isCreateExerciseOpen = ref(false)
const isFilterMenuOpen = ref(false)
const selectedMuscleGroups = ref<number[]>([])
const selectedTypes = ref<string[]>([])

const emit = defineEmits<{
  (e: 'close'): void
}>()

const muscleGroups = computed(() =>
  muscleGroupStore.muscleGroups.map(g => ({ name: g.name, translatedName: t(g.name), id: g.id }))
)

const activeFilterCount = computed(
  () => selectedMuscleGroups.value.length + selectedTypes.value.length
)

const resetFilters = () => {
  selectedMuscleGroups.value = []
  selectedTypes.value = []
}

const displayName = (exercise: Exercise) => displayExerciseName(exercise, lang.value)

const getPrimaryMuscle = (exercise: Exercise): string | null => {
  if (exercise.primaryMuscleGroups?.length)
    return exercise.primaryMuscleGroups.map(mg => t(`muscleGroups.${mg.name}`)).join(', ')
  if (exercise.muscleGroups?.length) return t(`muscleGroups.${exercise.muscleGroups[0].name}`)
  return null
}

const openViewExercise = (exercise: Exercise) => {
  viewExercise.value = exercise
  isViewExerciseOpen.value = true
}

const onViewExerciseClose = async () => {
  isViewExerciseOpen.value = false
  await exerciseStore.setExercises(true)
}

const onCreateExerciseClose = async () => {
  isCreateExerciseOpen.value = false
  await exerciseStore.setExercises(true)
}

const exercises = computed<Exercise[]>(() =>
  exerciseStore.exercises.filter((exercise: Exercise) => {
    const name = displayName(exercise).toLowerCase()
    const desc = resolveI18n(exercise.description, lang.value).toLowerCase()
    const query = (searchQuery.value || '').toLowerCase()
    const matchesSearch = name.includes(query) || desc.includes(query)

    const matchesMuscleGroup =
      selectedMuscleGroups.value.length === 0 ||
      exercise.muscleGroups?.some((mg: MuscleGroup) => selectedMuscleGroups.value.includes(mg.id))

    const matchesType =
      selectedTypes.value.length === 0 ||
      (exercise.exerciseType && selectedTypes.value.includes(exercise.exerciseType))

    return matchesSearch && matchesMuscleGroup && matchesType
  })
)
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
