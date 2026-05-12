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
        <BackHeader
          :title="exercise?.name ?? ''"
          :subtitle="
            exercise
              ? `${exercise.muscleGroups?.map(mg => $t(`muscleGroups.${mg.name}`)).join(', ')}`
              : ''
          "
          :image="exercise?.image ? getImageUrl(exercise.image) : undefined"
          icon="mdi-dumbbell"
          @close="dialogModel = false"
        />

        <div class="mt-4 mb-2 d-flex ga-2">
          <v-chip
            v-for="mg in exercise?.muscleGroups?.slice(0, 3)"
            :key="mg.id"
            size="x-small"
            variant="tonal"
          >
            {{ $t(`muscleGroups.${mg.name}`) }}
          </v-chip>
        </div>

        <!-- Personal Records -->
        <div v-if="hasRecords">
          <p class="text-caption text-uppercase font-weight-bold text-textSecondary mb-2">
            {{ $t('statistics.personalRecords') }}
          </p>
          <div class="d-flex flex-wrap ga-2">
            <v-card
              v-for="record in recordCards"
              :key="record.label"
              class="flex-grow-1 bg-cardBg pa-3 rounded-lg"
              style="
                border: 1px solid rgb(var(--v-theme-borderColor));
                box-shadow: none;
                min-width: 140px;
              "
            >
              <div class="d-flex align-center ga-1 mb-1">
                <v-icon size="14" color="amber">mdi-trophy</v-icon>
                <span class="text-caption text-textSecondary">{{ record.label }}</span>
              </div>
              <p class="text-body-1 font-weight-bold text-primary">{{ record.value }}</p>
              <p v-if="record.detail" class="text-caption text-textSecondary">
                {{ record.detail }}
              </p>
              <p v-if="record.date" class="text-caption text-textSecondary">{{ record.date }}</p>
            </v-card>
          </div>
        </div>

        <!-- Progress Chart -->
        <div v-if="statisticsStore.exerciseProgress.length > 1">
          <div class="d-flex align-center justify-space-between mb-2">
            <p class="text-caption text-uppercase font-weight-bold text-textSecondary">
              {{ $t('statistics.progressChart') }}
            </p>
          </div>

          <div class="d-flex ga-2 mb-2">
            <v-chip
              v-for="m in metricOptions"
              :key="m.value"
              :color="selectedMetric === m.value ? 'primary' : undefined"
              :variant="selectedMetric === m.value ? 'flat' : 'tonal'"
              size="x-small"
              @click="changeMetric(m.value)"
            >
              {{ m.label }}
            </v-chip>
          </div>
          <div class="d-flex ga-2 mb-3">
            <v-chip
              v-for="p in periodOptions"
              :key="p.value"
              :color="selectedPeriod === p.value ? 'primary' : undefined"
              :variant="selectedPeriod === p.value ? 'flat' : 'tonal'"
              size="x-small"
              @click="changePeriod(p.value)"
            >
              {{ p.label }}
            </v-chip>
          </div>

          <v-card
            class="bg-cardBg pa-3 rounded-lg"
            style="border: 1px solid rgb(var(--v-theme-borderColor)); box-shadow: none"
          >
            <Line :data="chartData" :options="chartOptions" style="max-height: 200px" />
          </v-card>
        </div>

        <!-- History -->
        <div>
          <p class="text-caption text-uppercase font-weight-bold text-textSecondary mb-2">
            {{ $t('statistics.history') }}
            <span v-if="statisticsStore.exerciseHistory" class="text-textSecondary">
              ({{ statisticsStore.exerciseHistory.total }})
            </span>
          </p>

          <div
            v-if="statisticsStore.isLoadingExercise && !statisticsStore.exerciseHistory"
            class="d-flex justify-center pa-4"
          >
            <v-progress-circular indeterminate color="primary" size="24" />
          </div>

          <div
            v-else-if="!statisticsStore.exerciseHistory?.entries.length"
            class="text-center pa-4 text-textSecondary"
          >
            <p>{{ $t('statistics.noHistory') }}</p>
          </div>

          <template v-else>
            <v-card
              v-for="(entry, idx) in statisticsStore.exerciseHistory.entries"
              :key="idx"
              class="bg-cardBg pa-3 rounded-lg mb-2"
              style="
                border: 1px solid rgb(var(--v-theme-borderColor));
                box-shadow: none;
                transition: border-color 0.2s ease;
              "
              @click="toggleExpanded(idx)"
            >
              <div class="d-flex align-center justify-space-between">
                <div>
                  <p class="text-body-2 font-weight-bold">{{ formatFullDate(entry.date) }}</p>
                  <p class="text-caption text-textSecondary">
                    {{ entry.sets.length }} {{ $t('statistics.sets') }} · {{ entry.totalVolume }} kg
                    {{ $t('common.total') }}
                  </p>
                </div>
                <v-icon size="18">
                  {{ expandedEntries.has(idx) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                </v-icon>
              </div>

              <!-- Expanded set details -->
              <v-expand-transition>
                <div v-if="expandedEntries.has(idx)" class="mt-2">
                  <v-table density="compact" class="bg-transparent">
                    <thead>
                      <tr>
                        <th class="text-caption">#</th>
                        <th class="text-caption">{{ $t('statistics.weight') }}</th>
                        <th class="text-caption">{{ $t('units.reps') }}</th>
                        <th v-if="entry.sets.some(s => s.rpe)" class="text-caption">RPE</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="set in entry.sets" :key="set.setNumber">
                        <td class="text-caption">{{ set.setNumber }}</td>
                        <td class="text-caption">{{ set.weight ?? '-' }} kg</td>
                        <td class="text-caption">{{ set.reps ?? '-' }}</td>
                        <td v-if="entry.sets.some(s => s.rpe)" class="text-caption">
                          {{ set.rpe ?? '-' }}
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </div>
              </v-expand-transition>
            </v-card>

            <!-- Load More -->
            <v-btn
              v-if="hasMoreHistory"
              variant="text"
              color="primary"
              block
              size="small"
              :loading="statisticsStore.isLoadingExercise"
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
import { ref, computed, watch } from 'vue'
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
} from 'chart.js'
import { Line } from 'vue-chartjs'
import { useStatisticsStore } from '@/stores/statistics.store'
import type { Exercise } from '@/interfaces/Exercise.interface'
import type { ProgressMetric, ProgressPeriod } from '@/interfaces/Statistics.interface'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler)

