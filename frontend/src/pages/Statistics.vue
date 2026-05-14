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
  <div class="pa-5 d-flex flex-column ga-4 statistics-page">
    <div>
      <h1>{{ $t('statistics.title') }}</h1>
      <p class="text-textSecondary">{{ $t('statistics.description') }}</p>
    </div>

    <v-tabs v-model="activeTab" color="primary" density="compact" grow class="stats-tabs">
      <v-tab value="overview">{{ $t('statistics.overview') }}</v-tab>
      <v-tab value="exercises">{{ $t('statistics.exercises') }}</v-tab>
      <v-tab value="workouts">{{ $t('statistics.workouts') }}</v-tab>
    </v-tabs>

    <!-- ═══════ OVERVIEW TAB ═══════ -->
    <div v-if="activeTab === 'overview'" class="d-flex flex-column ga-4 fade-in">
      <!-- Loading skeleton -->
      <div v-if="statisticsStore.isLoadingOverview" class="d-flex flex-column ga-4">
        <v-skeleton-loader type="card" class="rounded-lg" />
        <v-skeleton-loader type="card" class="rounded-lg" />
        <v-skeleton-loader type="card" class="rounded-lg" />
      </div>

      <template v-else>
        <!-- Hero Stats Card with animated numbers -->
        <StatisticsHeroCard
          :overview="statisticsStore.overview"
          :comparison="statisticsStore.comparison"
        />

        <!-- Activity Heatmap -->
        <ActivityHeatmap :data="statisticsStore.heatmap" :weeks="12" />

        <!-- Quick Stats Grid (secondary metrics) -->
        <div v-if="statisticsStore.overview" class="d-flex flex-wrap ga-2">
          <v-card
            v-for="stat in secondaryStats"
            :key="stat.label"
            class="flex-1-1-0 bg-cardBg pa-3 rounded-lg stat-card-mini"
            style="
              border: 1px solid rgb(var(--v-theme-borderColor));
              box-shadow: none;
              min-width: 100px;
            "
          >
            <div class="d-flex align-center ga-2 mb-1">
              <v-icon :color="stat.color" size="14">{{ stat.icon }}</v-icon>
              <span class="text-caption text-textSecondary">{{ stat.label }}</span>
            </div>
            <p class="text-body-1 font-weight-bold">{{ stat.value }}</p>
          </v-card>
        </div>

        <!-- Comparison Cards -->
        <ComparisonCards :comparison="statisticsStore.comparison" />

        <!-- Weekly Volume Bar Chart -->
        <WeeklyVolumeChart :trends="statisticsStore.weeklyTrends" />

        <!-- Muscle Balance Radar -->
        <MuscleRadarChart
          v-if="statisticsStore.overview?.muscleGroupVolume?.length"
          :muscle-data="statisticsStore.overview.muscleGroupVolume"
        />

        <!-- PR Trophy Timeline -->
        <PRTimeline
          v-if="statisticsStore.overview?.recentPRs?.length"
          :prs="statisticsStore.overview.recentPRs"
          @select-exercise="handlePRExerciseClick"
        />

        <!-- Most Trained Chips -->
        <div
          v-if="statisticsStore.overview?.mostTrainedMuscleGroups?.length"
          class="d-flex flex-column ga-3"
        >
          <div>
            <p class="text-caption text-uppercase font-weight-bold text-textSecondary mb-2">
              {{ $t('statistics.mostTrainedMuscles') }}
            </p>
            <div class="d-flex flex-wrap ga-2">
              <v-chip
                v-for="mg in statisticsStore.overview.mostTrainedMuscleGroups"
                :key="mg.name"
                size="small"
                color="primary"
                variant="tonal"
              >
                {{ $t(`muscleGroups.${mg.name}`) }} ({{ mg.count }})
              </v-chip>
            </div>
          </div>

          <div v-if="statisticsStore.overview.mostTrainedExercises?.length">
            <p class="text-caption text-uppercase font-weight-bold text-textSecondary mb-2">
              {{ $t('statistics.mostTrainedExercises') }}
            </p>
            <div class="d-flex flex-wrap ga-2">
              <v-chip
                v-for="ex in statisticsStore.overview.mostTrainedExercises"
                :key="ex.name"
                size="small"
                variant="tonal"
              >
                {{ ex.name }} ({{ ex.count }})
              </v-chip>
            </div>
          </div>
        </div>

        <!-- Empty state (no data at all) -->
        <div
          v-if="!statisticsStore.overview || statisticsStore.overview.totalWorkouts === 0"
          class="text-center pa-6 text-textSecondary"
        >
          <v-icon size="48" class="mb-2" style="opacity: 0.3">mdi-chart-areaspline</v-icon>
          <p>{{ $t('statistics.noData') }}</p>
        </div>
      </template>
    </div>

    <!-- ═══════ EXERCISES TAB ═══════ -->
    <div v-if="activeTab === 'exercises'" class="fade-in">
      <v-text-field
        v-model="exerciseSearch"
        :placeholder="$t('exercise.searchExercises')"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        hide-details
        class="mb-3"
        bg-color="cardBg"
      />
      <div v-if="filteredExercises.length === 0" class="text-center pa-8 text-textSecondary">
        <v-icon size="48" class="mb-2" style="opacity: 0.3">mdi-dumbbell</v-icon>
        <p>{{ $t('statistics.noExercises') }}</p>
      </div>
      <v-card
        v-for="exercise in filteredExercises"
        :key="exercise.id"
        class="bg-cardBg pa-3 rounded-lg mb-2 cursor-pointer exercise-card"
        style="border: 1px solid rgb(var(--v-theme-borderColor)); box-shadow: none"
        @click="openExerciseDetail(exercise)"
      >
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center ga-3">
            <v-avatar v-if="exercise.image" size="40" rounded="lg">
              <v-img :src="getImageUrl(exercise.image)" />
            </v-avatar>
            <v-avatar v-else color="blue-grey-darken-3" size="40" rounded="lg">
              <v-icon size="18">mdi-dumbbell</v-icon>
            </v-avatar>
            <div>
              <p class="text-body-2 font-weight-bold">{{ resolveI18n(exercise.title, lang) }}</p>
              <div class="d-flex ga-1">
                <v-chip
                  v-for="mg in exercise.muscleGroups?.slice(0, 2)"
                  :key="mg.id"
                  size="x-small"
                  variant="tonal"
                >
                  {{ $t(`muscleGroups.${mg.name}`) }}
                </v-chip>
              </div>
            </div>
          </div>
          <v-icon size="18" class="text-textSecondary">mdi-chevron-right</v-icon>
        </div>
      </v-card>
    </div>

    <!-- ═══════ WORKOUTS TAB ═══════ -->
    <div v-if="activeTab === 'workouts'" class="fade-in">
      <div v-if="workoutStore.workouts.length === 0" class="text-center pa-8 text-textSecondary">
        <v-icon size="48" class="mb-2" style="opacity: 0.3">mdi-clipboard-list</v-icon>
        <p>{{ $t('statistics.noWorkouts') }}</p>
      </div>
      <v-card
        v-for="workout in workoutStore.workouts"
        :key="workout.id"
        class="bg-cardBg pa-3 rounded-lg mb-2 cursor-pointer exercise-card"
        style="border: 1px solid rgb(var(--v-theme-borderColor)); box-shadow: none"
        @click="openWorkoutDetail(workout)"
      >
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center ga-3">
            <v-avatar color="deep-purple-darken-3" size="40" rounded="lg">
              <v-icon size="18">mdi-clipboard-list</v-icon>
            </v-avatar>
            <div>
              <p class="text-body-2 font-weight-bold">{{ workout.title }}</p>
              <p class="text-caption text-textSecondary">
                {{ workout.exercises?.length ?? 0 }} {{ $t('statistics.exercises') }} ·
                {{ workout.time }} {{ $t('units.minShort') }}
              </p>
            </div>
          </div>
          <v-icon size="18" class="text-textSecondary">mdi-chevron-right</v-icon>
        </div>
      </v-card>
    </div>

    <!-- Exercise Detail Dialog -->
    <ExerciseStatisticsDetail v-model="showExerciseDetail" :exercise="selectedExercise" />

    <!-- Workout Detail Dialog -->
    <WorkoutStatisticsDetail v-model="showWorkoutDetail" :workout="selectedWorkout" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { resolveI18n } from '@/utils/exerciseDisplay'
