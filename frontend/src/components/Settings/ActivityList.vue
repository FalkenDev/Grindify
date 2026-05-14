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
  <div class="d-flex flex-column fill-height bg-background">
    <BackHeader
      :title="$t('settings.activities')"
      show-menu
      :loading="isLoading"
      @close="emit('close')"
    >
      <template #menuAppend>
        <v-list>
          <v-list-item @click="openCreateDialog">
            <v-list-item-title>{{ $t('activity.createActivity') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </template>
    </BackHeader>

    <div class="mx-5 mt-2 mb-4">
      <v-text-field
        v-model="searchQuery"
        variant="outlined"
        prepend-inner-icon="mdi-magnify"
        :label="$t('activity.searchActivities')"
        clearable
        hide-details
        density="compact"
      />
    </div>

    <div class="flex-grow-1 overflow-y-auto pa-0 pb-5 bg-background d-flex ga-3 flex-column">
      <v-list-item
        v-for="activity in filteredActivities"
        :key="activity.id"
        class="border-sm py-2 bg-cardBg rounded-lg mx-5"
        two-line
        @click.stop="openDetailsDialog(activity)"
      >
        <div class="d-flex justify-space-between align-center w-100">
          <div class="d-flex align-center ga-4">
            <v-avatar color="avatarBg" size="50" tile class="rounded-lg">
              <v-icon color="primary">mdi-{{ activity.icon }}</v-icon>
            </v-avatar>
            <div class="d-flex flex-column">
              <v-list-item-title class="text-body-1 font-weight-bold">
                {{ displayActivityName(activity, lang) }}
              </v-list-item-title>
              <p v-if="resolveI18n(activity.description, lang)" class="text-textSecondary text-caption">
                {{ resolveI18n(activity.description, lang) }}
              </p>
            </div>
          </div>
          <v-icon color="grey-lighten-1">mdi-chevron-right</v-icon>
        </div>
      </v-list-item>

      <div class="d-flex justify-center mt-2 mx-5">
        <v-btn
          outlined
          block
          color="cardBg"
          style="
            border: 1px solid rgb(var(--v-theme-borderColor));
            box-shadow: none;
            border-style: dashed;
          "
          class="text-primary rounded-lg"
          height="50"
          @click="openCreateDialog"
        >
          {{ $t('activity.createActivity') }}
        </v-btn>
      </div>
    </div>

    <!-- Activity Details Dialog -->
    <v-dialog v-model="isDetailsOpen" fullscreen>
      <ActivityDetails
        v-if="selectedActivity"
        :activity="selectedActivity"
        @close="isDetailsOpen = false"
      />
    </v-dialog>

    <!-- Create Activity Dialog -->
    <v-dialog v-model="isCreateOpen" fullscreen>
      <CreateActivity @close="isCreateOpen = false" />
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="isDeleteDialogOpen" max-width="400">
      <v-card
        class="bg-cardBg rounded-lg"
        style="border: 1px solid rgb(var(--v-theme-borderColor))"
      >
        <v-card-title>{{ $t('activity.deleteActivity') }}</v-card-title>
        <v-card-text>Are you sure you want to delete "{{ activityToDelete ? displayActivityName(activityToDelete, lang) : '' }}"?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="isDeleteDialogOpen = false">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn color="error" variant="flat" :loading="isDeleting" @click="deleteActivity">
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useActivityStore } from '@/stores/activity.store'
import { deleteActivity as deleteActivityService } from '@/services/activity.service'
import type { Activity } from '@/interfaces/Activity.interface'
import ActivityDetails from '@/components/Activity/ActivityDetails.vue'
import CreateActivity from '@/components/Activity/CreateActivity.vue'
import { toast } from 'vuetify-sonner'
import { useI18n } from 'vue-i18n'
import { displayActivityName, resolveI18n } from '@/utils/exerciseDisplay'
import { useUserLanguage } from '@/composables/useUserLanguage'

const { t } = useI18n()
const { lang } = useUserLanguage()
const emit = defineEmits<{ close: [] }>()
const activityStore = useActivityStore()

const isLoading = computed(() => activityStore.isLoadingActivities)
const activities = computed(() => activityStore.activities)
const searchQuery = ref('')

const filteredActivities = computed(() => {
  const q = (searchQuery.value || '').trim().toLowerCase()
  if (!q) return activities.value
  return activities.value.filter((a: Activity) => {
    const name = displayActivityName(a, lang.value).toLowerCase()
    const desc = resolveI18n(a.description, lang.value).toLowerCase()
    return name.includes(q) || desc.includes(q)
  })
})

const isDetailsOpen = ref(false)
const isCreateOpen = ref(false)
const selectedActivity = ref<Activity | null>(null)

const isDeleteDialogOpen = ref(false)
const activityToDelete = ref<Activity | null>(null)
const isDeleting = ref(false)


function openCreateDialog() {
  isCreateOpen.value = true
}

function openDetailsDialog(activity: Activity) {
  selectedActivity.value = activity
  isDetailsOpen.value = true
}

async function deleteActivity() {
  if (!activityToDelete.value) return

  isDeleting.value = true
  try {
    await deleteActivityService(activityToDelete.value.id)
    toast.success(t('activity.deleted'))
    await activityStore.fetchActivities(true)
    isDeleteDialogOpen.value = false
  } catch (error: unknown) {
    toast.error((error as Error).message || t('activity.failedToDelete'))
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
