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
      :title="$t('exerciseForm.editTitle')"
      :show-menu="false"
      :show-save="true"
      class="sticky-header"
      @close="emit('close')"
      @save="saveExercise"
    />

    <v-form ref="formRef" class="mx-5 mt-2 pb-10">
      <!-- Exercise Name -->
      <v-label class="text-body-2 font-weight-bold text-textPrimary mb-1"
        >{{ $t('exerciseForm.nameLabel') }} <span class="text-error text-h6 ml-1">*</span></v-label
      >
      <v-text-field
        v-model="form.name"
        variant="outlined"
        required
        :rules="[v => !!v || $t('exerciseForm.nameRequired')]"
      />

      <!-- About / Description (optional) -->
      <v-label class="text-body-2 font-weight-bold text-textPrimary mb-2">{{
        $t('exerciseForm.aboutLabel')
      }}</v-label>
      <v-textarea
        v-model="form.description"
        variant="outlined"
        rows="5"
        auto-grow
        class="small-textarea"
      />

      <!-- Exercise Type -->
      <v-label class="text-body-2 font-weight-bold text-textPrimary mb-2">{{
        $t('exerciseForm.exerciseTypeLabel')
      }}</v-label>
      <v-chip-group v-model="form.exerciseType" selected-class="bg-primary" class="mb-2">
        <v-chip
          v-for="item in exerciseTypeItems"
          :key="item.value"
          :value="item.value"
          variant="outlined"
        >
          {{ $t(`exercise.types.${item.value}`) }}
        </v-chip>
      </v-chip-group>

      <!-- Target Muscles -->
      <FullscreenListSelect
        v-model="form.muscleGroupIds"
        :label="$t('exerciseForm.muscleGroupsLabel')"
        :items="muscleGroupItems.map(g => ({ title: g.name, value: g.id }))"
        multiple
        class="mt-6"
      />

      <!-- Primary Muscle -->
      <FullscreenListSelect
        v-model="form.primaryMuscleGroupIds"
        :label="$t('exerciseForm.primaryMuscleLabel')"
        :items="selectedMuscleGroupItems.map(g => ({ title: g.name, value: g.id }))"
        multiple
        class="mt-6"
        :disabled="form.muscleGroupIds.length === 0"
      />

      <!-- Equipment (chip input) -->
      <div class="mb-5">
        <v-label class="text-body-2 font-weight-bold text-textPrimary mb-2">{{
          $t('exerciseForm.equipmentLabel')
        }}</v-label>
        <ChipTextInput
          v-model="form.equipment"
          :placeholder="$t('exerciseForm.equipmentPlaceholder')"
        />
      </div>

      <!-- Media Upload -->
      <div class="mt-2">
        <v-label class="text-body-2 font-weight-bold text-textPrimary mb-2">{{
          $t('exerciseForm.mediaLabel')
        }}</v-label>
        <MediaUpload
          v-model="newMediaItems"
          :existing-media="exercise?.media"
          @remove-existing="removeExistingMedia"
        />
      </div>

      <!-- How to Perform (draggable list) -->
      <div class="mt-6">
        <v-label class="text-body-2 font-weight-bold text-textPrimary mb-2">{{
          $t('exerciseForm.instructionsLabel')
        }}</v-label>
        <DraggableTextList
          v-model="form.instructions"
          :placeholder="$t('exerciseForm.instructionsPlaceholder')"
          icon="mdi-numeric"
          numbered
        />
      </div>

      <!-- Pro Tips (draggable list) -->
      <div class="mt-6">
        <v-label class="text-body-2 font-weight-bold text-textPrimary mb-1">{{
          $t('exerciseForm.proTipsLabel')
        }}</v-label>
        <DraggableTextList
          v-model="form.proTips"
          :placeholder="$t('exerciseForm.proTipsPlaceholder')"
          icon="mdi-lightbulb-on-outline"
          icon-color="primary"
        />
      </div>

      <!-- Avoid These Mistakes (draggable list) -->
      <div class="mt-6">
        <v-label class="text-body-2 font-weight-bold text-textPrimary mb-1">{{
          $t('exerciseForm.mistakesLabel')
        }}</v-label>
        <DraggableTextList
          v-model="form.mistakes"
          :placeholder="$t('exerciseForm.mistakesPlaceholder')"
          icon="mdi-close"
          icon-color="error"
        />
      </div>

      <!-- Delete Button -->
      <v-btn
        color="error"
        variant="outlined"
        class="w-100 mt-3"
        size="large"
        @click="isDeleteDialogOpen = true"
      >
        {{ $t('exerciseForm.deleteTitle') }}
      </v-btn>
    </v-form>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="isDeleteDialogOpen" max-width="360">
      <v-card
        class="bg-cardBg rounded-lg"
        style="border: 1px solid rgb(var(--v-theme-borderColor))"
      >
        <v-card-title class="text-h6 pt-5 px-5">{{ $t('exerciseForm.deleteTitle') }}</v-card-title>
        <v-card-text class="text-textSecondary px-5">{{
          $t('exerciseForm.deleteConfirm')
        }}</v-card-text>
        <v-card-actions class="px-5 pb-5">
          <v-spacer />
          <v-btn variant="text" @click="isDeleteDialogOpen = false">{{
            $t('common.cancel')
          }}</v-btn>
          <v-btn color="error" variant="flat" :loading="isDeleting" @click="confirmDelete">
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { Exercise, ExerciseType } from '@/interfaces/Exercise.interface'
import type { MediaItem } from '@/components/basicUI/MediaUpload.vue'
import {
  updateExercise,
  deleteExercise,
  uploadExerciseMedia,
  deleteExerciseMedia,
} from '@/services/exercise.service'
import { useMuscleGroupStore } from '@/stores/muscleGroup.store'
import { useExerciseStore } from '@/stores/exercise.store'
import { toast } from 'vuetify-sonner'
import { useI18n } from 'vue-i18n'
import { resolveI18n, resolveI18nArray } from '@/utils/exerciseDisplay'
import { useUserLanguage } from '@/composables/useUserLanguage'