const { t } = useI18n()
const statisticsStore = useStatisticsStore()

const props = defineProps<{
  exercise: Exercise | null
}>()

const dialogModel = defineModel<boolean>({ default: false })

const selectedMetric = ref<ProgressMetric>('estimated_1rm')
const selectedPeriod = ref<ProgressPeriod>('all')
const expandedEntries = ref<Set<number>>(new Set())

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8393/v1'

function getImageUrl(image: string | null | undefined): string {
  if (!image) return ''
  if (image.startsWith('http')) return image
  return `${apiUrl}/${image}`
}

const metricOptions = computed(() => [
  { value: 'estimated_1rm' as ProgressMetric, label: t('statistics.records.estimated1RM') },
  { value: 'max_weight' as ProgressMetric, label: t('statistics.records.maxWeight') },
  { value: 'total_volume' as ProgressMetric, label: t('statistics.records.volume') },
  { value: 'max_reps' as ProgressMetric, label: t('statistics.records.maxReps') },
])

const periodOptions = computed(() => [
  { value: '1m' as ProgressPeriod, label: '1M' },
  { value: '3m' as ProgressPeriod, label: '3M' },
  { value: '6m' as ProgressPeriod, label: '6M' },
  { value: '1y' as ProgressPeriod, label: '1Y' },
  { value: 'all' as ProgressPeriod, label: t('statistics.all') },
])

const hasRecords = computed(() => {
  const r = statisticsStore.exerciseRecords
  if (!r) return false
  return r.maxWeight || r.estimatedOneRepMax || r.maxVolumeSet || r.maxVolumeSession || r.maxReps
})

