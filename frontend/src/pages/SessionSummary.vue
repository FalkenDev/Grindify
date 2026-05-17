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
  <div
    class="w-100 fill-height bg-background overflow-y-auto"
    style="
      background: linear-gradient(135deg, rgba(171, 255, 26, 0.2) 0%, rgba(12, 14, 18, 0) 40%);
      min-height: 100vh;
      padding-bottom: calc(100px + env(safe-area-inset-bottom, 0px));
    "
  >
    <!-- Top padding -->
    <div class="pt-10" />

    <!-- Icon -->
    <div class="d-flex justify-center mb-4">
      <v-avatar size="80" color="avatarBg" class="rounded-xl">
        <v-icon color="primary" size="44">mdi-trophy-outline</v-icon>
      </v-avatar>
    </div>

    <div class="mx-5 d-flex flex-column ga-5">
      <!-- Title -->
      <div class="text-center">
        <h1 class="text-h5 font-weight-bold">{{ $t('sessionSummary.title') }}</h1>
        <p class="text-body-2 text-textSecondary mt-1">{{ workoutName }}</p>
      </div>

      <!-- Stat cards row 1: Duration + Volume -->
      <div class="d-flex w-100 ga-3">
        <v-card
          class="text-center pa-4 rounded-lg bg-cardBg flex-1-1-0"
          :style="{ border: '1px solid rgb(var(--v-theme-borderColor))', boxShadow: 'none' }"
        >
          <v-icon color="primary" size="28">mdi-timer-outline</v-icon>
          <div class="text-h6 font-weight-bold text-textPrimary mt-2">{{ formattedDuration }}</div>
          <p class="text-textSecondary text-body-2">{{ $t('sessionSummary.duration') }}</p>
        </v-card>

        <v-card
          class="text-center pa-4 rounded-lg bg-cardBg flex-1-1-0"
          :style="{ border: '1px solid rgb(var(--v-theme-borderColor))', boxShadow: 'none' }"
        >
          <v-icon color="primary" size="28">mdi-weight-kilogram</v-icon>
          <div class="text-h6 font-weight-bold text-textPrimary mt-2">
            {{ totalVolume.toLocaleString() }}
          </div>
          <p class="text-textSecondary text-body-2">{{ $t('sessionSummary.totalVolume') }}</p>
        </v-card>
      </div>

      <!-- Stat cards row 2: Exercises + Sets -->
      <div class="d-flex w-100 ga-3">
        <v-card
          class="text-center pa-4 rounded-lg bg-cardBg flex-1-1-0"
          :style="{ border: '1px solid rgb(var(--v-theme-borderColor))', boxShadow: 'none' }"
        >
          <v-icon color="primary" size="28">mdi-dumbbell</v-icon>
          <div class="text-h6 font-weight-bold text-textPrimary mt-2">{{ exerciseCount }}</div>
          <p class="text-textSecondary text-body-2">{{ $t('sessionSummary.exercises') }}</p>
        </v-card>

        <v-card
          class="text-center pa-4 rounded-lg bg-cardBg flex-1-1-0"
          :style="{ border: '1px solid rgb(var(--v-theme-borderColor))', boxShadow: 'none' }"
        >
          <v-icon color="primary" size="28">mdi-check-circle-outline</v-icon>
          <div class="text-h6 font-weight-bold text-textPrimary mt-2">{{ totalSets }}</div>
          <p class="text-textSecondary text-body-2">{{ $t('sessionSummary.sets') }}</p>
        </v-card>
      </div>

      <!-- New PRs -->
      <div v-if="newRecords.length" class="d-flex flex-column ga-2">
        <h2 class="text-h6 font-weight-bold">{{ $t('sessionSummary.newPRs') }}</h2>
        <v-card
          v-for="(record, i) in newRecords"
          :key="i"
          class="pa-3 rounded-lg"
          style="
            border: 1px solid rgba(171, 255, 26, 0.4);
            box-shadow: none;
            background: rgba(171, 255, 26, 0.08);
          "
        >
          <div class="d-flex align-center ga-3">
            <v-icon color="primary" size="22">mdi-trophy</v-icon>
            <div>
              <p class="text-body-2 font-weight-bold text-primary">
                {{ $t('sessionSummary.newRecord') }}
              </p>
              <p class="text-body-2 text-textPrimary">
                {{ record.exercise ? displayExerciseName(record.exercise, lang) : $t('statistics.exercise') }}
                —
                <span class="font-weight-bold">
                  {{ record.value }}
                  {{ record.recordType === 'max_reps' ? $t('units.reps') : $t('units.kg') }}
                </span>
              </p>
            </div>
          </div>
        </v-card>
      </div>

      <!-- Calories (optional) -->
      <div>
        <h2 class="text-h6 font-weight-bold mb-1">{{ $t('sessionSummary.caloriesTitle') }}</h2>
        <p class="text-body-2 text-textSecondary mb-3">{{ $t('sessionSummary.caloriesHint') }}</p>
        <v-text-field
          v-model.number="caloriesInput"
          type="number"
          :label="$t('sessionSummary.caloriesLabel')"
          :placeholder="$t('sessionSummary.caloriesPlaceholder')"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-fire"
          suffix="kcal"
          hide-details
          clearable
          min="0"
          inputmode="numeric"
        />
      </div>

      <!-- Done button -->
      <v-btn color="primary" size="large" block :loading="isSaving" class="mt-2" @click="done">
        {{ $t('sessionSummary.done') }}
      </v-btn>

      <!-- Save as Workout (only for empty workouts with exercises) -->
      <v-btn
        v-if="isEmptyWorkout"
        color="primary"
        variant="outlined"
        size="large"
        block
        @click="saveAsWorkoutDialog = true"
      >
        <v-icon start>mdi-content-save-outline</v-icon>
        {{ $t('workout.saveAsWorkout') }}
      </v-btn>
    </div>

    <!-- Save as Workout dialog -->
    <v-dialog v-model="saveAsWorkoutDialog" fullscreen>
      <CreateWorkout
        v-if="saveAsWorkoutDialog && workoutInitialData"
        :initial-data="workoutInitialData"
        @close="saveAsWorkoutDialog = false"
      />
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
import { useWorkoutSessionStore } from '@/stores/workoutSession.store'
import { updateWorkoutSession } from '@/services/workoutSession.service'
import router from '@/router'
import { useI18n } from 'vue-i18n'
import { toast } from 'vuetify-sonner'
import { mapSessionToWorkoutInitialData } from '@/utils/sessionToWorkout'
import CreateWorkout from '@/components/Workout/CreateWorkout.vue'
import { displayExerciseName } from '@/utils/exerciseDisplay'
import { useUserLanguage } from '@/composables/useUserLanguage'

