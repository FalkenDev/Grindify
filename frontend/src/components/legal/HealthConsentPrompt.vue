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
  <v-card
    class="bg-cardBg rounded-lg pa-5 text-center"
    :style="{ border: '1px solid rgb(var(--v-theme-borderColor))', boxShadow: 'none' }"
  >
    <v-icon v-if="!compact" size="48" color="primary" class="mb-3">mdi-shield-check-outline</v-icon>
    <h2 class="text-subtitle-1 font-weight-bold text-textPrimary mb-2">
      {{ $t('healthConsent.promptTitle') }}
    </h2>
    <p class="text-body-2 text-textSecondary mb-2">
      {{ description || $t('healthConsent.promptText') }}
    </p>
    <p class="text-caption text-textSecondary mb-4">
      {{ $t('healthConsent.promptVoluntary') }}
      <a class="text-primary" href="/privacy" @click.prevent="isPrivacyOpen = true">{{
        $t('auth.privacyPolicy')
      }}</a>
    </p>
    <v-btn
      color="primary"
      class="text-white"
      rounded="lg"
      :block="!compact"
      :loading="isSaving"
      :disabled="isSaving"
      @click="giveConsent"
    >
      {{ $t('healthConsent.promptButton') }}
    </v-btn>

    <LegalDialog v-model="isPrivacyOpen" doc="privacy" />
  </v-card>
</template>

<script setup lang="ts">
import { toast } from 'vuetify-sonner'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'
import type { User } from '@/interfaces/User.interface'
import LegalDialog from '@/components/legal/LegalDialog.vue'

/**
 * Shown in place of health-data features (weight logs, body measurements,
 * progress photos) when the user has not consented to health data processing.
 * Consent is optional – the rest of the app works without it.
 */
withDefaults(defineProps<{ description?: string; compact?: boolean }>(), {
  description: '',
  compact: false,
})
const emit = defineEmits<{ consented: [user: User] }>()

const authStore = useAuthStore()
const { t } = useI18n({ useScope: 'global' })

const isSaving = ref(false)
const isPrivacyOpen = ref(false)

const giveConsent = async () => {
  if (isSaving.value) return
  isSaving.value = true
  try {
    const user = await authStore.giveHealthConsent()
    toast.success(t('healthConsent.given'), { progressBar: true, duration: 3000 })
    emit('consented', user)
  } catch (error) {
    console.error('Failed to give health consent:', error)
    toast.error(t('healthConsent.failed'), { progressBar: true, duration: 5000 })
  } finally {
    isSaving.value = false
  }
}
</script>
