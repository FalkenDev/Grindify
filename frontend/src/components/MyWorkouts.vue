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
  <div class="pa-0">
    <div class="d-flex align-center justify-space-between mb-3">
      <div class="d-flex justify-space-between align-center w-100">
        <h1 class="text-caption text-uppercase font-weight-bold text-textSecondary">
          {{ $t('myWorkouts.title') }}
        </h1>
        <span
          v-if="workouts.length"
          class="text-capitalize text-primary text-caption font-weight-bold cursor-pointer"
          @click="isWorkoutListOpen = true"
        >
          {{ $t('common.viewAll') }}
        </span>
      </div>
    </div>

    <div v-if="!workouts.length && loading">
      <v-skeleton-loader
        v-for="n in 3"
        :key="n"
        type="list-item-two-line, list-item"
        class="mb-3 bg-cardBg rounded-lg"
        :style="{ border: '1px solid rgb(var(--v-theme-borderColor))' }"
      />
    </div>

    <div v-else-if="workouts.length" class="d-flex flex-column ga-3">
      <v-card
        v-for="workout in workouts?.slice(0, 6) ?? []"
        :key="workout.id"
        class="bg-cardBg px-4 rounded-lg d-flex justify-space-between align-center"
        :style="{ border: '1px solid rgb(var(--v-theme-borderColor))', boxShadow: 'none' }"
        @click="routeTo(workout.id)"
      >
        <div class="d-flex align-center ga-4">
          <v-avatar size="40" tile color="avatarBg" class="mb-3 mt-4 rounded-lg">
            <v-icon color="primary" size="25">mdi-dumbbell</v-icon>
          </v-avatar>
          <div>
            <h1 class="font-weight-bold text-textPrimary" style="font-size: 16px">
              {{ workout.title }}
            </h1>

            <span class="text-caption text-textSecondary align-center d-flex ga-1">
              {{ workout.exercises.length }}
              {{ $t('myWorkouts.exercisesUnit') }}
              •
              {{ workout.time }}
              {{ $t('units.minShort') }}
            </span>
          </div>
        </div>
        <v-icon size="30">mdi-chevron-right</v-icon>
      </v-card>
    </div>

    <v-card
      v-else
      class="bg-cardBg pa-6 rounded-lg"
      :style="{ border: '1px solid rgb(var(--v-theme-borderColor))', boxShadow: 'none' }"
    >
      <div class="d-flex flex-column align-center text-center">
        <v-icon color="primary" size="48">mdi-dumbbell</v-icon>
        <div class="text-subtitle-1 font-weight-medium text-textPrimary mt-2">
          {{ $t('myWorkouts.emptyTitle') }}
        </div>
        <div class="text-body-2 text-textSecondary mt-1">
          {{ $t('myWorkouts.emptyDescription') }}
        </div>
      </div>
    </v-card>

    <div class="d-flex justify-center mt-4">
      <v-btn
        outlined
        block
        color="cardBg"
        style="
          border: 1px solid rgb(var(--v-theme-borderColor));
          box-shadow: none;
          border-style: dashed;
        "
        class="text-primary rounded-lg mb-6"
        height="50"
        @click="isCreateWorkoutOpen = true"
      >
        {{ $t('myWorkouts.addNewWorkout') }}
      </v-btn>
    </div>

    <v-dialog v-model="isWorkoutListOpen" fullscreen transition="slide-y-transition" persistent>
      <WorkoutList @close="isWorkoutListOpen = false" />
    </v-dialog>
    <v-dialog v-model="isCreateWorkoutOpen" fullscreen>
      <CreateWorkout @close="isCreateWorkoutOpen = false" />
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useWorkoutStore } from '@/stores/workout.store'
import type { Workout } from '@/interfaces/Workout.interface'

const router = useRouter()
const workoutStore = useWorkoutStore()

const loading = ref(false)
const isWorkoutListOpen = ref(false)
const isCreateWorkoutOpen = ref(false)

const workouts = computed<Workout[]>(() => {
  const list = workoutStore.workouts || []
  return [...list].sort(
    (a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime()
  )
})

function routeTo(id: number) {
  workoutStore.setCurrentWorkout(id)
  router.push(`/workout/${id}`)
}
</script>