import { useUserLanguage } from '@/composables/useUserLanguage'
import StatisticsHeroCard from '@/components/Statistics/StatisticsHeroCard.vue'
import ActivityHeatmap from '@/components/Statistics/ActivityHeatmap.vue'
import WeeklyVolumeChart from '@/components/Statistics/WeeklyVolumeChart.vue'
import MuscleRadarChart from '@/components/Statistics/MuscleRadarChart.vue'
import PRTimeline from '@/components/Statistics/PRTimeline.vue'
import ComparisonCards from '@/components/Statistics/ComparisonCards.vue'
import ExerciseStatisticsDetail from '@/components/Statistics/ExerciseStatisticsDetail.vue'
import WorkoutStatisticsDetail from '@/components/Statistics/WorkoutStatisticsDetail.vue'
import { useStatisticsStore } from '@/stores/statistics.store'
import { useExerciseStore } from '@/stores/exercise.store'
import { useWorkoutStore } from '@/stores/workout.store'
import type { Exercise } from '@/interfaces/Exercise.interface'
import type { Workout } from '@/interfaces/Workout.interface'

const { t } = useI18n()
const { lang } = useUserLanguage()
const statisticsStore = useStatisticsStore()
const exerciseStore = useExerciseStore()
const workoutStore = useWorkoutStore()