const props = defineProps<{
  exercise: Exercise
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const muscleGroupStore = useMuscleGroupStore()
const exerciseStore = useExerciseStore()
const { t } = useI18n({ useScope: 'global' })
const { lang } = useUserLanguage()

const isSaving = ref(false)
const isDeleting = ref(false)
const isDeleteDialogOpen = ref(false)
const newMediaItems = ref<MediaItem[]>([])

const exerciseTypeItems = [
  { value: 'compound' as ExerciseType },
  { value: 'isolation' as ExerciseType },
  { value: 'bodyweight' as ExerciseType },
]

const form = ref({
  name: resolveI18n(props.exercise.title, lang.value),
  description: resolveI18n(props.exercise.description, lang.value),
  exerciseType: props.exercise.exerciseType || (null as ExerciseType | null | undefined),
  muscleGroupIds: props.exercise.muscleGroups?.map(mg => mg.id) || ([] as number[]),
  primaryMuscleGroupIds: props.exercise.primaryMuscleGroups?.map(mg => mg.id) || ([] as number[]),
  equipment: props.exercise.equipment || ([] as string[]),
  instructions: resolveI18nArray(props.exercise.instructions, lang.value),
  proTips: resolveI18nArray(props.exercise.proTips, lang.value),
  mistakes: resolveI18nArray(props.exercise.mistakes, lang.value),
})

const muscleGroupItems = computed(() =>
  muscleGroupStore.muscleGroups.map(g => ({ name: t(`muscleGroups.${g.name}`), id: g.id }))
)

const selectedMuscleGroupItems = computed(() =>
  muscleGroupItems.value.filter(g => form.value.muscleGroupIds.includes(g.id))
)

// Normalize chip group deselect: v-chip-group emits undefined when deselected, but our type is ExerciseType | null
watch(
  () => form.value.exerciseType,
  v => {
    if (v === undefined) form.value.exerciseType = null
  }
)

watch(
  () => form.value.muscleGroupIds,
  ids => {
    form.value.primaryMuscleGroupIds = form.value.primaryMuscleGroupIds.filter(id =>
      ids.includes(id)
    )
  },
  { immediate: true }
)

const removeExistingMedia = async (mediaId: number) => {
  try {
    await deleteExerciseMedia(props.exercise.id, mediaId)
    await exerciseStore.setExercises(true)
    toast.success(t('exerciseForm.mediaRemoved'), { progressBar: true, duration: 1000 })
  } catch {
    toast.error(t('exerciseForm.mediaRemoveError'), { progressBar: true, duration: 1000 })
  }
}

const saveExercise = async () => {
  if (!form.value.name.trim()) {
    toast.error(t('exerciseForm.nameRequired'), { progressBar: true, duration: 1000 })
    return
  }

  isSaving.value = true
  try {
    const payload = {
      name: form.value.name.trim(),
      description: form.value.description.trim() || undefined,
      exerciseType: form.value.exerciseType || undefined,
      muscleGroupIds: form.value.muscleGroupIds,
      primaryMuscleGroupIds: form.value.primaryMuscleGroupIds.length > 0 ? form.value.primaryMuscleGroupIds : undefined,
      equipment: form.value.equipment.length > 0 ? form.value.equipment : undefined,
      instructions:
        form.value.instructions.filter(s => s.trim() !== '').length > 0
          ? form.value.instructions.filter(s => s.trim() !== '')
          : undefined,
      proTips:
        form.value.proTips.filter(s => s.trim() !== '').length > 0
          ? form.value.proTips.filter(s => s.trim() !== '')
          : undefined,
      mistakes:
        form.value.mistakes.filter(s => s.trim() !== '').length > 0
          ? form.value.mistakes.filter(s => s.trim() !== '')
          : undefined,
    }

    const response = await updateExercise(props.exercise.id, payload)

    if (response) {
      // Upload new media items
      for (const item of newMediaItems.value) {
        if (item.file) {
          try {
            await uploadExerciseMedia(props.exercise.id, item.file)
          } catch {
            toast.warning(t('exerciseForm.mediaUploadFailed'), {
              progressBar: true,
              duration: 1500,
            })
          }
        }
      }

      toast.success(t('exercise.updated'), { progressBar: true, duration: 1000 })
      await exerciseStore.setExercises(true)
      newMediaItems.value = []
      emit('saved')
      emit('close')
    } else {
      toast.error(t('exercise.failedToUpdate'), { progressBar: true, duration: 1000 })
    }
  } catch {
    toast.error(t('exercise.updateError'), { progressBar: true, duration: 1000 })
  } finally {
    isSaving.value = false
  }
}

const confirmDelete = async () => {
  isDeleting.value = true
  try {
    const response = await deleteExercise(props.exercise.id)
    if (response) {
      toast.success(t('exercise.deleted'), { progressBar: true, duration: 1000 })
      await exerciseStore.setExercises(true)
      isDeleteDialogOpen.value = false
      emit('close')
    }
  } catch {
    toast.error(t('exercise.failedToDelete'), { progressBar: true, duration: 1000 })
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
  font-size: 0.9rem; /* or 12px */
}

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
