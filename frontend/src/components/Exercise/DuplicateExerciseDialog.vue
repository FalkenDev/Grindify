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
  <v-dialog :model-value="modelValue" max-width="380" @update:model-value="emit('update:modelValue', $event)">
    <v-card class="bg-cardBg rounded-lg" style="border: 1px solid rgb(var(--v-theme-borderColor))">
      <v-card-title class="text-h6 pt-5 px-5">
        {{ $t('exercise.personalizeTitle', { name: exerciseName }) }}
      </v-card-title>
      <v-card-text class="text-textSecondary px-5">
        {{ $t('exercise.personalizeBody') }}
      </v-card-text>
      <v-card-actions class="px-5 pb-5 flex-column align-start ga-2">
        <v-btn
          color="primary"
          variant="flat"
          block
          :loading="duplicating"
          @click="duplicate(true)"
        >
          {{ $t('exercise.transferHistory') }}
        </v-btn>
        <v-btn
          variant="outlined"
          block
          :loading="duplicating"
          @click="duplicate(false)"
        >
          {{ $t('exercise.startFresh') }}
        </v-btn>
        <v-btn variant="text" block @click="emit('update:modelValue', false)">
          {{ $t('common.cancel') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { duplicateExercise } from '@/services/exercise.service'
import { useExerciseStore } from '@/stores/exercise.store'
import { toast } from 'vuetify-sonner'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  modelValue: boolean
  exerciseId: number
  exerciseName: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'duplicated'): void
}>()

const exerciseStore = useExerciseStore()
const { t } = useI18n({ useScope: 'global' })
const duplicating = ref(false)

const duplicate = async (transferStats: boolean) => {
  duplicating.value = true
  try {
    await duplicateExercise(props.exerciseId, transferStats)
    await exerciseStore.setExercises(true)
    toast.success(t('exercise.personalized'), { progressBar: true, duration: 1200 })
    emit('update:modelValue', false)
    emit('duplicated')
  } catch {
    toast.error(t('exercise.personalizeFailed'), { progressBar: true, duration: 1500 })
  } finally {
    duplicating.value = false
  }
}
</script>
