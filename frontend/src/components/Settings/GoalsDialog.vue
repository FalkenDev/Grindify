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
  <v-card class="d-flex flex-column bg-background">
    <BackHeader :title="$t('settings.goals')" @close="emit('close')" />

    <v-card-text class="pa-5 flex-grow-1 overflow-y-auto">
      <h2 class="text-h6 mb-2">
        {{ $t('settings.weeklyWorkoutGoal') }}
      </h2>
      <p class="text-body-2 text-grey-lighten-1 mb-4">
        {{ $t('settings.weeklyWorkoutGoalDescription') }}
      </p>

      <div class="mb-6">
        <v-slider
          v-model="weeklyGoal"
          :min="1"
          :max="7"
          :step="1"
          thumb-label
          color="primary"
          :disabled="isSavingGoal"
        >
          <template #append>
            <v-text-field
              v-model="weeklyGoal"
              :disabled="isSavingGoal"
              type="number"
              :min="1"
              :max="7"
              style="width: 80px"
              variant="outlined"
              density="compact"
              hide-details
            />
          </template>
        </v-slider>
        <p class="text-body-2 text-grey-lighten-1 mt-2">
          {{ $t('settings.workoutsPerWeek', { count: weeklyGoal }) }}
        </p>
      </div>

      <v-btn color="primary" block :loading="isSavingGoal" :disabled="isSavingGoal" @click="saveWeeklyGoal">
        {{ $t('common.saveChanges') }}
      </v-btn>

      <v-divider class="my-6" />

      <h2 class="text-h6 mb-2">
        {{ $t('settings.yourProgress') }}
      </h2>
      <p class="text-body-2 text-grey-lighten-1 mb-4">
        {{ $t('settings.currentStreak') }}:
        <strong>{{ streakInfo?.currentStreak || 0 }} {{ $t('settings.weeks') }}</strong>
      </p>
      <p class="text-body-2 text-grey-lighten-1 mb-4">
        {{ $t('settings.thisWeekProgress') }}: {{ streakInfo?.currentWeekWorkouts || 0 }} /
        {{ streakInfo?.weeklyWorkoutGoal || 3 }} {{ $t('settings.workouts') }}
      </p>

      <v-progress-linear
        :model-value="streakInfo?.progressPercentage || 0"
        color="success"
        height="20"
        rounded
      >
        <template #default="{ value }">
          <strong>{{ Math.ceil(value) }}%</strong>
        </template>
      </v-progress-linear>

      <v-alert
        v-if="(streakInfo?.currentWeekWorkouts || 0) >= (streakInfo?.weeklyWorkoutGoal || 3)"
        type="success"
        variant="tonal"
        class="mt-4"
      >
        {{ $t('settings.goalReachedThisWeek') }}
      </v-alert>

      <template v-if="weightTrackingEnabled && !authStore.hasHealthConsent">
        <v-divider class="my-6" />
        <HealthConsentPrompt compact :description="$t('healthConsent.weightDescription')" />
      </template>

      <template v-else-if="weightTrackingEnabled">
        <v-divider class="my-6" />

        <h2 class="text-h6 mb-2">{{ $t('weightLog.goalType') }}</h2>
        <p class="text-body-2 text-grey-lighten-1 mb-4">
          {{ $t('weightLog.goalTypeHint') }}
        </p>
        <v-select
          v-model="weightGoalType"
          :items="goalTypeItems"
          :label="$t('weightLog.goalType')"
          variant="outlined"
          clearable
          class="mb-4"
        />

        <v-text-field
          :model-value="targetWeightStr"
          :label="$t('weightLog.targetWeight')"
          :suffix="wtWeightUnit"
          type="text"
          inputmode="decimal"
          variant="outlined"
          class="mb-4"
          @update:model-value="targetWeightStr = normalizeDecimalStr($event)"
        />

        <div class="mb-4">
          <p class="text-body-2 text-grey-lighten-1 mb-2">
            {{ $t('weightLog.goalDuration') }}
            <span class="text-caption">({{ $t('common.optional') }})</span>
          </p>
          <div class="d-flex ga-2 align-start">
            <v-text-field
              v-model.number="goalDurationValue"
              type="number"
              step="1"
              min="1"
              variant="outlined"
              hide-details
              clearable
              style="flex: 1"
            />
            <v-btn-toggle
              v-model="goalDurationUnit"
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

        <v-btn color="primary" block :loading="isSavingWeightGoals" :disabled="isSavingWeightGoals" @click="saveWeightGoals">
          {{ $t('common.saveChanges') }}
        </v-btn>
      </template>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import {
  getStreakInfo,
  updateWeeklyWorkoutGoal,
  updateUserPreferences,
} from '@/services/user.service'
import type { User, StreakInfo } from '@/interfaces/User.interface'
import { toast } from 'vuetify-sonner'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'
import HealthConsentPrompt from '@/components/legal/HealthConsentPrompt.vue'
import { parseDecimalInput, normalizeDecimalStr, formatDecimalDisplay } from '@/utils/decimalInput'

const props = defineProps<{
  user: User | null
  weightTrackingEnabled: boolean
}>()

