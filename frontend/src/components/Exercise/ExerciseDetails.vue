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
      background: linear-gradient(135deg, rgba(171, 255, 26, 0.15) 0%, rgba(12, 14, 18, 0) 35%);
      min-height: 100dvh;
      padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
      overscroll-behavior: none;
    "
  >
    <BackHeader :title="exerciseName" :show-menu="!hideMenu" @close="emit('close')">
      <template #menuAppend>
        <v-list
          class="bg-cardBg"
          width="130"
          style="border: 1px solid rgb(var(--v-theme-borderColor))"
        >
          <template v-if="exercise.isGlobal">
            <v-list-item @click="isDuplicateDialogOpen = true">
              <v-list-item-title>{{ $t('exercise.personalize') }}</v-list-item-title>
            </v-list-item>
          </template>
          <template v-else>
            <v-list-item @click="isEditOpen = true">
              <v-list-item-title>{{ $t('common.edit') }}</v-list-item-title>
            </v-list-item>
            <v-list-item @click="isDeleteDialogOpen = true">
              <v-list-item-title>{{ $t('common.delete') }}</v-list-item-title>
            </v-list-item>
          </template>
        </v-list>
      </template>
    </BackHeader>

    <v-avatar size="70" tile color="avatarBg" class="mx-5 mb-3 mt-4 rounded-lg">
      <v-icon color="primary" size="35">mdi-dumbbell</v-icon>
    </v-avatar>

    <div class="mx-5 d-flex flex-column ga-4">
      <!-- Title & Type -->
      <div class="pt-4">
        <p v-if="exercise.exerciseType" class="text-primary text-body-1 text-capitalize">
          {{ exercise.exerciseType }}
        </p>
        <h1 class="text-h5 font-weight-bold">{{ exerciseName }}</h1>
        <v-chip v-if="exercise.isGlobal" size="x-small" color="primary" variant="outlined" class="mt-1">
          {{ $t('exercise.global') }}
        </v-chip>
        <v-chip v-else-if="exercise.personalizedFromGlobalId" size="x-small" color="secondary" variant="outlined" class="mt-1">
          {{ $t('exercise.personalized') }}
        </v-chip>
        <v-chip v-else size="x-small" color="grey" variant="outlined" class="mt-1">
          {{ $t('exercise.myExercise') }}
        </v-chip>
      </div>

      <!-- 7-day personalization banner -->
      <v-alert
        v-if="showPersonalizedBanner"
        type="info"
        density="compact"
        closable
        class="text-body-2"
        @click:close="dismissPersonalizedBanner"
      >
        {{ $t('exercise.personalizedBanner') }}
      </v-alert>

      <!-- Primary Muscle Card -->
      <div v-if="primaryMuscleName" class="d-flex ga-3">
        <v-card
          class="w-100 text-center pa-4 rounded-lg bg-cardBg"
          style="border: 1px solid rgb(var(--v-theme-borderColor)); box-shadow: none"
        >
          <v-icon color="primary" size="24">mdi-target</v-icon>
          <h1 class="text-body-1 text-textPrimary mt-2">{{ primaryMuscleName }}</h1>
          <p class="text-textSecondary text-body-2">{{ $t('exerciseDetails.primary') }}</p>
        </v-card>
      </div>

      <!-- About -->
      <div v-if="exerciseDescription">
        <h1 class="text-h6">{{ $t('exerciseDetails.about') }}</h1>
        <p class="text-body-1 text-textSecondary mt-1">{{ exerciseDescription }}</p>
      </div>

      <!-- Target Muscles -->
      <div v-if="exercise.muscleGroups && exercise.muscleGroups.length > 0">
        <h1 class="text-h6">{{ $t('exerciseDetails.targetMuscles') }}</h1>
        <div class="d-flex ga-3 mt-2 flex-wrap">
          <v-chip
            v-for="mg in exercise.muscleGroups"
            :key="mg.id"
            :color="exercise.primaryMuscleGroups?.some(pm => pm.id === mg.id) ? 'primary' : 'textSecondary'"
            :style="
              exercise.primaryMuscleGroups?.some(pm => pm.id === mg.id)
                ? 'border: 1px solid #abff1a'
                : 'border: 1px solid rgb(var(--v-theme-borderColor))'
            "
          >
            {{ $t(`muscleGroups.${mg.name}`) }}
          </v-chip>
        </div>
      </div>

      <!-- Equipment -->
      <div v-if="exercise.equipment && exercise.equipment.length > 0">
        <h1 class="text-h6">{{ $t('exerciseDetails.equipment') }}</h1>
        <p class="text-body-1 text-textSecondary mt-1">{{ exercise.equipment.join(', ') }}</p>
      </div>

      <!-- Media -->
      <div v-if="exercise.media && exercise.media.length > 0">
        <h1 class="text-h6">{{ $t('exerciseDetails.media') }}</h1>
        <div class="d-flex ga-2 mt-2 overflow-x-auto">
          <v-card
            v-for="m in sortedMedia"
            :key="m.id"
            class="rounded-lg flex-shrink-0"
            style="
              border: 1px solid rgb(var(--v-theme-borderColor));
              box-shadow: none;
              width: 120px;
              height: 160px;
              overflow: hidden;
            "
          >
            <img
              v-if="m.type === 'image'"
              :src="getMediaUrl(m.url)"
              class="w-100 h-100"
              style="object-fit: cover"
              alt=""
            />
            <div v-else class="w-100 h-100 d-flex align-center justify-center bg-cardBg">
              <v-icon size="32" color="primary">mdi-play-circle-outline</v-icon>
            </div>
          </v-card>
        </div>
      </div>

      <!-- How to Perform -->
      <div v-if="resolvedInstructions.length > 0">
        <h1 class="text-h6">{{ $t('exerciseDetails.howToPerform') }}</h1>
        <div class="my-2 d-flex ga-4 flex-column">
          <div v-for="(step, i) in resolvedInstructions" :key="i" class="d-flex ga-2 align-center">
            <v-avatar color="avatarBg" size="24" class="text-primary text-caption">{{
              i + 1
            }}</v-avatar>
            <p class="text-body-2 text-textSecondary">{{ step }}</p>
          </div>
        </div>
      </div>

      <!-- Pro Tips -->
      <div v-if="resolvedProTips.length > 0">
        <h1 class="text-h6">{{ $t('exerciseDetails.proTips') }}</h1>
        <v-card
          class="bg-cardBg pa-3 rounded-lg my-2 py-4 d-flex flex-column ga-4"
          style="border: 1px solid rgb(var(--v-theme-borderColor)); box-shadow: none"
        >
          <div v-for="(tip, i) in resolvedProTips" :key="i" class="d-flex align-center ga-3">
            <v-icon color="primary" size="20">mdi-lightbulb-on-outline</v-icon>
            <p class="text-body-2 text-textSecondary">{{ tip }}</p>
          </div>
        </v-card>
      </div>

      <!-- Avoid These Mistakes -->
      <div v-if="resolvedMistakes.length > 0">
        <h1 class="text-h6">{{ $t('exerciseDetails.mistakes') }}</h1>
        <v-card
          class="bg-cardBg pa-3 rounded-lg my-2 py-4 d-flex flex-column ga-4"
          style="border: 1px solid rgb(var(--v-theme-borderColor)); box-shadow: none"
        >
          <div v-for="(mistake, i) in resolvedMistakes" :key="i" class="d-flex align-center ga-3">
            <v-icon color="error" size="20">mdi-close</v-icon>
            <p class="text-body-2 text-textSecondary">{{ mistake }}</p>
          </div>
        </v-card>
      </div>
    </div>
  </div>

  <!-- Edit Dialog -->
  <v-dialog v-model="isEditOpen" fullscreen>
    <EditExercise :exercise="exercise" @close="onEditClose" @saved="onEditClose" />
  </v-dialog>

  <!-- Personalize (duplicate) Dialog -->
  <DuplicateExerciseDialog
    v-model="isDuplicateDialogOpen"
    :exercise-id="exercise.id"
    :exercise-name="exerciseName"
    @duplicated="emit('close')"
  />

  <!-- Delete Confirmation Dialog -->
  <v-dialog v-model="isDeleteDialogOpen" max-width="360">
    <v-card class="bg-cardBg rounded-lg" style="border: 1px solid rgb(var(--v-theme-borderColor))">
      <v-card-title class="text-h6 pt-5 px-5">{{ $t('exerciseForm.deleteTitle') }}</v-card-title>
      <v-card-text class="text-textSecondary px-5">{{
        $t('exerciseForm.deleteConfirm')
      }}</v-card-text>
      <v-card-actions class="px-5 pb-5">
        <v-spacer />
        <v-btn variant="text" @click="isDeleteDialogOpen = false">{{ $t('common.cancel') }}</v-btn>
        <v-btn color="error" variant="flat" :loading="isDeleting" @click="confirmDelete">
          {{ $t('common.delete') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import BackHeader from '@/components/BackHeader.vue'
import DuplicateExerciseDialog from '@/components/Exercise/DuplicateExerciseDialog.vue'
import type { Exercise } from '@/interfaces/Exercise.interface'
import { useExerciseStore } from '@/stores/exercise.store'
import { deleteExercise } from '@/services/exercise.service'
import { toast } from 'vuetify-sonner'
import { useI18n } from 'vue-i18n'
import { displayExerciseName, resolveI18n, resolveI18nArray } from '@/utils/exerciseDisplay'
import { useUserLanguage } from '@/composables/useUserLanguage'

const props = defineProps<{
  selectedExercise: Exercise | null
  isViewExercise: boolean
  hideMenu?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const exerciseStore = useExerciseStore()
const { t } = useI18n({ useScope: 'global' })
const { lang } = useUserLanguage()

const isEditOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isDuplicateDialogOpen = ref(false)
const isDeleting = ref(false)

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8393/v1'

const getMediaUrl = (url: string) => {
  if (url.startsWith('http')) return url
  const baseUrl = apiUrl.replace('/v1', '')
  return `${baseUrl}${url}`
}

// Keep exercise reactive from store
const exercise = computed(() => {
  const fromStore = exerciseStore.exercises.find(ex => ex.id === props.selectedExercise?.id)
  return fromStore || props.selectedExercise!
})

const exerciseName = computed(() => displayExerciseName(exercise.value, lang.value))
const exerciseDescription = computed(() => resolveI18n(exercise.value?.description, lang.value))
const resolvedInstructions = computed(() => resolveI18nArray(exercise.value?.instructions, lang.value))
const resolvedProTips = computed(() => resolveI18nArray(exercise.value?.proTips, lang.value))
const resolvedMistakes = computed(() => resolveI18nArray(exercise.value?.mistakes, lang.value))

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const showPersonalizedBanner = computed(() => {
  const ex = exercise.value
  if (!ex?.personalizedFromGlobalId || !ex?.personalizedAt) return false
  const dismissed = localStorage.getItem(`personalized_dismissed_${ex.id}`)
  if (dismissed) return false
  return Date.now() - new Date(ex.personalizedAt).getTime() < SEVEN_DAYS_MS
})

const dismissPersonalizedBanner = () => {
  if (exercise.value?.id) {
    localStorage.setItem(`personalized_dismissed_${exercise.value.id}`, '1')
  }
}

const primaryMuscleName = computed(() => {
  if (exercise.value?.primaryMuscleGroups?.length)
    return exercise.value.primaryMuscleGroups.map(mg => t(`muscleGroups.${mg.name}`)).join(', ')
  if (exercise.value?.muscleGroups?.length)
    return t(`muscleGroups.${exercise.value.muscleGroups[0].name}`)
  return null
})

const sortedMedia = computed(() =>
  [...(exercise.value?.media || [])].sort((a, b) => a.order - b.order)
)

const onEditClose = async () => {
  isEditOpen.value = false
  await exerciseStore.setExercises(true)
}

const confirmDelete = async () => {
  isDeleting.value = true
  try {
    const response = await deleteExercise(exercise.value.id)
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
.cursor-pointer {
  cursor: pointer;
}
</style>
