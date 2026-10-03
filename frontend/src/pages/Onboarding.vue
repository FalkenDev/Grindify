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
  <div class="onboarding-page d-flex flex-column fill-height pa-0 background-background px-5 py-8">
    <!-- Step 1: Personal Information -->
    <div v-if="currentStep === 1" class="step-content mt-8">
      <div class="mb-6">
        <h1 class="text-h4 text-textPrimary mb-2">{{ $t('onboarding.welcome') }}</h1>
        <p class="text-textSecondary">{{ $t('onboarding.personalInfoDescription') }}</p>
      </div>

      <v-form ref="personalInfoForm" @submit.prevent="nextStep">
        <div class="mb-4">
          <p class="text-body-2 text-textSecondary mb-2">{{ $t('onboarding.unitScale') }}</p>
          <v-btn-toggle
            v-model="formData.unitScale"
            mandatory
            color="primary"
            class="w-100"
            divided
          >
            <v-btn value="metric" class="flex-grow-1">
              {{ $t('onboarding.metric') }}
            </v-btn>
            <v-btn value="imperial" class="flex-grow-1">
              {{ $t('onboarding.imperial') }}
            </v-btn>
          </v-btn-toggle>
        </div>

        <!-- Body measurements are health data: optional, only with health data consent -->
        <template v-if="authStore.hasHealthConsent">
          <v-text-field
            :model-value="weightStr"
            class="mb-4"
            :label="`${$t('onboarding.weight')} (${$t('common.optional')})`"
            :suffix="formData.unitScale === 'metric' ? 'kg' : 'lbs'"
            type="text"
            inputmode="decimal"
            variant="outlined"
            hide-details
            @update:model-value="weightStr = normalizeDecimalStr($event)"
          />

          <v-text-field
            :model-value="heightStr"
            class="mb-4"
            :label="`${$t('onboarding.height')} (${$t('common.optional')})`"
            :suffix="formData.unitScale === 'metric' ? 'cm' : 'in'"
            type="text"
            inputmode="decimal"
            variant="outlined"
            hide-details
            @update:model-value="heightStr = normalizeDecimalStr($event)"
          />

          <v-text-field
            v-model="formData.dateOfBirth"
            class="mb-4"
            :label="`${$t('onboarding.dateOfBirth')} (${$t('common.optional')})`"
            :rules="dobRules"
            :max="sixteenYearsAgo"
            type="date"
            variant="outlined"
          />

          <v-select
            v-model="formData.gender"
            class="mb-6"
            :items="genderOptions"
            :label="`${$t('onboarding.gender')} (${$t('common.optional')})`"
            clearable
            variant="outlined"
          />
        </template>
        <div v-else class="mb-6">
          <HealthConsentPrompt compact :description="$t('healthConsent.onboardingDescription')" />
          <p class="text-caption text-textSecondary text-center mt-2">
            {{ $t('healthConsent.onboardingSkipHint') }}
          </p>
        </div>

        <v-btn block class="text-white" color="primary" rounded="lg" size="large" type="submit">
          {{ $t('common.next') }}
        </v-btn>
      </v-form>
    </div>

    <!-- Step 2: Goals -->
    <div v-if="currentStep === 2" class="step-content mt-8">
      <div class="mb-6">
        <h1 class="text-h4 text-textPrimary mb-2">{{ $t('onboarding.goals') }}</h1>
        <p class="text-textSecondary">{{ $t('onboarding.goalsDescription') }}</p>
      </div>

      <v-form ref="goalsForm" @submit.prevent="completeOnboarding">
        <v-select
          v-model="formData.primaryGoal"
          class="mb-4"
          :items="goalOptions"
          :label="$t('onboarding.primaryGoal')"
          :rules="[v => !!v || t('onboarding.primaryGoalRequired')]"
          variant="outlined"
        />

        <div class="mb-4">
          <label class="text-body-2 text-textSecondary mb-2 d-block">
            {{ $t('onboarding.weeklyTrainingGoal') }}
          </label>
          <v-slider
            v-model="formData.weeklyWorkoutGoal"
            :min="1"
            :max="7"
            :step="1"
            color="primary"
            thumb-label
            show-ticks
            class="mt-4"
          >
            <template #thumb-label="{ modelValue }">
              {{ modelValue }} {{ modelValue === 1 ? $t('common.day') : $t('common.days') }}
            </template>
          </v-slider>
          <p class="text-center text-caption text-textSecondary">
            {{ formData.weeklyWorkoutGoal }}
            {{ formData.weeklyWorkoutGoal === 1 ? $t('common.day') : $t('common.days') }}
            {{ $t('common.perWeek') }}
          </p>
        </div>

        <v-text-field
          v-if="authStore.hasHealthConsent"
          :model-value="targetWeightStr"
          class="mb-4"
          :label="`${$t('onboarding.targetWeight')} (${$t('common.optional')})`"
          :suffix="formData.unitScale === 'metric' ? 'kg' : 'lbs'"
          type="text"
          inputmode="decimal"
          variant="outlined"
          hide-details
          @update:model-value="targetWeightStr = normalizeDecimalStr($event)"
        />

        <div class="mb-4">
          <p class="text-body-2 text-textSecondary mb-2">
            {{ $t('onboarding.goalDuration') }}
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

        <div class="d-flex justify-space-between align-center mb-6">
          <div>
            <p class="text-body-1 text-textPrimary">{{ $t('settings.useRpe') }}</p>
            <p class="text-body-2 text-textSecondary mt-1">{{ $t('settings.useRpeHint') }}</p>
          </div>
          <v-switch v-model="formData.showRpe" color="primary" inset hide-details />
        </div>

        <v-btn
          block
          class="mb-3"
          color="textSecondary"
          variant="outlined"
          rounded="lg"
          size="large"
          @click="goBack"
        >
          {{ $t('common.back') }}
        </v-btn>

        <v-btn
          block
          class="text-white"
          color="primary"
          rounded="lg"
          size="large"
          type="submit"
          :loading="loading"
          :disabled="loading"
        >
          {{ $t('onboarding.saveAndContinue') }}
        </v-btn>
      </v-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'