const emit = defineEmits<{
  close: []
  updated: [user: User]
}>()

const authStore = useAuthStore()
const { t } = useI18n({ useScope: 'global' })

const isSavingGoal = ref(false)
const isSavingWeightGoals = ref(false)
const weeklyGoal = ref(props.user?.weeklyWorkoutGoal ?? 3)
const streakInfo = ref<StreakInfo | null>(null)

const isImperial = computed(() => props.user?.unitScale === 'imperial')
const wtWeightUnit = computed(() => (isImperial.value ? 'lbs' : 'kg'))

function toKg(val: number) {
  return isImperial.value ? val / 2.20462 : val
}

function fromKg(val: number | undefined | null): number | null {
  if (val === undefined || val === null) return null
  return isImperial.value ? Number((val * 2.20462).toFixed(1)) : Number(Number(val).toFixed(1))
}

// Weight goal fields
const weightGoalType = ref<string | null>(props.user?.weightGoalType ?? null)
const targetWeightStr = ref<string>(formatDecimalDisplay(fromKg(props.user?.targetWeight)))

// Goal duration
const goalDurationValue = ref<number | undefined>(undefined)
const goalDurationUnit = ref<'weeks' | 'months'>('weeks')

const initDuration = (gtf: number | undefined | null) => {
  if (gtf) {
    if (gtf % 4 === 0 && gtf >= 4) {
      goalDurationValue.value = gtf / 4
      goalDurationUnit.value = 'months'
    } else {
      goalDurationValue.value = gtf
      goalDurationUnit.value = 'weeks'
    }
  } else {
    goalDurationValue.value = undefined
    goalDurationUnit.value = 'weeks'
  }
}
initDuration(props.user?.goalTimeframe)

const goalTypeItems = computed(() => [
  { title: t('weightLog.goalLose'), value: 'lose' },
  { title: t('weightLog.goalGain'), value: 'gain' },
  { title: t('weightLog.goalMaintain'), value: 'maintain' },
])

// Load streak info when the component is mounted
onMounted(async () => {
  try {
    streakInfo.value = await getStreakInfo()
  } catch (error) {
    console.error('Error loading streak info:', error)
  }
})

// Sync props back if user changes externally
watch(
  () => props.user,
  u => {
    weeklyGoal.value = u?.weeklyWorkoutGoal ?? 3
    weightGoalType.value = u?.weightGoalType ?? null
    targetWeightStr.value = formatDecimalDisplay(fromKg(u?.targetWeight))
    initDuration(u?.goalTimeframe)
  }
)

const saveWeeklyGoal = async () => {
  if (isSavingGoal.value) return
  if (weeklyGoal.value < 1 || weeklyGoal.value > 7) {
    toast.error(t('settings.invalidGoalValue'), { progressBar: true, duration: 5000 })
    return
  }

  isSavingGoal.value = true
  try {
    const updated = await updateWeeklyWorkoutGoal(weeklyGoal.value)
    emit('updated', updated)
    await authStore.refreshUser()

    // Refresh streak info
    streakInfo.value = await getStreakInfo()
    toast.success(t('settings.goalUpdated'), { progressBar: true, duration: 1000 })
  } catch (error) {
    console.error('Failed saving weekly goal:', error)
    toast.error(t('settings.failedToUpdateGoal'), { progressBar: true, duration: 5000 })
    weeklyGoal.value = props.user?.weeklyWorkoutGoal ?? 3
  } finally {
    isSavingGoal.value = false
  }
}

const saveWeightGoals = async () => {
  if (isSavingWeightGoals.value) return
  isSavingWeightGoals.value = true
  try {
    const prefs: Record<string, unknown> = {}
    prefs.weightGoalType = weightGoalType.value || null
    const parsedTargetWeight = parseDecimalInput(targetWeightStr.value)
    prefs.targetWeight =
      parsedTargetWeight > 0
        ? Number(toKg(parsedTargetWeight).toFixed(2))
        : null
    if (goalDurationValue.value && goalDurationValue.value > 0) {
      prefs.goalTimeframe =
        goalDurationUnit.value === 'months'
          ? Math.round(goalDurationValue.value * 4.333)
          : goalDurationValue.value
    } else {
      prefs.goalTimeframe = null
    }
    await updateUserPreferences(prefs)
    await authStore.refreshUser()
    emit('updated', authStore.user!)
    toast.success(t('settings.goalUpdated'), { progressBar: true, duration: 1000 })
  } catch (error) {
    console.error('Failed saving weight goals:', error)
    toast.error(t('settings.failedToUpdateGoal'), { progressBar: true, duration: 5000 })
  } finally {
    isSavingWeightGoals.value = false
  }
}
</script>
<style scoped>
:deep(.v-field) {
  background-color: rgb(var(--v-theme-cardBg)) !important;
  border-radius: 12px !important;
}

:deep(.v-field__outline__start) {
  border-radius: 6px 0 0 6px !important;
}

:deep(.v-field__outline__end) {
  border-radius: 0 6px 6px 0 !important;
}
</style>