const recordCards = computed(() => {
  const r = statisticsStore.exerciseRecords
  if (!r) return []
  const cards: { label: string; value: string; detail?: string; date?: string }[] = []

  if (r.maxWeight) {
    cards.push({
      label: t('statistics.records.maxWeight'),
      value: `${r.maxWeight.value} kg`,
      detail: r.maxWeight.setDetails
        ? `${r.maxWeight.setDetails.weight}kg × ${r.maxWeight.setDetails.reps}`
        : undefined,
      date: formatShortDate(r.maxWeight.date),
    })
  }
  if (r.estimatedOneRepMax) {
    cards.push({
      label: t('statistics.records.estimated1RM'),
      value: `${r.estimatedOneRepMax.value} kg`,
      detail: r.estimatedOneRepMax.setDetails
        ? `${r.estimatedOneRepMax.setDetails.weight}kg × ${r.estimatedOneRepMax.setDetails.reps}`
        : undefined,
      date: formatShortDate(r.estimatedOneRepMax.date),
    })
  }
  if (r.maxVolumeSet) {
    cards.push({
      label: t('statistics.records.maxVolumeSet'),
      value: `${r.maxVolumeSet.value} kg`,
      detail: r.maxVolumeSet.setDetails
        ? `${r.maxVolumeSet.setDetails.weight}kg × ${r.maxVolumeSet.setDetails.reps}`
        : undefined,
      date: formatShortDate(r.maxVolumeSet.date),
    })
  }
  if (r.maxReps) {
    cards.push({
      label: t('statistics.records.maxReps'),
      value: `${r.maxReps.value} reps`,
      detail: r.maxReps.setDetails ? `@ ${r.maxReps.setDetails.weight}kg` : undefined,
      date: formatShortDate(r.maxReps.date),
    })
  }
  if (r.maxVolumeSession) {
    cards.push({
      label: t('statistics.records.maxVolumeSession'),
      value: `${r.maxVolumeSession.value} kg`,
      date: formatShortDate(r.maxVolumeSession.date),
    })
  }

  return cards
})

const hasMoreHistory = computed(() => {
  const h = statisticsStore.exerciseHistory
  if (!h) return false
  return h.entries.length < h.total
})

const chartData = computed(() => {
  const points = statisticsStore.exerciseProgress
  return {
    labels: points.map(p => formatShortDate(p.date)),
    datasets: [
      {
        label: metricOptions.value.find(m => m.value === selectedMetric.value)?.label ?? '',
        data: points.map(p => p.value),
        borderColor: '#ABFF1A',
        backgroundColor: 'rgba(171, 255, 26, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointBackgroundColor: '#ABFF1A',
      },
    ],
  }
})

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
      displayColors: false,
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

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function toggleExpanded(idx: number) {
  if (expandedEntries.value.has(idx)) {
    expandedEntries.value.delete(idx)
  } else {
    expandedEntries.value.add(idx)
  }
}

function changeMetric(metric: ProgressMetric) {
  selectedMetric.value = metric
  if (props.exercise) {
    statisticsStore.fetchExerciseProgress(props.exercise.id, metric, selectedPeriod.value)
  }
}

function changePeriod(period: ProgressPeriod) {
  selectedPeriod.value = period
  if (props.exercise) {
    statisticsStore.fetchExerciseProgress(props.exercise.id, selectedMetric.value, period)
  }
}

function loadMore() {
  if (props.exercise) {
    statisticsStore.loadMoreExerciseHistory(props.exercise.id)
  }
}

// Load data when dialog opens
watch(dialogModel, async open => {
  if (open && props.exercise) {
    expandedEntries.value = new Set()
    selectedMetric.value = 'estimated_1rm'
    selectedPeriod.value = 'all'
    await Promise.all([
      statisticsStore.fetchExerciseRecords(props.exercise.id),
      statisticsStore.fetchExerciseHistory(props.exercise.id),
      statisticsStore.fetchExerciseProgress(props.exercise.id, 'estimated_1rm', 'all'),
    ])
  } else {
    statisticsStore.clearExerciseData()
  }
})
</script>
