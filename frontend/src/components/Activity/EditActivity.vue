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
      :title="$t('activity.editActivity')"
      show-menu
      :show-save="true"
      class="sticky-header"
      @close="emit('close')"
      @save="saveActivity"
    >
      <template #menuAppend>
        <v-list>
          <v-list-item @click="isDeleteDialogOpen = true">
            <v-list-item-title class="text-error">{{
              $t('activity.deleteActivity')
            }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </template>
    </BackHeader>

    <v-form ref="formRef" class="mx-5 mt-2 pb-10">
      <!-- Name -->
      <v-label class="text-body-2 font-weight-bold text-textPrimary mb-1">
        {{ $t('activity.activityName') }} <span class="text-error text-h6 ml-1">*</span>
      </v-label>
      <v-text-field
        v-model="form.name"
        variant="outlined"
        :rules="[v => !!v || $t('common.name')]"
      />

      <!-- Description -->
      <v-label class="text-body-2 font-weight-bold text-textPrimary mb-2">
        {{ $t('activity.activityDescription') }}
      </v-label>
      <v-textarea
        v-model="form.description"
        variant="outlined"
        rows="2"
        auto-grow
        class="small-textarea"
      />

      <!-- Icon picker -->
      <v-label class="text-body-2 font-weight-bold text-textPrimary mb-2">
        {{ $t('activity.selectIcon') }}
      </v-label>
      <div class="d-flex flex-wrap ga-2 mb-5">
        <v-btn
          v-for="opt in iconOptions"
          :key="opt.value"
          :color="form.icon === opt.value ? 'primary' : 'cardBg'"
          variant="flat"
          class="rounded-lg"
          style="border-color: rgb(var(--v-theme-borderColor)); min-width: 44px; width: 44px; height: 44px; padding: 0"
          :title="opt.label"
          @click="form.icon = opt.value"
        >
          <v-icon size="20">mdi-{{ opt.value }}</v-icon>
        </v-btn>
      </div>

      <!-- Equipment -->
      <v-label class="text-body-2 font-weight-bold text-textPrimary mb-2">
        {{ $t('activity.equipment') }}
      </v-label>
      <ChipTextInput
        v-model="form.equipment"
        :placeholder="$t('activity.equipmentPlaceholder')"
        class="mb-4"
      />

      <!-- Tracking flags -->
      <v-label class="text-body-2 font-weight-bold text-textPrimary mb-2">
        {{ $t('activity.trackedMetrics') }}
      </v-label>
      <div class="d-flex flex-column">
        <v-switch
          v-model="form.trackDistance"
          :label="$t('activity.trackDistance')"
          color="primary"
          hide-details
          density="compact"
          class="mb-1"
        />
        <v-switch
          v-model="form.trackPace"
          :label="$t('activity.trackPace')"
          color="primary"
          hide-details
          density="compact"
          class="mb-1"
        />
        <v-switch
          v-model="form.trackElevation"
          :label="$t('activity.trackElevation')"
          color="primary"
          hide-details
          density="compact"
          class="mb-1"
        />
        <v-switch
          v-model="form.trackCalories"
          :label="$t('activity.trackCalories')"
          color="primary"
          hide-details
          density="compact"
        />
      </div>
    </v-form>

    <!-- Delete Confirmation -->
    <AcceptDialog
      v-model="isDeleteDialogOpen"
      :title="$t('activity.deleteActivity')"
      :description="`${$t('activity.deleteActivity')} &quot;${resolveI18n(activity.title, lang)}&quot;?`"
      @accept="deleteActivity"
      @cancel="isDeleteDialogOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useActivityStore } from '@/stores/activity.store'
import {
  updateActivity,
  deleteActivity as deleteActivityService,
} from '@/services/activity.service'
import { ActivityIcon } from '@/interfaces/Activity.interface'
import type { Activity } from '@/interfaces/Activity.interface'
import AcceptDialog from '@/components/basicUI/AcceptDialog.vue'
import { toast } from 'vuetify-sonner'
import { useI18n } from 'vue-i18n'
import { resolveI18n } from '@/utils/exerciseDisplay'
import { useUserLanguage } from '@/composables/useUserLanguage'

const props = defineProps<{ activity: Activity }>()
const emit = defineEmits<{ close: []; deleted: [] }>()
const { t } = useI18n()
const { lang } = useUserLanguage()
const activityStore = useActivityStore()
const formRef = ref()
const isSaving = ref(false)
const isDeleting = ref(false)
const isDeleteDialogOpen = ref(false)

const iconOptions = computed(() => [
  { label: t('activity.icons.running'), value: ActivityIcon.RUNNING },
  { label: t('activity.icons.walking'), value: ActivityIcon.WALKING },
  { label: t('activity.icons.cycling'), value: ActivityIcon.CYCLING },
  { label: t('activity.icons.football'), value: ActivityIcon.FOOTBALL },
  { label: t('activity.icons.swimming'), value: ActivityIcon.SWIMMING },
  { label: t('activity.icons.kayaking'), value: ActivityIcon.KAYAKING },
  { label: t('activity.icons.hiking'), value: ActivityIcon.HIKING },
  { label: t('activity.icons.yoga'), value: ActivityIcon.YOGA },
  { label: t('activity.icons.boxing'), value: ActivityIcon.BOXING },
  { label: t('activity.icons.tennis'), value: ActivityIcon.TENNIS },
  { label: t('activity.icons.basketball'), value: ActivityIcon.BASKETBALL },
  { label: t('activity.icons.volleyball'), value: ActivityIcon.VOLLEYBALL },
  { label: t('activity.icons.skiing'), value: ActivityIcon.SKIING },
  { label: t('activity.icons.skating'), value: ActivityIcon.SKATING },
  { label: t('activity.icons.rowing'), value: ActivityIcon.ROWING },
  { label: t('activity.icons.weightlifting'), value: ActivityIcon.WEIGHTLIFTING },
  { label: t('activity.icons.golf'), value: ActivityIcon.GOLF },
  { label: t('activity.icons.rugby'), value: ActivityIcon.RUGBY },
  { label: t('activity.icons.hockey'), value: ActivityIcon.HOCKEY },
  { label: t('activity.icons.dance'), value: ActivityIcon.DANCE },
  { label: t('activity.icons.other'), value: ActivityIcon.OTHER },
])


const form = ref({
  name: resolveI18n(props.activity.title, lang.value),
  description: resolveI18n(props.activity.description, lang.value),
  icon: props.activity.icon,
  equipment: props.activity.equipment ? [...props.activity.equipment] : ([] as string[]),
  trackDistance: props.activity.trackDistance,
  trackPace: props.activity.trackPace,
  trackElevation: props.activity.trackElevation,
  trackCalories: props.activity.trackCalories,
})

async function saveActivity() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  isSaving.value = true
  try {
    await updateActivity(props.activity.id, {
      name: form.value.name.trim(),
      description: form.value.description.trim() || undefined,
      icon: form.value.icon,
      equipment: form.value.equipment.length > 0 ? form.value.equipment : undefined,
      trackDistance: form.value.trackDistance,
      trackPace: form.value.trackPace,
      trackElevation: form.value.trackElevation,
      trackCalories: form.value.trackCalories,
    })
    toast.success(t('activity.updated'), { progressBar: true, duration: 1000 })
    await activityStore.fetchActivities(true)
    emit('close')
  } catch (error: unknown) {
    toast.error((error as Error).message || t('activity.failedToUpdate'), {
      progressBar: true,
      duration: 1000,
    })
  } finally {
    isSaving.value = false
  }
}

async function deleteActivity() {
  isDeleting.value = true
  try {
    await deleteActivityService(props.activity.id)
    toast.success(t('activity.deleted'), { progressBar: true, duration: 1000 })
    await activityStore.fetchActivities(true)
    emit('deleted')
    emit('close')
  } catch (error: unknown) {
    toast.error((error as Error).message || t('activity.failedToDelete'), {
      progressBar: true,
      duration: 1000,
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
