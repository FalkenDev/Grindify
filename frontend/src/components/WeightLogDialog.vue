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
  <v-dialog v-model="dialogOpen" fullscreen transition="slide-y-transition" persistent>
    <v-card class="d-flex flex-column bg-background" style="height: 100dvh; overflow: hidden">
      <BackHeader :title="$t('weightLog.title')" @close="close" />

      <!-- First-time setup: no startWeight set yet -->
      <template v-if="showFirstTimeSetup">
        <v-card-text class="pa-5 flex-grow-1 d-flex flex-column ga-4">
          <div class="text-center mb-2">
            <v-icon size="64" color="primary" class="mb-3">mdi-scale-bathroom</v-icon>
            <h2 class="text-h6 text-textPrimary">{{ $t('weightLog.firstTimeTitle') }}</h2>
            <p class="text-body-2 text-textSecondary mt-2">
              {{ $t('weightLog.firstTimeDescription') }}
            </p>
          </div>

          <v-text-field
            :model-value="setupWeightStr"
            :label="$t('weightLog.currentWeight')"
            :suffix="weightUnit"
            type="text"
            inputmode="decimal"
            variant="outlined"
            :rules="[rules.required, rules.positive]"
            @update:model-value="setupWeightStr = normalizeDecimalStr($event)"
          />

          <v-text-field
            :model-value="setupTargetWeightStr"
            :label="$t('weightLog.targetWeight') + ' (' + $t('common.optional') + ')'"
            :suffix="weightUnit"
            type="text"
            inputmode="decimal"
            variant="outlined"
            @update:model-value="setupTargetWeightStr = normalizeDecimalStr($event)"
          />

          <v-select
            v-model="setupGoalType"
            :items="goalTypeItems"
            :label="$t('weightLog.goalType') + ' (' + $t('common.optional') + ')'"
            variant="outlined"
          />

          <div>
            <p class="text-body-2 text-textSecondary mb-2">
              {{ $t('weightLog.goalDuration') }}
              <span class="text-caption">({{ $t('common.optional') }})</span>
            </p>
            <div class="d-flex ga-2 align-start">
              <v-text-field
                v-model.number="setupGoalDurationValue"
                type="number"
                step="1"
                min="1"
                variant="outlined"
                hide-details
                style="flex: 1"
              />
              <v-btn-toggle
                v-model="setupGoalDurationUnit"
                mandatory
                color="primary"
                divided
                style="height: 56px"
              >
                <v-btn value="weeks" style="padding: 0 16px">{{
                  $t('weightLog.goalDurationWeeks')
                }}</v-btn>
                <v-btn value="months" style="padding: 0 16px">{{
                  $t('weightLog.goalDurationMonths')
                }}</v-btn>
              </v-btn-toggle>
            </div>
          </div>

          <v-btn
            color="primary"
            size="large"
            block
            :loading="isSavingSetup"
            :disabled="parseDecimalInput(setupWeightStr) <= 0"
            @click="saveFirstTimeSetup"
          >
            {{ $t('weightLog.startTracking') }}
          </v-btn>
        </v-card-text>
      </template>

      <!-- Main weight log view -->
      <template v-else>
        <div class="d-flex flex-column" style="flex: 1 1 0; min-height: 0; overflow: hidden">
          <!-- Tab header -->
          <v-tabs v-model="activeTab" color="primary" grow style="flex: 0 0 auto">
            <v-tab value="log">{{ $t('progressPhotos.logTab') }}</v-tab>
            <v-tab value="photos">{{ $t('progressPhotos.tab') }}</v-tab>
          </v-tabs>
          <v-divider style="flex: 0 0 auto" />

          <v-tabs-window v-model="activeTab" style="flex: 1 1 0; min-height: 0; overflow: hidden">
            <!-- Log tab -->
            <v-tabs-window-item value="log">
              <div class="pa-5">
                <!-- Stats summary cards -->
                <div class="d-flex ga-3 mb-5">
                  <v-card
                    class="flex-grow-1 bg-cardBg py-3 d-flex flex-column align-center rounded-lg"
                    style="
                      border: 1px solid rgb(var(--v-theme-borderColor));
                      box-shadow: none;
                      flex: 1;
                    "
                  >
                    <p class="text-caption text-textSecondary text-uppercase mb-1">
                      {{ $t('weightLog.current') }}
                    </p>
                    <h2 class="text-h6 text-textPrimary">
                      {{ formatWeight(stats?.currentWeight) }}
                    </h2>
                    <p class="text-caption text-textSecondary">{{ weightUnit }}</p>
                  </v-card>
                  <v-card
                    class="flex-grow-1 bg-cardBg py-3 d-flex flex-column align-center rounded-lg"
                    style="
                      border: 1px solid rgb(var(--v-theme-borderColor));
                      box-shadow: none;
                      flex: 1;
                    "
                  >
                    <p class="text-caption text-textSecondary text-uppercase mb-1">
                      {{ $t('weightLog.sinceStart') }}
                    </p>
                    <h2 class="text-h6" :class="changeColor(stats?.changeFromStart)">
                      {{ formatChange(stats?.changeFromStart) }}
                    </h2>
                    <p class="text-caption text-textSecondary">{{ weightUnit }}</p>
                  </v-card>
                  <v-card
                    class="flex-grow-1 bg-cardBg py-3 d-flex flex-column align-center rounded-lg"
                    style="
                      border: 1px solid rgb(var(--v-theme-borderColor));
                      box-shadow: none;
                      flex: 1;
                    "
                  >
                    <p class="text-caption text-textSecondary text-uppercase mb-1">
                      {{ $t('weightLog.sinceLast') }}
                    </p>
                    <h2 class="text-h6" :class="changeColor(stats?.changeFromLastLog)">
                      {{ formatChange(stats?.changeFromLastLog) }}
                    </h2>
                    <p class="text-caption text-textSecondary">{{ weightUnit }}</p>
                  </v-card>
                </div>

                <!-- Target weight indicator -->
                <v-card
                  v-if="stats?.targetWeight"
                  class="bg-cardBg pa-3 mb-5 rounded-lg d-flex align-center ga-3"
                  style="border: 1px solid rgb(var(--v-theme-borderColor)); box-shadow: none"
                >
                  <v-icon color="primary" size="20">mdi-flag-checkered</v-icon>
                  <div class="flex-grow-1">
                    <p class="text-body-2 text-textPrimary">
                      {{ $t('weightLog.targetWeight') }}: {{ formatWeight(stats.targetWeight) }}
                      {{ weightUnit }}
                    </p>
                    <p
                      v-if="stats.currentWeight && stats.targetWeight"
                      class="text-caption text-textSecondary"
                    >
                      {{ formatWeight(Math.abs(stats.currentWeight - stats.targetWeight)) }}
                      {{ weightUnit }}
                      {{ $t('weightLog.toGo') }}
                    </p>
                  </div>
                </v-card>

                <!-- Goal progress card -->
                <v-card
                  v-if="goalProgress"
                  class="bg-cardBg pa-3 mb-5 rounded-lg"
                  style="border: 1px solid rgb(var(--v-theme-borderColor)); box-shadow: none"
                >
                  <div class="d-flex align-center justify-space-between mb-3">
                    <div class="d-flex align-center ga-2">
                      <v-icon color="primary" size="18">mdi-trending-up</v-icon>
                      <p class="text-body-2 text-textPrimary">{{ $t('weightLog.idealPace') }}</p>
                    </div>
                    <v-chip size="small" :color="goalProgress.badgeColor" variant="tonal">
                      {{ $t(`weightLog.${goalProgress.badge}`) }}
                    </v-chip>
                  </div>
                  <div class="d-flex ga-4">
                    <div>
                      <p class="text-caption text-textSecondary text-uppercase mb-1">
                        {{ $t('weightLog.idealPace') }}
                      </p>
                      <p class="text-body-1 text-textPrimary">
                        {{ formatWeight(goalProgress.idealWeightKg) }} {{ weightUnit }}
                      </p>
                    </div>
                    <v-divider vertical />
                    <div>
                      <p class="text-caption text-textSecondary text-uppercase mb-1">
                        {{ $t('weightLog.goalEndDate') }}
                      </p>
                      <p class="text-body-1 text-textPrimary">
                        {{ goalProgress.goalEndDateFormatted }}
                      </p>
                    </div>
                  </div>
                </v-card>

                <!-- Chart -->
                <v-card
                  class="bg-cardBg pa-4 mb-5 rounded-lg"
                  style="border: 1px solid rgb(var(--v-theme-borderColor)); box-shadow: none"
                >
                  <h3 class="text-subtitle-1 text-textPrimary mb-3">
                    {{ $t('weightLog.progress') }}
                  </h3>
                  <div v-if="chartData && sortedLogs.length > 1" style="height: 220px">
                    <Line :data="chartData" :options="chartOptions" />
                  </div>
                  <div
                    v-else
                    class="d-flex align-center justify-center text-textSecondary"
                    style="height: 120px"
                  >
                    <p class="text-body-2">{{ $t('weightLog.needMoreData') }}</p>
                  </div>
                  <!-- Chart legend -->
                  <div v-if="chartData && sortedLogs.length > 1" class="d-flex flex-wrap ga-3 mt-3">
                    <div class="d-flex align-center ga-1">
                      <div
                        style="width: 16px; height: 3px; background: #abff1a; border-radius: 2px"
                      ></div>
                      <span class="text-caption text-textSecondary">{{
                        $t('weightLog.weight')
                      }}</span>
                    </div>
                    <div v-if="goalProgress" class="d-flex align-center ga-1">
                      <div
                        style="width: 16px; height: 2px; background: #4fc3f7; border-radius: 2px"
                      ></div>
                      <span class="text-caption text-textSecondary">{{
                        $t('weightLog.idealPace')
                      }}</span>
                    </div>
                    <div v-if="stats?.targetWeight" class="d-flex align-center ga-1">
                      <div
                        style="width: 16px; height: 2px; background: #ff6b6b; border-radius: 2px"
                      ></div>
                      <span class="text-caption text-textSecondary">{{
                        $t('weightLog.targetWeight')
                      }}</span>
                    </div>
                  </div>
                </v-card>

                <!-- History table -->
                <div class="d-flex justify-space-between align-center mb-3">
                  <h3 class="text-subtitle-1 text-textPrimary">{{ $t('weightLog.history') }}</h3>
                  <v-btn
                    color="primary"
                    size="small"
                    variant="tonal"
                    prepend-icon="mdi-plus"
                    @click="openAddDialog"
                  >
                    {{ $t('weightLog.addEntry') }}
                  </v-btn>
                </div>

                <v-card
                  v-if="sortedLogs.length === 0"
                  class="bg-cardBg pa-6 rounded-lg d-flex flex-column align-center"
                  style="border: 1px solid rgb(var(--v-theme-borderColor)); box-shadow: none"
                >
                  <v-icon size="48" color="textSecondary" class="mb-2">mdi-scale-bathroom</v-icon>
                  <p class="text-body-2 text-textSecondary">{{ $t('weightLog.noEntries') }}</p>
                </v-card>

                <div v-else class="d-flex flex-column ga-2">
                  <!-- Table header -->
                  <div
                    class="d-flex px-3 py-2"
                    style="font-size: 11px; text-transform: uppercase; color: #9e9e9e"
                  >
                    <div style="flex: 2">{{ $t('common.date') }}</div>
                    <div style="flex: 1.5; text-align: right">{{ $t('weightLog.weight') }}</div>
                    <div style="flex: 1.5; text-align: right">{{ $t('weightLog.result') }}</div>
                    <div style="flex: 1.5; text-align: right">{{ $t('common.total') }}</div>
                    <div style="width: 36px"></div>
                  </div>

                  <!-- Table rows -->
                  <v-card
                    v-for="(entry, index) in sortedLogs"
                    :key="entry.id"
                    class="bg-cardBg px-3 py-2 rounded-lg d-flex align-center"
                    style="border: 1px solid rgb(var(--v-theme-borderColor)); box-shadow: none"
                  >
                    <div style="flex: 2">
                      <p class="text-body-2 text-textPrimary">{{ formatDate(entry.date) }}</p>
                    </div>
                    <div style="flex: 1.5; text-align: right">
                      <p class="text-body-2 text-textPrimary">
                        {{ formatWeight(entry.weight) }}
                      </p>
                    </div>
                    <div style="flex: 1.5; text-align: right">
                      <p class="text-body-2" :class="changeColor(getResult(index))">
                        {{ formatChange(getResult(index)) }}
                      </p>
                    </div>
                    <div style="flex: 1.5; text-align: right">
                      <p class="text-body-2" :class="changeColor(getTotal(entry))">
                        {{ formatChange(getTotal(entry)) }}
                      </p>
                    </div>
                    <div style="width: 36px" class="d-flex justify-end">
                      <v-menu>
                        <template #activator="{ props: menuProps }">
                          <v-btn v-bind="menuProps" icon size="x-small" variant="text">
                            <v-icon size="16">mdi-dots-vertical</v-icon>
                          </v-btn>
                        </template>
                        <v-list density="compact">
                          <v-list-item @click="openEditDialog(entry)">
                            <v-list-item-title>{{ $t('common.edit') }}</v-list-item-title>
                          </v-list-item>
                          <v-list-item class="text-error" @click="confirmDelete(entry)">
                            <v-list-item-title>{{ $t('common.delete') }}</v-list-item-title>
                          </v-list-item>
                        </v-list>
                      </v-menu>
                    </div>
                  </v-card>
                </div>
              </div>
            </v-tabs-window-item>

            <!-- Photos tab -->
            <v-tabs-window-item value="photos">
              <ProgressPhotosPanel />
            </v-tabs-window-item>
          </v-tabs-window>
        </div>
      </template>
    </v-card>
  </v-dialog>

  <!-- Add / Edit weight entry dialog -->
  <v-dialog v-model="entryDialogOpen" max-width="400" persistent>
    <v-card class="bg-cardBg rounded-lg" style="border: 1px solid rgb(var(--v-theme-borderColor))">
      <v-card-title class="text-h6 pa-4">
        {{ editingEntry ? $t('weightLog.editEntry') : $t('weightLog.addEntry') }}
      </v-card-title>
      <v-card-text class="px-4 pb-0">
        <v-text-field
          v-model="entryForm.date"
          :label="$t('common.date')"
          type="date"
          variant="outlined"
          class="mb-3"
          :rules="[rules.required]"
        />
        <v-text-field
          :model-value="entryWeightStr"
          :label="$t('weightLog.weight')"
          :suffix="weightUnit"
          type="text"
          inputmode="decimal"
          variant="outlined"
          class="mb-3"
          :rules="[rules.required, rules.positive]"
          @update:model-value="entryWeightStr = normalizeDecimalStr($event)"
        />
        <v-textarea
          v-model="entryForm.notes"
          :label="$t('weightLog.notes') + ' (' + $t('common.optional') + ')'"
          variant="outlined"
          rows="2"
        />
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-btn variant="text" @click="entryDialogOpen = false">{{ $t('common.cancel') }}</v-btn>
        <v-spacer />
        <v-btn
          color="primary"
          :loading="isSavingEntry"
          :disabled="parseDecimalInput(entryWeightStr) <= 0"
          @click="saveEntry"
        >
          {{ $t('common.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Delete confirmation dialog -->
  <v-dialog v-model="deleteDialogOpen" max-width="360">
    <v-card class="bg-cardBg rounded-lg" style="border: 1px solid rgb(var(--v-theme-borderColor))">
      <v-card-title class="text-h6 pa-4">{{ $t('weightLog.deleteEntry') }}</v-card-title>
      <v-card-text class="px-4">
        <p class="text-body-2 text-textSecondary">{{ $t('weightLog.deleteConfirm') }}</p>
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-btn variant="text" @click="deleteDialogOpen = false">{{ $t('common.cancel') }}</v-btn>
        <v-spacer />
        <v-btn color="error" :loading="isDeleting" @click="doDelete">{{
          $t('common.delete')
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { parseDecimalInput, normalizeDecimalStr, formatDecimalDisplay } from '@/utils/decimalInput'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { useWeightLogStore } from '@/stores/weightLog.store'
import { useAuthStore } from '@/stores/auth.store'
import { useProgressPhotoStore } from '@/stores/progressPhoto.store'
import * as weightLogService from '@/services/weightLog.service'
import { updateUserPreferences } from '@/services/user.service'
import type { WeightLog } from '@/interfaces/WeightLog.interface'
import { toast } from 'vuetify-sonner'
import { useI18n } from 'vue-i18n'
import ProgressPhotosPanel from '@/components/ProgressPhotosPanel.vue'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler)

const { t } = useI18n({ useScope: 'global' })

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'weight-updated': []
}>()

const authStore = useAuthStore()
const weightLogStore = useWeightLogStore()
const photoStore = useProgressPhotoStore()

// Active tab
const activeTab = ref<'log' | 'photos'>('log')

const dialogOpen = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const stats = computed(() => weightLogStore.stats)
const sortedLogs = computed(() => {
  // Already sorted DESC from API — newest first
  return [...weightLogStore.weightLogs]
})

const currentUser = computed(() => authStore.user)
const isImperial = computed(() => currentUser.value?.unitScale === 'imperial')
const weightUnit = computed(() => (isImperial.value ? 'lbs' : 'kg'))

// First-time setup
const showFirstTimeSetup = computed(() => {
  return (
    currentUser.value?.showWeightTracking &&
    !currentUser.value?.startWeight &&
    !currentUser.value?.weight &&
    sortedLogs.value.length === 0
  )
})

const setupWeight = ref<number | null>(null)
const setupTargetWeight = ref<number | null>(null)

// String refs for decimal fields
const setupWeightStr = ref('')
const setupTargetWeightStr = ref('')
const entryWeightStr = ref('')
const setupGoalType = ref<string | null>(null)
const setupGoalDurationValue = ref<number | undefined>(undefined)
const setupGoalDurationUnit = ref<'weeks' | 'months'>('weeks')
const isSavingSetup = ref(false)

// Goal settings panel
const goalSettingsTargetWeight = ref<number | null>(null)
const goalSettingsGoalType = ref<string | null>(null)
const goalSettingsDurationValue = ref<number | undefined>(undefined)
const goalSettingsDurationUnit = ref<'weeks' | 'months'>('weeks')

const goalTypeItems = computed(() => [
  { title: t('weightLog.goalLose'), value: 'lose' },
  { title: t('weightLog.goalGain'), value: 'gain' },
  { title: t('weightLog.goalMaintain'), value: 'maintain' },
])

// Convert display weight to kg for storage
const toKg = (val: number) => (isImperial.value ? Number(val) / 2.20462 : Number(val))
const fromKg = (val: number) => (isImperial.value ? Number(val) * 2.20462 : Number(val))

const formatWeight = (val?: number) => {
  if (val === undefined || val === null) return '—'
  const display = fromKg(val)
  return display.toFixed(1)
}

const formatChange = (val?: number) => {
  if (val === undefined || val === null) return '—'
  const display = fromKg(val)
  const sign = display > 0 ? '+' : ''
  return `${sign}${display.toFixed(1)}`
}

const changeColor = (val?: number) => {
  if (val === undefined || val === null || val === 0) return 'text-textPrimary'
  const goalType = stats.value?.weightGoalType
  if (goalType === 'lose') return val < 0 ? 'text-success' : 'text-error'
  if (goalType === 'gain') return val > 0 ? 'text-success' : 'text-error'
  return 'text-textPrimary'
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

// Result: difference from the *next* (earlier) entry in the sorted (desc) list
const getResult = (index: number) => {
  if (index >= sortedLogs.value.length - 1) return undefined
  const current = Number(sortedLogs.value[index].weight)
  const previous = Number(sortedLogs.value[index + 1].weight)
  return Number((current - previous).toFixed(2))
}

// Total: difference from start weight
const getTotal = (entry: WeightLog) => {
  if (!stats.value?.startWeight) return undefined
  return Number((Number(entry.weight) - stats.value.startWeight).toFixed(2))
}

// Goal pace data — only valid when startWeight + targetWeight + goalTimeframe all set
const goalPaceData = computed(() => {
  const sw = stats.value?.startWeight
  const tw = stats.value?.targetWeight
  const gtf = currentUser.value?.goalTimeframe
  if (!sw || !tw || !gtf || sortedLogs.value.length === 0) return null

  const chronological = [...sortedLogs.value].reverse()
  const goalStartDate = new Date(chronological[0].date)
  goalStartDate.setHours(0, 0, 0, 0)
  const totalDays = gtf * 7
  const goalEndDate = new Date(goalStartDate)
  goalEndDate.setDate(goalStartDate.getDate() + totalDays)

  return { sw, tw, gtf, goalStartDate, goalEndDate, totalDays }
})

// Goal progress — today's ideal weight and pace badge
const goalProgress = computed(() => {
  const pace = goalPaceData.value
  if (!pace) return null

  const { sw, tw, goalStartDate, goalEndDate, totalDays } = pace
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const daysSinceStart = (today.getTime() - goalStartDate.getTime()) / (1000 * 60 * 60 * 24)
  const progress = Math.max(0, Math.min(1, daysSinceStart / totalDays))
  const idealWeightKg = sw + (tw - sw) * progress

  const current = stats.value?.currentWeight
  if (!current) return null

  const diff = current - idealWeightKg
  const goalType = stats.value?.weightGoalType

  let badge: string
  let badgeColor: string
  if (Math.abs(diff) <= 0.5) {
    badge = 'paceOnTrack'
    badgeColor = 'primary'
  } else if (goalType === 'lose') {
    badge = diff < 0 ? 'paceAhead' : 'paceBehind'
    badgeColor = diff < 0 ? 'success' : 'error'
  } else if (goalType === 'gain') {
    badge = diff > 0 ? 'paceAhead' : 'paceBehind'
    badgeColor = diff > 0 ? 'success' : 'error'
  } else {
    badge = diff > 0 ? 'paceBehind' : 'paceAhead'
    badgeColor = 'textSecondary'
  }

  const goalEndDateFormatted = goalEndDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return { idealWeightKg, badge, badgeColor, goalEndDateFormatted }
})

// Chart
const chartData = computed((): ChartData<'line'> | null => {
  if (sortedLogs.value.length < 2) return null

  const chronological = [...sortedLogs.value].reverse()
  const pace = goalPaceData.value

  interface ChartPoint {
    date: Date
    dateLabel: string
    actualWeight: number | null
  }

  const points: ChartPoint[] = chronological.map(log => ({
    date: new Date(log.date),
    dateLabel: new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    actualWeight: fromKg(Number(log.weight)),
  }))

  // Extend x-axis to goal end date so the ideal pace line shows future target
  if (pace) {
    const lastLogDate = points[points.length - 1].date
    lastLogDate.setHours(0, 0, 0, 0)
    if (pace.goalEndDate > lastLogDate) {
      points.push({
        date: new Date(pace.goalEndDate),
        dateLabel: pace.goalEndDate.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        actualWeight: null,
      })
    }
  }

  const labels = points.map(p => p.dateLabel)
  const actualWeightData = points.map(p => p.actualWeight)

  const datasets: ChartData<'line'>['datasets'] = [
    {
      label: t('weightLog.weight'),
      data: actualWeightData as number[],
      borderColor: '#abff1a',
      backgroundColor: 'rgba(171, 255, 26, 0.1)',
      fill: true,
      tension: 0.3,
      pointRadius: 4,
      pointBackgroundColor: '#abff1a',
      pointBorderColor: '#abff1a',
    },
  ]

  // Target weight flat dashed line
  if (stats.value?.targetWeight) {
    const targetVal = fromKg(stats.value.targetWeight)
    datasets.push({
      label: t('weightLog.targetWeight'),
      data: Array(labels.length).fill(targetVal),
      borderColor: '#ff6b6b',
      borderDash: [8, 4],
      pointRadius: 0,
      fill: false,
      tension: 0,
    })
  }

  // Ideal pace diagonal line
  if (pace) {
    const idealData = points.map(p => {
      const daysSinceStart =
        (p.date.getTime() - pace.goalStartDate.getTime()) / (1000 * 60 * 60 * 24)
      const progress = Math.max(0, Math.min(1, daysSinceStart / pace.totalDays))
      return fromKg(pace.sw + (pace.tw - pace.sw) * progress)
    })
    datasets.push({
      label: t('weightLog.idealPace'),
      data: idealData,
      borderColor: '#4fc3f7',
      borderDash: [6, 3],
      pointRadius: 0,
      fill: false,
      tension: 0,
    } as ChartData<'line'>['datasets'][number])
  }

  return { labels, datasets }
})

const chartOptions = computed(
  (): ChartOptions<'line'> => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' as const },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e1e1e',
        titleColor: '#fff',
        bodyColor: '#ccc',
        borderColor: 'rgb(var(--v-theme-borderColor))',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: '#9e9e9e', maxRotation: 45 },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
      y: {
        ticks: { color: '#9e9e9e' },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
    },
  })
)

// Entry dialog
const entryDialogOpen = ref(false)
const editingEntry = ref<WeightLog | null>(null)
const isSavingEntry = ref(false)
const entryForm = ref({ date: '', weight: null as number | null, notes: '' })

const rules = {
  required: (v: string | number | null) => !!v || t('weightLog.fieldRequired'),
  positive: (v: number) => (v && v > 0) || t('weightLog.mustBePositive'),
}

const openAddDialog = () => {
  editingEntry.value = null
  entryForm.value = {
    date: new Date().toISOString().split('T')[0],
    weight: null,
    notes: '',
  }
  entryWeightStr.value = ''
  entryDialogOpen.value = true
}

const openEditDialog = (entry: WeightLog) => {
  editingEntry.value = entry
  const displayWeight = Number(fromKg(Number(entry.weight)).toFixed(1))
  entryForm.value = {
    date: entry.date.split('T')[0],
    weight: displayWeight,
    notes: entry.notes || '',
  }
  entryWeightStr.value = formatDecimalDisplay(displayWeight)
  entryDialogOpen.value = true
}

const saveEntry = async () => {
  const parsedWeight = parseDecimalInput(entryWeightStr.value)
  if (parsedWeight <= 0) return
  entryForm.value.weight = parsedWeight
  isSavingEntry.value = true

  try {
    const weightInKg = Number(toKg(entryForm.value.weight).toFixed(2))

    if (editingEntry.value) {
      await weightLogService.updateWeightLog(editingEntry.value.id, {
        weight: weightInKg,
        notes: entryForm.value.notes || undefined,
      })
      toast.success(t('weightLog.entryUpdated'), { progressBar: true, duration: 1000 })
    } else {
      await weightLogService.createWeightLog({
        date: entryForm.value.date,
        weight: weightInKg,
        notes: entryForm.value.notes || undefined,
      })
      toast.success(t('weightLog.entryCreated'), { progressBar: true, duration: 1000 })
    }

    await weightLogStore.refreshAll()
    await authStore.refreshUser()
    emit('weight-updated')
    entryDialogOpen.value = false
  } catch (error) {
    console.error('Failed to save weight log:', error)
    toast.error(t('weightLog.failedToSave'), { progressBar: true, duration: 1000 })
  } finally {
    isSavingEntry.value = false
  }
}

// Delete
const deleteDialogOpen = ref(false)
const deletingEntry = ref<WeightLog | null>(null)
const isDeleting = ref(false)

const confirmDelete = (entry: WeightLog) => {
  deletingEntry.value = entry
  deleteDialogOpen.value = true
}

const doDelete = async () => {
  if (!deletingEntry.value) return
  isDeleting.value = true

  try {
    await weightLogService.deleteWeightLog(deletingEntry.value.id)
    toast.success(t('weightLog.entryDeleted'), { progressBar: true, duration: 1000 })
    await weightLogStore.refreshAll()
    await authStore.refreshUser()
    emit('weight-updated')
    deleteDialogOpen.value = false
  } catch (error) {
    console.error('Failed to delete weight log:', error)
    toast.error(t('weightLog.failedToDelete'), { progressBar: true, duration: 1000 })
  } finally {
    isDeleting.value = false
  }
}

// First-time setup save
const saveFirstTimeSetup = async () => {
  setupWeight.value = parseDecimalInput(setupWeightStr.value) || null
  setupTargetWeight.value = parseDecimalInput(setupTargetWeightStr.value) || null
  if (!setupWeight.value || setupWeight.value <= 0) return
  isSavingSetup.value = true

  try {
    const weightInKg = Number(toKg(setupWeight.value).toFixed(2))

    // Create the first weight log
    await weightLogService.createWeightLog({
      date: new Date().toISOString().split('T')[0],
      weight: weightInKg,
    })

    // Update user preferences
    const prefs: Record<string, unknown> = {}
    if (setupTargetWeight.value && setupTargetWeight.value > 0) {
      prefs.targetWeight = Number(toKg(setupTargetWeight.value).toFixed(2))
    }
    if (setupGoalType.value) {
      prefs.weightGoalType = setupGoalType.value
    }
    if (setupGoalDurationValue.value && setupGoalDurationValue.value > 0) {
      prefs.goalTimeframe =
        setupGoalDurationUnit.value === 'months'
          ? Math.round(setupGoalDurationValue.value * 4.333)
          : setupGoalDurationValue.value
    }
    if (Object.keys(prefs).length > 0) {
      await updateUserPreferences(prefs)
    }

    await weightLogStore.refreshAll()
    await authStore.refreshUser()
    emit('weight-updated')
    toast.success(t('weightLog.trackingStarted'), { progressBar: true, duration: 1000 })
  } catch (error) {
    console.error('Failed to save first-time setup:', error)
    toast.error(t('weightLog.failedToSave'), { progressBar: true, duration: 1000 })
  } finally {
    isSavingSetup.value = false
  }
}

const close = () => {
  dialogOpen.value = false
}

// Load data when dialog opens
watch(dialogOpen, async open => {
  if (open) {
    activeTab.value = 'log'
    await weightLogStore.refreshAll()
    await photoStore.fetchPhotos()

    // Populate goal settings panel from current user data
    const user = authStore.user
    if (user) {
      goalSettingsTargetWeight.value = user.targetWeight
        ? Number(fromKg(user.targetWeight).toFixed(1))
        : null
      goalSettingsGoalType.value = user.weightGoalType || null

      const gtf = user.goalTimeframe
      if (gtf) {
        // Try to display as months if evenly divisible
        if (gtf % 4 === 0 && gtf >= 4) {
          goalSettingsDurationValue.value = gtf / 4
          goalSettingsDurationUnit.value = 'months'
        } else {
          goalSettingsDurationValue.value = gtf
          goalSettingsDurationUnit.value = 'weeks'
        }
      } else {
        goalSettingsDurationValue.value = undefined
        goalSettingsDurationUnit.value = 'weeks'
      }
    }
  } else {
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')))
  }
})
</script>

<style scoped>
/* Prevent Vuetify tabs bar from growing beyond its natural height */
:deep(.v-tabs) {
  flex: 0 0 auto !important;
  height: auto !important;
}
/* Make the tabs-window fill remaining card height and allow each item to scroll */
:deep(.v-window__container) {
  height: 100%;
  min-height: 0;
}
:deep(.v-window-item) {
  height: 100%;
  overflow-y: auto;
}
</style>
