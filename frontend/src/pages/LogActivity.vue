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
  <div>
    <BackHeader :title="$t('activity.logActivity')" route-to="/" />

    <div class="px-5 py-4">
      <!-- Activity cards grid -->
      <div v-if="activityStore.isLoadingActivities" class="d-flex justify-center py-10">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <div v-else-if="activityStore.activities.length === 0" class="text-center py-10">
        <v-icon size="64" color="textSecondary" class="mb-4">mdi-run-fast</v-icon>
        <p class="text-body-1 text-textSecondary">{{ $t('activity.noActivities') }}</p>
      </div>

      <div v-else class="activity-grid">
        <v-card
          v-for="activity in activityStore.activities"
          :key="activity.id"
          class="activity-card pa-4 d-flex flex-column align-center rounded-lg bg-cardBg"
          style="
            border: 1px solid rgb(var(--v-theme-borderColor));
            box-shadow: none;
            min-height: 120px;
            cursor: pointer;
          "
          @click="openLogDialog(activity)"
        >
          <v-avatar size="48" color="avatarBg" class="rounded-lg mb-2">
            <v-icon color="primary" size="28">mdi-{{ activity.icon }}</v-icon>
          </v-avatar>
          <span class="text-body-2 font-weight-medium text-center">{{ displayActivityName(activity, lang) }}</span>
          <span
            v-if="resolveI18n(activity.description, lang)"
            class="text-caption text-textSecondary text-center mt-1 activity-desc"
          >
            {{ resolveI18n(activity.description, lang) }}
          </span>
        </v-card>
      </div>

      <!-- Create new activity button -->
      <v-btn
        color="primary"
        variant="outlined"
        size="large"
        block
        class="mt-8 rounded-lg"
        prepend-icon="mdi-plus"
        @click="isCreateOpen = true"
      >
        {{ $t('activity.createActivity') }}
      </v-btn>
    </div>

    <!-- Log Activity Dialog -->
    <v-dialog v-model="isLogDialogOpen" max-width="500" :fullscreen="$vuetify.display.smAndDown">
      <v-card class="bg-background">
        <div class="d-flex justify-space-between align-center px-5 py-3 border-b-sm">
          <v-btn icon density="compact" variant="flat" color="transparent" @click="closeLogDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <h2 class="text-h6">{{ selectedActivity ? displayActivityName(selectedActivity, lang) : '' }}</h2>
          <div style="width: 40px" />
        </div>

        <div class="px-5 py-4">
          <v-form ref="formRef" @submit.prevent="handleSubmit">
            <!-- Date Picker -->
            <v-text-field
              v-model="formData.date"
              :label="$t('activity.date')"
              :rules="[rules.required]"
              type="date"
              variant="outlined"
              class="mb-4"
            />

            <!-- Duration (required) -->
            <v-text-field
              :model-value="durationStr"
              :label="$t('activity.duration')"
              :rules="[rules.required, rules.positive]"
              type="text"
              inputmode="decimal"
              suffix="min"
              variant="outlined"
              class="mb-4"
              @update:model-value="durationStr = normalizeDecimalStr($event)"
            />

            <!-- Conditional fields based on selected activity -->
            <template v-if="selectedActivity">
              <!-- Distance -->
              <v-text-field
                v-if="selectedActivity.trackDistance"
                :model-value="distanceStr"
                :label="$t('activity.distance')"
                type="text"
                inputmode="decimal"
                suffix="km"
                variant="outlined"
                class="mb-4"
                @update:model-value="distanceStr = normalizeDecimalStr($event)"
              />

              <!-- Calculated Pace (read-only) -->
              <v-text-field
                v-if="selectedActivity.trackPace && calculatedPace"
                :model-value="calculatedPace"
                :label="$t('activity.pace')"
                readonly
                suffix="/km"
                variant="outlined"
                class="mb-4"
              />

              <!-- Elevation Gain -->
              <v-text-field
                v-if="selectedActivity.trackElevation"
                :model-value="elevationGainStr"
                :label="$t('activity.elevationGain')"
                type="text"
                inputmode="decimal"
                suffix="m"
                variant="outlined"
                class="mb-4"
                @update:model-value="elevationGainStr = normalizeDecimalStr($event)"
              />

              <!-- Max Elevation -->
              <v-text-field
                v-if="selectedActivity.trackElevation"
                :model-value="maxElevationStr"
                :label="$t('activity.maxElevation')"
                type="text"
                inputmode="decimal"
                suffix="m"
                variant="outlined"
                class="mb-4"
                @update:model-value="maxElevationStr = normalizeDecimalStr($event)"
              />

              <!-- Calories -->
              <v-text-field
                v-if="selectedActivity.trackCalories"
                :model-value="caloriesStr"
                :label="$t('activity.calories')"
                type="text"
                inputmode="decimal"
                suffix="kcal"
                variant="outlined"
                class="mb-4"
                @update:model-value="caloriesStr = normalizeDecimalStr($event)"
              />
            </template>

            <!-- Notes -->
            <v-textarea
              v-model="formData.notes"
              :label="$t('activity.notes')"
              variant="outlined"
              rows="3"
              class="mb-4"
            />

            <!-- Submit Button -->
            <v-btn :loading="isSubmitting" type="submit" size="large" color="primary" block>
              {{ $t('activity.save') }}
            </v-btn>
          </v-form>
        </div>
      </v-card>
    </v-dialog>

    <!-- Create Activity Dialog (full-screen) -->
    <v-dialog v-model="isCreateOpen" fullscreen transition="dialog-bottom-transition">
      <CreateActivity @close="onCreateClose" />
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useActivityStore } from '@/stores/activity.store'
import { createActivityLog } from '@/services/activityLog.service'
import type { Activity, CreateActivityLogDto } from '@/interfaces/Activity.interface'
import CreateActivity from '@/components/Activity/CreateActivity.vue'
import { toast } from 'vuetify-sonner'
import { useI18n } from 'vue-i18n'
import { displayActivityName, resolveI18n } from '@/utils/exerciseDisplay'
import { useUserLanguage } from '@/composables/useUserLanguage'
import { parseDecimalInput, normalizeDecimalStr } from '@/utils/decimalInput'

