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
    <BackHeader :title="$t('workoutList.title')" show-menu @close="emit('close')">
      <template #menuAppend>
        <v-list>
          <v-list-item @click="isCreateWorkoutOpen = true">
            <v-list-item-title>{{ $t('workoutList.createWorkout') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </template>
    </BackHeader>

    <div class="mx-5 mt-2 mb-4">
      <v-text-field
        v-model="search"
        variant="outlined"
        prepend-inner-icon="mdi-magnify"
        :label="$t('common.search')"
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
            <v-icon class="cursor-pointer" @click.stop="mgSheet = !mgSheet">
              mdi-filter-variant
            </v-icon>
          </v-badge>
          <v-menu
            v-model="mgSheet"
            :close-on-content-click="false"
            location="bottom end"
            activator="parent"
          >
            <v-card
              class="bg-cardBg pa-3"
              style="border: 1px solid rgb(var(--v-theme-borderColor)); min-width: 220px"
            >
              <div class="d-flex justify-space-between align-center mb-2">
                <p class="text-body-2 font-weight-bold">{{ $t('common.filter') }}</p>
                <v-btn variant="text" size="small" color="textSecondary" @click="clearAllFilters">
                  {{ $t('common.reset') }}
                </v-btn>
              </div>

              <p class="text-caption text-textSecondary mb-1">
                {{ $t('workoutList.muscleGroupsTitle') }}
              </p>
              <v-chip-group v-model="selectedMGIds" multiple column selected-class="text-primary">
                <v-chip
                  v-for="mg in allMuscleGroups"
                  :key="mg.id"
                  :value="mg.id"
                  variant="outlined"
                  size="small"
                  filter
                >
                  {{ $t(`muscleGroups.${mg.name}`) }}
                </v-chip>
              </v-chip-group>
            </v-card>
          </v-menu>
        </template>
      </v-text-field>
    </div>

    <div class="flex-grow-1 overflow-y-auto pa-0 pb-5 bg-background d-flex ga-3 flex-column" style="overscroll-behavior-y: contain">
      <v-list-item
        v-for="workout in filteredWorkouts"
        :key="workout.id"
        class="border-sm py-2 bg-cardBg rounded-lg mx-5"
        two-line
        @click="openWorkoutDetails(workout.id)"
      >
        <div class="d-flex justify-space-between align-center w-100">
          <div class="d-flex align-center ga-4">
            <v-avatar color="avatarBg" size="50" tile class="rounded-lg">
              <v-icon color="primary">mdi-dumbbell</v-icon>
            </v-avatar>
            <div class="d-flex flex-column">
              <div>
                <v-chip size="x-small" variant="outlined" class="mb-1">
                  {{ getWorkoutType(workout) }}
                </v-chip>
              </div>
              <v-list-item-title class="text-body-1 font-weight-bold">
                {{ workout.title }}
              </v-list-item-title>
              <p class="text-textSecondary text-caption">
                {{ workout.time }} {{ $t('units.minShort') }} • {{ workout.exercises.length }}
                {{ $t('workoutList.exercisesUnit') }}
              </p>
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
          style="
            border: 1px solid rgb(var(--v-theme-borderColor));
            box-shadow: none;
            border-style: dashed;
          "
          class="text-primary rounded-lg"
          height="50"
          @click="isCreateWorkoutOpen = true"
        >
          {{ $t('workoutList.createWorkout') }}
        </v-btn>
      </div>
    </div>

    <v-dialog v-model="isCreateWorkoutOpen" fullscreen>
      <CreateWorkout @close="isCreateWorkoutOpen = false" />
    </v-dialog>

    <v-dialog v-model="isWorkoutDetailsOpen" fullscreen>
      <WorkoutDetails
        v-if="selectedWorkoutId !== null"
        :workout-id="selectedWorkoutId"
        @close="isWorkoutDetailsOpen = false"
      />
    </v-dialog>
  </div>
</template>
<script setup lang="ts">
import type { MuscleGroup } from '@/interfaces/Exercise.interface'
import type { Workout } from '@/interfaces/Workout.interface'
import { useWorkoutStore } from '@/stores/workout.store'
import { useI18n } from 'vue-i18n'
import WorkoutDetails from '@/pages/WorkoutDetails.vue'
import { resolveI18n } from '@/utils/exerciseDisplay'
import { useUserLanguage } from '@/composables/useUserLanguage'

const { t } = useI18n({ useScope: 'global' })
const { lang } = useUserLanguage()

const emit = defineEmits<{ (e: 'close'): void }>()
const workoutStore = useWorkoutStore()

const workouts = computed<Workout[]>(() => {
  const w = (workoutStore.workouts as Workout[]) || []
  return w.slice().sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
})

const search = ref('')
const mgSheet = ref(false)
const mgSearch = ref('')
const selectedMGIds = ref<number[]>([])
const isCreateWorkoutOpen = ref(false)
const isWorkoutDetailsOpen = ref(false)
const selectedWorkoutId = ref<number | null>(null)

const activeFilterCount = computed(
  () => selectedMGIds.value.length + (search.value.trim().length > 0 ? 1 : 0)
)

const allMuscleGroups = computed<MuscleGroup[]>(() => {
  const map = new Map<number, MuscleGroup>()
  for (const w of workouts.value) {
    for (const it of w.exercises) {
      for (const mg of it.exercise.muscleGroups) {
        map.set(mg.id, {
          id: mg.id,
          name: mg.name,
          createdAt: mg.createdAt ?? '',
          updatedAt: mg.updatedAt ?? '',
        })
      }
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    t(`muscleGroups.${a.name}`).localeCompare(t(`muscleGroups.${b.name}`))
  )
})

// const filteredMuscleGroups = computed(() => {
//   const q = mgSearch.value.trim().toLowerCase()
//   if (!q) return allMuscleGroups.value
//   return allMuscleGroups.value.filter(m => t(`muscleGroups.${m.name}`).toLowerCase().includes(q))
// })

// const activeMGs = computed(() =>
//   allMuscleGroups.value.filter(m => selectedMGIds.value.includes(m.id))
// )

const filteredWorkouts = computed<Workout[]>(() => {
  let list = workouts.value

  // Search by title, description, exercise names
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(w => {
      const inTitle =
        w.title.toLowerCase().includes(q) || (w.description || '').toLowerCase().includes(q)
      const inExercises = w.exercises.some(it => resolveI18n(it.exercise.title, lang.value).toLowerCase().includes(q))
      return inTitle || inExercises
    })
  }

  if (selectedMGIds.value.length) {
    list = list.filter(w => {
      const mgIds = new Set<number>()
      w.exercises.forEach(it => it.exercise.muscleGroups.forEach(mg => mgIds.add(mg.id)))
      return selectedMGIds.value.every(id => mgIds.has(id))
    })
  }

  return list.slice().sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
})

// function orderedItems(w: Workout) {
//   return w.exercises.slice().sort((a, b) => a.order - b.order)
// }

// function totalSets(w: Workout) {
//   return w.exercises.reduce((sum, it) => sum + (it.sets || 0), 0)
// }

// function topMuscleGroups(w: Workout, limit = 3) {
//   const counts = new Map<string, number>()

//   w.exercises.forEach(it => {
//     it.exercise.muscleGroups.forEach(m => {
//       const translated = t(`muscleGroups.${m.name}`)
//       counts.set(translated, (counts.get(translated) ?? 0) + 1)
//     })
//   })

//   const sorted = Array.from(counts.entries())
//     .sort((a, b) => b[1] - a[1]) // descending by frequency
//     .map(([name]) => name)

//   return {
//     list: sorted.slice(0, limit),
//     extra: sorted.length > limit ? sorted.length - limit : 0,
//   }
// }

function getWorkoutType(workout: Workout): string {
  // Use the stored type if available
  if (workout.type) {
    return t(`editWorkout.types.${workout.type}`)
  }

  // Fallback: determine from muscle groups distribution
  const muscleGroupMap = new Map<string, number>()

  workout.exercises.forEach(ex => {
    ex.exercise.muscleGroups.forEach(mg => {
      const translated = t(`muscleGroups.${mg.name}`)
      muscleGroupMap.set(translated, (muscleGroupMap.get(translated) ?? 0) + 1)
    })
  })

  if (muscleGroupMap.size === 0) return t('editWorkout.types.strength')

  const sorted = Array.from(muscleGroupMap.entries()).sort((a, b) => b[1] - a[1])
  return sorted[0]?.[0] || t('editWorkout.types.strength')
}

// function toggleMG(id: number) {
//   const idx = selectedMGIds.value.indexOf(id)
//   if (idx === -1) selectedMGIds.value.push(id)
//   else selectedMGIds.value.splice(idx, 1)
// }

// function removeMG(id: number) {
//   selectedMGIds.value = selectedMGIds.value.filter(x => x !== id)
// }

function clearMG() {
  selectedMGIds.value = []
  mgSearch.value = ''
}

function clearAllFilters() {
  clearMG()
  search.value = ''
}

function openWorkoutDetails(id: number) {
  selectedWorkoutId.value = id
  isWorkoutDetailsOpen.value = true
}
</script>
<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
