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
  <v-dialog v-model="dialogModel" fullscreen transition="dialog-bottom-transition">
    <v-card class="bg-background">
      <div class="pa-5 d-flex flex-column ga-4">
        <!-- Header -->
        <BackHeader :title="workout?.title ?? ''" @close="dialogModel = false" />

        <div class="mt-4">
          <p class="text-caption text-textSecondary">
            {{ workout?.exercises?.length ?? 0 }} {{ $t('statistics.exercises') }} ·
            {{ workout?.time ?? 0 }} min
          </p>
        </div>

        <!-- Summary Cards -->
        <div v-if="statisticsStore.workoutHistory" class="d-flex flex-wrap ga-2">
          <v-card
            v-for="card in summaryCards"
            :key="card.label"
            class="flex-grow-1 bg-cardBg pa-3 rounded-lg"
            style="
              border: 1px solid rgb(var(--v-theme-borderColor));
              box-shadow: none;
              min-width: 140px;
            "
          >
            <p class="text-caption text-textSecondary">{{ card.label }}</p>
            <p class="text-body-1 font-weight-bold text-primary">{{ card.value }}</p>
          </v-card>
        </div>

        <!-- Volume Chart -->
        <div v-if="chartPoints.length > 1">
          <p class="text-caption text-uppercase font-weight-bold text-textSecondary mb-2">
            {{ $t('statistics.volumeOverTime') }}
          </p>
          <v-card
            class="bg-cardBg pa-3 rounded-lg"
            style="border: 1px solid rgb(var(--v-theme-borderColor)); box-shadow: none"
          >
            <Line :data="chartData" :options="chartOptions" style="max-height: 200px" />
          </v-card>
        </div>

        <!-- Session History -->
        <div>
          <p class="text-caption text-uppercase font-weight-bold text-textSecondary mb-2">
            {{ $t('statistics.sessionHistory') }}
            <span v-if="statisticsStore.workoutHistory" class="text-textSecondary">
              ({{ statisticsStore.workoutHistory.total }})
            </span>
          </p>

          <div
            v-if="statisticsStore.isLoadingWorkout && !statisticsStore.workoutHistory"
            class="d-flex justify-center pa-4"
          >
            <v-progress-circular indeterminate color="primary" size="24" />
          </div>

          <div
            v-else-if="!statisticsStore.workoutHistory?.sessions.length"
            class="text-center pa-4 text-textSecondary"
          >
            <p>{{ $t('statistics.noHistory') }}</p>
          </div>

          <template v-else>
            <v-card
              v-for="(session, idx) in statisticsStore.workoutHistory.sessions"
              :key="idx"
              class="bg-cardBg pa-3 rounded-lg mb-2"
              style="border: 1px solid rgb(var(--v-theme-borderColor)); box-shadow: none"
            >
              <div class="d-flex align-center justify-space-between">
                <div>
                  <p class="text-body-2 font-weight-bold">{{ formatFullDate(session.date) }}</p>
                  <p class="text-caption text-textSecondary">
                    {{ formatDuration(session.duration) }}
                    · {{ session.totalVolume?.toLocaleString() ?? 0 }} kg ·
                    {{ session.exerciseCount }} {{ $t('statistics.exercises') }}
                  </p>
                </div>
                <v-chip
                  v-if="(session as any).recordCount && (session as any).recordCount > 0"
                  size="x-small"
                  color="amber"
                  variant="tonal"
                >
                  <v-icon start size="10">mdi-trophy</v-icon>
                  {{ (session as any).recordCount }} PR{{
                    (session as any).recordCount > 1 ? 's' : ''
                  }}
                </v-chip>
              </div>
            </v-card>

            <!-- Load More -->
            <v-btn
              v-if="hasMoreHistory"
              variant="text"
              color="primary"
              block
              size="small"
              :loading="statisticsStore.isLoadingWorkout"
              @click="loadMore"
            >
              {{ $t('statistics.loadMore') }}
            </v-btn>
          </template>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  BarElement,
} from 'chart.js'
import { Line } from 'vue-chartjs'
import { useStatisticsStore } from '@/stores/statistics.store'
import type { Workout } from '@/interfaces/Workout.interface'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  BarElement
)

const { t } = useI18n()
const statisticsStore = useStatisticsStore()

const props = defineProps<{
  workout: Workout | null
}>()

const dialogModel = defineModel<boolean>({ default: false })

const summaryCards = computed(() => {
  const h = statisticsStore.workoutHistory
  if (!h) return []
  return [
    {
      label: t('statistics.timesCompleted'),
      value: h.summary.timesCompleted.toString(),
    },
    {
      label: t('statistics.avgDuration'),
      value: formatDuration(Math.round(h.summary.averageDuration)),
    },
    {
      label: t('statistics.avgVolume'),
      value: `${Math.round(h.summary.averageVolume).toLocaleString()} kg`,
    },
  ]
})

const chartPoints = computed(() => {
  const sessions = statisticsStore.workoutHistory?.sessions ?? []
  return [...sessions].reverse()
})

const chartData = computed(() => ({
  labels: chartPoints.value.map(s => formatShortDate(s.date)),
  datasets: [
    {
      label: t('statistics.totalVolume'),
      data: chartPoints.value.map(s => s.totalVolume ?? 0),
      borderColor: '#ABFF1A',
      backgroundColor: 'rgba(171, 255, 26, 0.1)',
      fill: true,
      tension: 0.3,
      pointRadius: 3,
      pointBackgroundColor: '#ABFF1A',
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index' as const,
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1E1E1E',
      titleColor: '#fff',
      bodyColor: '#ABFF1A',
      borderColor: 'rgba(171, 255, 26, 0.3)',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 10,
    },
  },
  scales: {
    x: {
      ticks: { color: '#888', maxTicksLimit: 6, font: { size: 10 } },
      grid: { display: false },
      border: { display: false },
    },
    y: {
      ticks: { color: '#888', font: { size: 10 } },
      grid: { color: 'rgba(255,255,255,0.04)' },
      border: { display: false },
    },
  },
}))

const hasMoreHistory = computed(() => {
  const h = statisticsStore.workoutHistory
  if (!h) return false
  return h.sessions.length < h.total
})

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatDuration(minutes: number): string {
  if (!minutes) return '0 min'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m} min`
}

function loadMore() {
  if (props.workout) {
    statisticsStore.loadMoreWorkoutHistory(props.workout.id)
  }
}

// Load data when dialog opens
watch(dialogModel, async open => {
  if (open && props.workout) {
    await statisticsStore.fetchWorkoutHistory(props.workout.id)
  } else {
    statisticsStore.clearWorkoutData()
  }
})
</script>