const activeTab = ref('overview')
const exerciseSearch = ref('')
const showExerciseDetail = ref(false)
const showWorkoutDetail = ref(false)
const selectedExercise = ref<Exercise | null>(null)
const selectedWorkout = ref<Workout | null>(null)

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8393/v1'

function getImageUrl(image: string | null | undefined): string {
  if (!image) return ''
  if (image.startsWith('http')) return image
  return `${apiUrl}/${image}`
}

const filteredExercises = computed(() => {
  const search = exerciseSearch.value.toLowerCase()
  if (!search) return exerciseStore.exercises
  return exerciseStore.exercises.filter(
    e =>
      resolveI18n(e.title, lang.value).toLowerCase().includes(search) ||
      e.muscleGroups?.some(mg => mg.name.toLowerCase().includes(search))
  )
})

const secondaryStats = computed(() => {
  const o = statisticsStore.overview
  if (!o) return []
  return [
    {
      icon: 'mdi-calendar-week',
      color: 'blue',
      label: t('statistics.thisWeek'),
      value: `${o.workoutsThisWeek}`,
    },
    {
      icon: 'mdi-calendar-month',
      color: 'purple',
      label: t('statistics.thisMonth'),
      value: `${o.workoutsThisMonth}`,
    },
    {
      icon: 'mdi-clock-outline',
      color: 'teal',
      label: t('statistics.avgDuration'),
      value: `${o.averageSessionDuration} ${t('units.minShort')}`,
    },
    {
      icon: 'mdi-timer-sand',
      color: 'orange',
      label: t('statistics.totalTime'),
      value: formatDuration(o.totalDuration),
    },
  ]
})

function formatDuration(minutes: number): string {
  if (!minutes) return '0 min'
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`
  if (hrs > 0) return `${hrs}h`
  return `${mins} min`
}

function openExerciseDetail(exercise: Exercise) {
  selectedExercise.value = exercise
  showExerciseDetail.value = true
}

function openWorkoutDetail(workout: Workout) {
  selectedWorkout.value = workout
  showWorkoutDetail.value = true
}

function handlePRExerciseClick(exerciseId: number) {
  const exercise = exerciseStore.exercises.find(e => e.id === exerciseId)
  if (exercise) {
    openExerciseDetail(exercise)
  }
}

onMounted(async () => {
  // Fetch all data in parallel for maximum speed
  await Promise.all([
    statisticsStore.fetchOverview(),
    statisticsStore.fetchWeeklyTrends(),
    statisticsStore.fetchComparison(),
    statisticsStore.fetchActivityHeatmap(),
    exerciseStore.setExercises(),
    workoutStore.setWorkouts(),
  ])
})
</script>

<style scoped>
.statistics-page {
  padding-bottom: 80px;
}

.stats-tabs :deep(.v-tab) {
  text-transform: none;
  font-weight: 600;
  letter-spacing: 0;
  font-size: 13px;
}

.cursor-pointer {
  cursor: pointer;
}

.exercise-card {
  transition:
    border-color 0.2s ease,
    transform 0.15s ease;
}

.exercise-card:active {
  transform: scale(0.985);
}

.stat-card-mini {
  transition: border-color 0.2s ease;
}

.stat-card-mini:hover {
  border-color: rgba(171, 255, 26, 0.2) !important;
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
