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
      :title="$t('sessionDetail.editExerciseSetsTitle', { name: exerciseName })"
      :show-menu="false"
      :show-save="true"
      class="sticky-header"
      @close="emit('close')"
      @save="saveSets"
    />

    <div class="mx-5 mt-4 pb-10 d-flex flex-column ga-4">
      <v-card
        v-for="(set, idx) in editableSets"
        :key="`${set.setNumber}-${idx}`"
        class="bg-cardBg rounded-lg pa-3"
        :style="{ border: '1px solid rgb(var(--v-theme-borderColor))' }"
      >
        <div class="d-flex align-center justify-space-between mb-3">
          <p class="text-body-2 font-weight-bold">#{{ set.setNumber }}</p>
          <v-btn
            v-if="editableSets.length > 1"
            icon="mdi-delete"
            variant="text"
            color="error"
            size="small"
            @click="removeSet(idx)"
          />
        </div>

        <div class="d-flex ga-3">
          <v-text-field
            :model-value="weightStrings[idx]"
            :label="$t('sessionDetail.weight')"
            type="text"
            inputmode="decimal"
            variant="outlined"
            :suffix="$t('units.kgShort')"
            @update:model-value="onWeightChange(idx, $event)"
          />
          <v-text-field
            :model-value="repsStrings[idx]"
            :label="$t('sessionDetail.reps')"
            type="text"
            inputmode="numeric"
            variant="outlined"
            @update:model-value="onRepsChange(idx, $event)"
          />
        </div>
      </v-card>

      <v-btn variant="tonal" color="primary" prepend-icon="mdi-plus" @click="addSet">
        {{ $t('sessionDetail.addSet') }}
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import BackHeader from '@/components/BackHeader.vue'
import { updateSessionExerciseSets } from '@/services/workoutSession.service'
import type { PerformedSet, WorkoutSession } from '@/interfaces/workoutSession.interface'
import { parseDecimalInput, parseIntInput, normalizeDecimalStr } from '@/utils/decimalInput'
import { toast } from 'vuetify-sonner'
import { useI18n } from 'vue-i18n'
import { displayExerciseName } from '@/utils/exerciseDisplay'
import { useUserLanguage } from '@/composables/useUserLanguage'

const props = defineProps<{
  sessionId: number
  exercise: WorkoutSession['exercises'][number]
}>()

const emit = defineEmits<{ close: []; saved: [] }>()
const { t } = useI18n()
const { lang } = useUserLanguage()

const editableSets = ref<PerformedSet[]>(
  [...(props.exercise.sets || [])].sort((a, b) => a.setNumber - b.setNumber).map(s => ({ ...s }))
)

const weightStrings = ref<string[]>(
  editableSets.value.map(s =>
    s.weight !== undefined && s.weight !== null ? String(s.weight).replace('.', ',') : ''
  )
)

const repsStrings = ref<string[]>(
  editableSets.value.map(s => (s.reps !== undefined && s.reps !== null ? String(s.reps) : ''))
)

const exerciseName = computed(
  () => props.exercise.exercise ? displayExerciseName(props.exercise.exercise, lang.value) : t('sessionList.exerciseFallback')
)

function renumberSets() {
  editableSets.value = editableSets.value.map((set, index) => ({
    ...set,
    setNumber: index + 1,
  }))
}

function addSet() {
  const last = editableSets.value[editableSets.value.length - 1]
  editableSets.value.push({
    setNumber: editableSets.value.length + 1,
    weight: last?.weight,
    reps: last?.reps,
  })
  weightStrings.value.push(last?.weight !== undefined ? String(last.weight).replace('.', ',') : '')
  repsStrings.value.push(last?.reps !== undefined ? String(last.reps) : '')
}

function removeSet(index: number) {
  editableSets.value.splice(index, 1)
  weightStrings.value.splice(index, 1)
  repsStrings.value.splice(index, 1)
  renumberSets()
}

function onWeightChange(index: number, value: string) {
  const normalized = normalizeDecimalStr(value)
  weightStrings.value[index] = normalized
  editableSets.value[index].weight = normalized ? parseDecimalInput(normalized) : undefined
}

function onRepsChange(index: number, value: string) {
  repsStrings.value[index] = value
  editableSets.value[index].reps = value ? parseIntInput(value) : undefined
}

function toOptionalDecimal(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined
  const parsed = typeof value === 'string' ? parseDecimalInput(value) : Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function toOptionalInt(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined
  const parsed = typeof value === 'string' ? parseIntInput(value) : Math.floor(Number(value))
  return Number.isFinite(parsed) ? parsed : undefined
}

async function saveSets() {
  try {
    const payload = editableSets.value.map((set, idx) => ({
      setNumber: idx + 1,
      weight: toOptionalDecimal(set.weight),
      reps: toOptionalInt(set.reps),
    }))

    await updateSessionExerciseSets(props.sessionId, props.exercise.id, payload)
    toast.success(t('sessionDetail.setsUpdated'), { progressBar: true, duration: 1000 })
    emit('saved')
    emit('close')
  } catch (error: unknown) {
    toast.error((error as Error).message || t('sessionDetail.failedToUpdateSets'), {
      progressBar: true,
      duration: 1000,
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
</style>
