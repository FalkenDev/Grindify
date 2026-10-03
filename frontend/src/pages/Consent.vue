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
  <div class="d-flex flex-column fill-height background-background px-5 py-6">
    <div class="d-flex flex-column align-center mb-4">
      <img src="@/assets/logosvg.svg" alt="" width="56" height="56" />
      <h1 class="text-h5 font-weight-bold text-textPrimary mt-3 text-center">
        {{ $t('consent.title') }}
      </h1>
      <p class="text-body-2 text-textSecondary text-center mt-2">
        {{ isUpdate ? $t('consent.updatedSubtitle', { version: LEGAL_VERSION }) : $t('consent.subtitle') }}
      </p>
    </div>

    <v-form ref="form" @submit.prevent="submit">
      <v-checkbox
        v-model="termsAccepted"
        color="primary"
        density="compact"
        hide-details="auto"
        :rules="termsRules"
      >
        <template #label>
          <span class="text-body-2">
            {{ $t('auth.agreeToThe') }}
            <a class="text-primary" href="/terms" @click.prevent.stop="openDoc = 'terms'">{{
              $t('auth.termsAndConditions')
            }}</a>
          </span>
        </template>
      </v-checkbox>

      <v-checkbox
        v-model="privacyAccepted"
        color="primary"
        density="compact"
        hide-details="auto"
        :rules="privacyRules"
      >
        <template #label>
          <span class="text-body-2">
            {{ $t('auth.agreeToThe') }}
            <a class="text-primary" href="/privacy" @click.prevent.stop="openDoc = 'privacy'">{{
              $t('auth.privacyPolicy')
            }}</a>
          </span>
        </template>
      </v-checkbox>

      <HealthConsentCheckbox
        v-if="!authStore.hasHealthConsent"
        v-model="healthDataConsent"
        @open-privacy="openDoc = 'privacy'"
      />

      <v-btn
        block
        class="mt-6 text-white"
        color="primary"
        :disabled="isSaving"
        :loading="isSaving"
        rounded="lg"
        size="large"
        type="submit"
      >
        {{ $t('consent.continue') }}
      </v-btn>
    </v-form>

    <div class="mt-auto pt-6 d-flex flex-column align-center ga-1">
      <p class="text-caption text-textSecondary text-center">{{ $t('consent.declineHint') }}</p>
      <v-btn variant="text" color="textSecondary" :disabled="isSaving" @click="authStore.logout()">
        {{ $t('settings.logout') }}
      </v-btn>
      <v-btn variant="text" color="error" :disabled="isSaving" @click="isDeleteDialogOpen = true">
        {{ $t('settings.deleteAccount') }}
      </v-btn>
    </div>

    <LegalDialog
      :model-value="openDoc !== null"
      :doc="openDoc ?? 'privacy'"
      @update:model-value="openDoc = null"
    />

    <v-dialog v-model="isDeleteDialogOpen" max-width="360">
      <v-card
        class="bg-cardBg rounded-lg"
        :style="{ border: '1px solid rgb(var(--v-theme-borderColor))' }"
      >
        <v-card-title class="text-h6 pt-5 px-5">
          {{ $t('settings.deleteAccountConfirmTitle') }}
        </v-card-title>
        <v-card-text class="text-textSecondary px-5">
          {{ $t('settings.deleteAccountConfirmText') }}
        </v-card-text>
        <v-card-actions class="px-5 pb-5">
          <v-spacer />
          <v-btn variant="text" :disabled="isDeleting" @click="isDeleteDialogOpen = false">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            :disabled="isDeleting"
            :loading="isDeleting"
            @click="confirmDeleteAccount"
          >
            {{ $t('settings.deleteAccount') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vuetify-sonner'
import { useI18n } from 'vue-i18n'
import type { VForm } from 'vuetify/components'
import { useAuthStore } from '@/stores/auth.store'
import { deleteUser } from '@/services/user.service'
import { safeRedirectPath } from '@/utils/safeRedirect'
import { LEGAL_VERSION } from '@/config/legal'
import LegalDialog from '@/components/legal/LegalDialog.vue'
import HealthConsentCheckbox from '@/components/legal/HealthConsentCheckbox.vue'
import type { LegalDocumentType } from '@/components/legal/LegalDocument.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n({ useScope: 'global' })

const form = ref<VForm | null>(null)
const termsAccepted = ref(false)
const privacyAccepted = ref(false)
const healthDataConsent = ref(false)
const isSaving = ref(false)
const openDoc = ref<LegalDocumentType | null>(null)
const isDeleteDialogOpen = ref(false)
const isDeleting = ref(false)

// Existing user who accepted an older version (vs. a new OAuth user who never accepted).
const isUpdate = computed(() => !!authStore.user?.termsAcceptedAt)

const termsRules = [(v: boolean) => !!v || t('auth.mustAgreeToTerms')]
const privacyRules = [(v: boolean) => !!v || t('auth.mustAgreeToPrivacy')]

const submit = async () => {
  if (!form.value || isSaving.value) return
  const { valid } = await form.value.validate()
  if (!valid) return

  isSaving.value = true
  try {
    await authStore.giveConsent(healthDataConsent.value)
    const target = safeRedirectPath(route.query.redirect)
    router.replace(target.startsWith('/consent') ? '/' : target)
  } catch (error) {
    console.error('Failed to save consent:', error)
    toast.error(t('consent.failed'), { progressBar: true, duration: 5000 })
  } finally {
    isSaving.value = false
  }
}

const confirmDeleteAccount = async () => {
  if (isDeleting.value) return
  isDeleting.value = true
  try {
    await deleteUser()
    toast.success(t('settings.accountDeleted'), { progressBar: true, duration: 2000 })
    isDeleteDialogOpen.value = false
    await authStore.logout()
  } catch {
    toast.error(t('settings.failedToDeleteAccount'), { progressBar: true, duration: 5000 })
  } finally {
    isDeleting.value = false
  }
}
</script>
