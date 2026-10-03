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
  <v-card class="d-flex flex-column bg-background">
    <BackHeader :title="$t('settings.appearance')" @close="emit('close')" />

    <v-card-text class="pa-5 d-flex flex-column ga-5">
      <div class="d-flex justify-space-between">
        <div class="w-100">
          <h1 class="text-body-1">{{ $t('settings.useRpe') }}</h1>
          <p class="text-body-2 text-grey-lighten-1 mt-2">
            {{ $t('settings.useRpeHint') }}
          </p>
        </div>

        <v-switch
          v-model="useRpe"
          color="primary"
          inset
          :loading="isSaving"
          @update:model-value="savePreferences"
        />
      </div>
      <div class="d-flex justify-space-between">
        <div class="w-100">
          <h1 class="text-body-1">{{ $t('weightLog.enableTracking') }}</h1>
          <p class="text-body-2 text-grey-lighten-1 mt-2">
            {{ $t('weightLog.enableTrackingHint') }}
          </p>
        </div>

        <v-switch
          v-model="weightTrackingEnabled"
          color="primary"
          inset
          :loading="isSaving"
          @update:model-value="savePreferences"
        />
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import { updateUser } from '@/services/user.service'
import type { User } from '@/interfaces/User.interface'
import { toast } from 'vuetify-sonner'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'

const props = defineProps<{
  user: User | null
}>()

const emit = defineEmits<{
  close: []
  updated: [user: User]
}>()

const authStore = useAuthStore()
const { t } = useI18n({ useScope: 'global' })

const isSaving = ref(false)
const useRpe = ref(props.user?.showRpe ?? true)
const weightTrackingEnabled = ref(props.user?.showWeightTracking ?? false)

watch(
  () => props.user,
  u => {
    useRpe.value = u?.showRpe ?? true
    weightTrackingEnabled.value = u?.showWeightTracking ?? false
  }
)

const savePreferences = async () => {
  if (isSaving.value) return
  isSaving.value = true
  try {
    const updated = await updateUser({
      showRpe: useRpe.value,
      showWeightTracking: weightTrackingEnabled.value,
    })
    emit('updated', updated)
    await authStore.refreshUser()
    toast.success(t('settings.preferencesSaved'), { progressBar: true, duration: 1000 })
  } catch (error) {
    console.error('Failed saving preferences:', error)
    toast.error(t('settings.failedToSavePreferences'), { progressBar: true, duration: 5000 })
    // rollback UI to last known good value
    useRpe.value = props.user?.showRpe ?? true
    weightTrackingEnabled.value = props.user?.showWeightTracking ?? false
  } finally {
    isSaving.value = false
  }
}
</script>
