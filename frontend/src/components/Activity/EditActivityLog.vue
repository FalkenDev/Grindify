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
  <div class="d-flex flex-column fill-height bg-background content-scroll">
    <BackHeader
      :title="$t('activity.editSession')"
      :show-menu="false"
      :show-save="true"
      class="sticky-header"
      @close="emit('close')"
      @save="saveLog"
    />

    <v-form ref="formRef" class="mx-5 mt-4 pb-10 d-flex flex-column ga-4">
      <!-- Date -->
      <div>
        <v-label class="text-body-2 font-weight-bold text-textPrimary mb-1">
          {{ $t('activity.date') }}
        </v-label>
        <v-text-field
          v-model="form.date"
          variant="outlined"
          type="date"
          :rules="[v => !!v || $t('common.error')]"
        />
      </div>

      <!-- Duration -->
      <div>
        <v-label class="text-body-2 font-weight-bold text-textPrimary mb-1">
          {{ $t('activity.duration') }}
        </v-label>
        <v-text-field
          :model-value="durationStr"
          variant="outlined"
          type="text"
          inputmode="decimal"
          suffix="min"
          :rules="[v => parseDecimalInput(v) > 0 || $t('common.error')]"
          @update:model-value="durationStr = normalizeDecimalStr($event)"
        />
      </div>

      <!-- Distance (if tracked) -->
      <div v-if="log.activity.trackDistance">
        <v-label class="text-body-2 font-weight-bold text-textPrimary mb-1">
          {{ $t('activity.distance') }}
        </v-label>
        <v-text-field
          :model-value="distanceStr"
          variant="outlined"
          type="text"
          inputmode="decimal"
          suffix="km"
          @update:model-value="distanceStr = normalizeDecimalStr($event)"
        />
      </div>

      <!-- Elevation (if tracked) -->
      <div v-if="log.activity.trackElevation">
        <v-label class="text-body-2 font-weight-bold text-textPrimary mb-1">
          {{ $t('activity.elevationGain') }}
        </v-label>
        <v-text-field
          :model-value="elevationGainStr"
          variant="outlined"
          type="text"
          inputmode="decimal"
          suffix="m"
          @update:model-value="elevationGainStr = normalizeDecimalStr($event)"
        />
      </div>

      <!-- Calories (if tracked) -->
      <div v-if="log.activity.trackCalories">
        <v-label class="text-body-2 font-weight-bold text-textPrimary mb-1">
          {{ $t('activity.calories') }}
        </v-label>
        <v-text-field
          :model-value="caloriesStr"
          variant="outlined"
          type="text"
          inputmode="decimal"
          suffix="kcal"
          @update:model-value="caloriesStr = normalizeDecimalStr($event)"
        />
      </div>

      <!-- Notes -->
      <div>
        <v-label class="text-body-2 font-weight-bold text-textPrimary mb-1">
          {{ $t('activity.notes') }}
        </v-label>
        <v-textarea
          v-model="form.notes"
          variant="outlined"
          rows="3"
          auto-grow
          class="small-textarea"
        />
      </div>

      <!-- Delete -->
      <v-btn
        color="error"
        variant="tonal"
        class="w-100 mt-4"
        :loading="isDeleting"
        :disabled="isDeleting"
        @click="isDeleteDialogOpen = true"
      >
        {{ $t('activity.deleteActivityLog') }}
      </v-btn>
    </v-form>

    <AcceptDialog
      v-model="isDeleteDialogOpen"
      :title="$t('activity.deleteActivityLog')"
      :description="$t('activity.deleteActivityLogConfirm')"
      @accept="deleteLog"
      @cancel="isDeleteDialogOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useActivityStore } from '@/stores/activity.store'
import { updateActivityLog, deleteActivityLog } from '@/services/activityLog.service'
import type { ActivityLog } from '@/interfaces/Activity.interface'
import AcceptDialog from '@/components/basicUI/AcceptDialog.vue'
import { toast } from 'vuetify-sonner'
import { useI18n } from 'vue-i18n'
import { parseDecimalInput, normalizeDecimalStr, formatDecimalDisplay } from '@/utils/decimalInput'

const props = defineProps<{ log: ActivityLog }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const { t } = useI18n()
const activityStore = useActivityStore()
const formRef = ref()
const isSaving = ref(false)
const isDeleting = ref(false)
const isDeleteDialogOpen = ref(false)

function formatDateForInput(dateStr: string): string {
  return new Date(dateStr).toISOString().split('T')[0]
}

const form = ref({
  date: formatDateForInput(props.log.date),
  duration: props.log.duration,
  distance: props.log.distance ?? undefined,
  elevationGain: props.log.elevationGain ?? undefined,
  calories: props.log.calories ?? undefined,
  notes: props.log.notes ?? '',
})

// String refs for decimal fields
const durationStr = ref(String(props.log.duration ?? ''))
const distanceStr = ref(formatDecimalDisplay(props.log.distance ?? undefined))
const elevationGainStr = ref(formatDecimalDisplay(props.log.elevationGain ?? undefined))
const caloriesStr = ref(formatDecimalDisplay(props.log.calories ?? undefined))

async function saveLog() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  // Parse string refs to numbers before saving
  form.value.duration = parseDecimalInput(durationStr.value)
  form.value.distance = distanceStr.value ? parseDecimalInput(distanceStr.value) : undefined
  form.value.elevationGain = elevationGainStr.value ? parseDecimalInput(elevationGainStr.value) : undefined
  form.value.calories = caloriesStr.value ? parseDecimalInput(caloriesStr.value) : undefined

  isSaving.value = true
  try {
    await updateActivityLog(props.log.id, {
      date: form.value.date,
      duration: form.value.duration,
      distance: form.value.distance,
      elevationGain: form.value.elevationGain,
      calories: form.value.calories,
      notes: form.value.notes || undefined,
    })
    toast.success(t('activity.logUpdated'), { progressBar: true, duration: 1000 })
    await activityStore.fetchActivityLogs(true)
    emit('saved')
    emit('close')
  } catch (error: unknown) {
    toast.error((error as Error).message || t('activity.failedToUpdateLog'), {
      progressBar: true,
      duration: 5000,
    })
  } finally {
    isSaving.value = false
  }
}

async function deleteLog() {
  isDeleting.value = true
  try {
    await deleteActivityLog(props.log.id)
    toast.success(t('activity.logDeleted'), { progressBar: true, duration: 1000 })
    await activityStore.fetchActivityLogs(true)
    emit('saved')
    emit('close')
  } catch (error: unknown) {
    toast.error((error as Error).message || t('activity.failedToDeleteLog'), {
      progressBar: true,
      duration: 5000,
    })
  } finally {
    isDeleting.value = false
  }
}
</script>

<style scoped>
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: rgb(var(--v-theme-background));
}

.content-scroll {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.small-textarea :deep(textarea) {
  font-size: 0.9rem;
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
