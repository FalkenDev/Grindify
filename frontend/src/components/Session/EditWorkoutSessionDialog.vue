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
      :title="$t('sessionDetail.editWorkoutSession')"
      :show-menu="false"
      :show-save="true"
      class="sticky-header"
      @close="emit('close')"
      @save="saveSession"
    />

    <v-form ref="formRef" class="mx-5 mt-4 pb-10 d-flex flex-column ga-4">
      <div>
        <v-label class="text-body-2 font-weight-bold text-textPrimary mb-1">
          {{ $t('sessionDetail.durationMinutes') }}
        </v-label>
        <v-text-field
          v-model="durationMinutes"
          variant="outlined"
          type="number"
          min="1"
          step="1"
          inputmode="numeric"
          suffix="min"
          :rules="[validateDuration]"
        />
      </div>

      <div>
        <v-label class="text-body-2 font-weight-bold text-textPrimary mb-1">
          {{ $t('sessionDetail.notes') }}
        </v-label>
        <v-textarea v-model="notes" variant="outlined" rows="3" auto-grow class="small-textarea" />
      </div>
    </v-form>
  </div>
</template>

<script setup lang="ts">
import BackHeader from '@/components/BackHeader.vue'
import { updateWorkoutSession } from '@/services/workoutSession.service'
import type { WorkoutSession } from '@/interfaces/workoutSession.interface'
import { toast } from 'vuetify-sonner'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ session: WorkoutSession }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const { t } = useI18n()
const formRef = ref()
const durationMinutes = ref(String(getDurationMinutes(props.session)))
const notes = ref(props.session.notes ?? '')

function getDurationMinutes(session: WorkoutSession): number {
  const startedAt = new Date(session.startedAt).getTime()
  const endedAt = session.endedAt ? new Date(session.endedAt).getTime() : Date.now()
  return Math.max(1, Math.round((endedAt - startedAt) / 60000))
}

function validateDuration(value: string) {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? true : t('common.error')
}

async function saveSession() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  const parsedDuration = Number.parseInt(durationMinutes.value, 10)

  try {
    await updateWorkoutSession(props.session.id, {
      durationMinutes: parsedDuration,
      notes: notes.value || undefined,
    })
    toast.success(t('sessionDetail.updated'), { progressBar: true, duration: 1000 })
    emit('saved')
    emit('close')
  } catch (error: unknown) {
    toast.error((error as Error).message || t('sessionDetail.failedToUpdate'), {
      progressBar: true,
      duration: 5000,
    })
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