const router = useRouter()
const route = useRoute()
const activityStore = useActivityStore()
const { t } = useI18n()
const { lang } = useUserLanguage()
const formRef = ref()

const isLogDialogOpen = ref(false)
const isCreateOpen = ref(false)
const selectedActivity = ref<Activity | null>(null)

const formData = ref<CreateActivityLogDto>({
  activityId: null as unknown as number,
  date: new Date().toISOString().split('T')[0],
  duration: null as unknown as number,
  distance: undefined,
  elevationGain: undefined,
  maxElevation: undefined,
  calories: undefined,
  notes: undefined,
  scheduledSessionId: route.query.scheduledSessionId
    ? Number(route.query.scheduledSessionId)
    : undefined,
})

const isSubmitting = ref(false)

// String refs for decimal fields
const durationStr = ref('')
const distanceStr = ref('')
const elevationGainStr = ref('')
const maxElevationStr = ref('')
const caloriesStr = ref('')

const rules = {
  required: (v: string | number | null) => !!v || t('common.fieldRequired'),
  positive: (v: number) => v > 0 || t('common.mustBePositive'),
}


function openLogDialog(activity: Activity) {
  selectedActivity.value = activity
  formData.value = {
    activityId: activity.id,
    date: new Date().toISOString().split('T')[0],
    duration: null as unknown as number,
    distance: undefined,
    elevationGain: undefined,
    maxElevation: undefined,
    calories: undefined,
    notes: undefined,
    scheduledSessionId: route.query.scheduledSessionId
      ? Number(route.query.scheduledSessionId)
      : undefined,
  }
  durationStr.value = ''
  distanceStr.value = ''
  elevationGainStr.value = ''
  maxElevationStr.value = ''
  caloriesStr.value = ''
  isLogDialogOpen.value = true
}

function closeLogDialog() {
  isLogDialogOpen.value = false
  selectedActivity.value = null
}

// Calculate pace from duration and distance string refs
const calculatedPace = computed(() => {
  const dur = parseDecimalInput(durationStr.value)
  const dist = parseDecimalInput(distanceStr.value)
  if (!dur || !dist) return null
  const paceMinutes = dur / dist
  const minutes = Math.floor(paceMinutes)
  const seconds = Math.round((paceMinutes - minutes) * 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  // Parse string refs to numbers before submitting
  formData.value.duration = parseDecimalInput(durationStr.value)
  formData.value.distance = distanceStr.value ? parseDecimalInput(distanceStr.value) : undefined
  formData.value.elevationGain = elevationGainStr.value ? parseDecimalInput(elevationGainStr.value) : undefined
  formData.value.maxElevation = maxElevationStr.value ? parseDecimalInput(maxElevationStr.value) : undefined
  formData.value.calories = caloriesStr.value ? parseDecimalInput(caloriesStr.value) : undefined

  isSubmitting.value = true
  try {
    await createActivityLog(formData.value)
    await activityStore.fetchActivityLogs(true)
    toast.success(t('activity.logCreated'), { progressBar: true, duration: 1000 })
    closeLogDialog()
    const returnTo = (route.query.returnTo as string) || '/'
    router.push(returnTo)
  } catch (error) {
    console.error('Error creating activity log:', error)
    toast.error(t('activity.failedToCreateLog'), { progressBar: true, duration: 1000 })
  } finally {
    isSubmitting.value = false
  }
}

async function onCreateClose() {
  isCreateOpen.value = false
  await activityStore.fetchActivities(true)
}

// If navigated with activityId query param, auto-open the dialog
if (route.query.activityId) {
  const preselected = activityStore.activities.find(a => a.id === Number(route.query.activityId))
  if (preselected) {
    openLogDialog(preselected)
  }
}
</script>

<style scoped>
.activity-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.activity-card {
  transition:
    transform 0.15s ease,
    border-color 0.15s ease;
}

.activity-card:hover {
  transform: translateY(-2px);
  border-color: rgb(var(--v-theme-primary)) !important;
}

.activity-desc {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.3;
}

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
</style>