import { updateUserPreferences } from '@/services/user.service'
import { createWeightLog } from '@/services/weightLog.service'
import HealthConsentPrompt from '@/components/legal/HealthConsentPrompt.vue'
import { toast } from 'vuetify-sonner'
import type { VForm } from 'vuetify/components'
import { parseDecimalInput, normalizeDecimalStr } from '@/utils/decimalInput'

const router = useRouter()
const { t } = useI18n({ useScope: 'global' })
const authStore = useAuthStore()

const currentStep = ref(1)
const loading = ref(false)
const personalInfoForm = ref<VForm | null>(null)
const goalsForm = ref<VForm | null>(null)

const formData = ref({
  unitScale: 'metric',
  weight: undefined as number | undefined,
  height: undefined as number | undefined,
  dateOfBirth: undefined as string | undefined,
  gender: undefined as string | undefined,
  primaryGoal: undefined as string | undefined,
  weeklyWorkoutGoal: 3,
  targetWeight: undefined as number | undefined,
  goalTimeframe: undefined as number | undefined,
  showRpe: true,
})

const genderOptions = computed(() => [
  { title: t('onboarding.male'), value: 'male' },
  { title: t('onboarding.female'), value: 'female' },
  { title: t('onboarding.other'), value: 'other' },
  { title: t('onboarding.preferNotToSay'), value: 'prefer_not_to_say' },
])

const goalOptions = computed(() => [
  { title: t('onboarding.buildMuscle'), value: 'build_muscle' },
  { title: t('onboarding.loseWeight'), value: 'lose_weight' },
  { title: t('onboarding.gainWeight'), value: 'gain_weight' },
  { title: t('onboarding.improveEndurance'), value: 'improve_endurance' },
  { title: t('onboarding.generalFitness'), value: 'general_fitness' },
  { title: t('onboarding.increaseStrength'), value: 'increase_strength' },
  { title: t('onboarding.noSpecificGoal'), value: 'no_specific_goal' },
])