const { t } = useI18n({ useScope: 'global' })
const { lang } = useUserLanguage()
const workoutSessionStore = useWorkoutSessionStore()

const summary = workoutSessionStore.lastCompletedSummary

// If there's no summary (direct navigation), send home
if (!summary) {
  router.replace('/')
}

const session = summary?.session
const durationSeconds = summary?.durationSeconds ?? 0

const caloriesInput = ref<number | null>(null)
const isSaving = ref(false)
const saveAsWorkoutDialog = ref(false)
const isEmptyWorkout = computed(() => session?.workout == null && (session?.exercises?.length ?? 0) > 0)
const workoutInitialData = computed(() =>
  session ? mapSessionToWorkoutInitialData(session, durationSeconds) : undefined
)

// Derived stats
const workoutName = computed(() => session?.workout?.title ?? t('sessionSummary.unknownWorkout'))

const formattedDuration = computed(() => {
  const total = durationSeconds
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

const totalVolume = computed(() => session?.totalWeight ?? 0)

const exerciseCount = computed(() => session?.exercises?.length ?? 0)

const totalSets = computed(
  () => session?.exercises?.reduce((acc, ex) => acc + (ex.sets?.length ?? 0), 0) ?? 0
)

const newRecords = computed(() => session?.newRecords ?? [])

async function done() {
  if (!session?.id) {
    router.replace('/')
    return
  }

  if (caloriesInput.value != null && caloriesInput.value > 0) {
    isSaving.value = true
    try {
      await updateWorkoutSession(session.id, { caloriesBurned: caloriesInput.value })
    } catch {
      toast.error(t('common.error'), { progressBar: true, duration: 2000 })
    } finally {
      isSaving.value = false
    }
  }

  // Clear the summary so back-navigation to this page redirects home
  workoutSessionStore.lastCompletedSummary = null
  router.replace('/')
}
</script>