const maxDate = new Date()
maxDate.setFullYear(maxDate.getFullYear() - 16)
const sixteenYearsAgo = maxDate.toISOString().split('T')[0]

// All health fields are optional; a date of birth, when given, must be at least 16 years ago.
const dobRules = [(v: string | null | undefined) => !v || v <= sixteenYearsAgo || t('onboarding.mustBeAtLeast16')]

// String refs for decimal fields — allow both "." and "," as decimal separator
const weightStr = ref('')
const heightStr = ref('')
const targetWeightStr = ref('')

const goalDurationValue = ref<number | undefined>(undefined)
const goalDurationUnit = ref<'weeks' | 'months'>('weeks')

// Derive goalTimeframe in weeks from goalDurationValue + goalDurationUnit
const derivedGoalTimeframeWeeks = computed(() => {
  if (!goalDurationValue.value || goalDurationValue.value <= 0) return undefined
  return goalDurationUnit.value === 'months'
    ? Math.round(goalDurationValue.value * 4.333)
    : goalDurationValue.value
})

// Auto-derive weightGoalType from primaryGoal
const derivedWeightGoalType = computed(() => {
  if (formData.value.primaryGoal === 'lose_weight') return 'lose'
  if (formData.value.primaryGoal === 'gain_weight') return 'gain'
  return undefined
})

const nextStep = async () => {
  if (currentStep.value === 1) {
    if (!personalInfoForm.value) return
    const { valid } = await personalInfoForm.value.validate()
    if (!valid) return
    currentStep.value = 2
  }
}

const goBack = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const completeOnboarding = async () => {
  if (!goalsForm.value) return
  const { valid } = await goalsForm.value.validate()
  if (!valid) return

  loading.value = true
  try {
    // Parse decimal string fields
    formData.value.weight = weightStr.value ? parseDecimalInput(weightStr.value) : undefined
    formData.value.height = heightStr.value ? parseDecimalInput(heightStr.value) : undefined
    formData.value.targetWeight = targetWeightStr.value ? parseDecimalInput(targetWeightStr.value) : undefined

    const preferences: Record<string, unknown> = {
      ...formData.value,
      onboardingCompleted: true,
    }

    // Without health data consent, body measurements are neither collected nor sent.
    const hasHealthConsent = authStore.hasHealthConsent
    if (!hasHealthConsent) {
      for (const key of ['weight', 'height', 'dateOfBirth', 'gender', 'targetWeight']) {
        delete preferences[key]
      }
    }
    // Optional fields left empty (or cleared) are not sent at all.
    for (const key of ['dateOfBirth', 'gender']) {
      if (!preferences[key]) delete preferences[key]
    }

    // Auto-enable weight tracking if the user provided their weight
    if (hasHealthConsent && formData.value.weight && formData.value.weight > 0) {
      preferences.showWeightTracking = true
    }

    // Use derived values
    if (derivedGoalTimeframeWeeks.value) {
      preferences.goalTimeframe = derivedGoalTimeframeWeeks.value
    }
    if (derivedWeightGoalType.value) {
      preferences.weightGoalType = derivedWeightGoalType.value
    }

    const updatedUser = await updateUserPreferences(preferences)

    // Update user in auth store
    if (authStore.user) {
      authStore.user = updatedUser
    }

    // Create the initial weight log entry so the first-time setup dialog is skipped
    if (hasHealthConsent && formData.value.weight && formData.value.weight > 0) {
      const weightInKg =
        formData.value.unitScale === 'imperial'
          ? formData.value.weight / 2.20462
          : formData.value.weight
      await createWeightLog({
        date: new Date().toISOString().split('T')[0],
        weight: Number(weightInKg.toFixed(2)),
      })
    }

    toast.success(t('onboarding.completed'))
    router.push('/')
  } catch (error) {
    console.error('Error completing onboarding:', error)
    toast.error(t('onboarding.errorSaving'), { progressBar: true, duration: 5000 })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
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

.step-content {
  flex: 1;
  overflow-y: auto;
}
</style>
