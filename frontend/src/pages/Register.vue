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
  <div class="login-page d-flex flex-column fill-height pa-0 background-background px-5 py-4">
    <v-btn
      icon
      color="textSecondary"
      variant="text"
      :aria-label="$t('auth.backToLogin')"
      @click="navigateToLogin"
    >
      <v-icon size="32">mdi-arrow-left</v-icon>
    </v-btn>
    <div class="my-3">
      <h1 class="text-h5 font-weight-bold text-textPrimary">{{ $t('auth.register') }}</h1>
      <p class="text-textSecondary">{{ $t('auth.registerSubtitle') }}</p>
    </div>

    <v-form ref="form" @submit.prevent="handleCreateAccount">
      <v-text-field
        v-model="fullName"
        autocomplete="name"
        class="mb-2"
        :label="$t('auth.fullName')"
        prepend-inner-icon="mdi-account-outline"
        required
        :rules="nameRules"
        variant="outlined"
        density="comfortable"
        hide-details="auto"
      />

      <v-text-field
        v-model="email"
        class="mb-2"
        autocomplete="email"
        :label="$t('auth.emailAddress')"
        prepend-inner-icon="mdi-email-outline"
        required
        :rules="emailRules"
        type="email"
        variant="outlined"
        density="comfortable"
        hide-details="auto"
      />

      <v-text-field
        v-model="password_new"
        :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
        class="mb-2"
        :label="$t('auth.password')"
        autocomplete="new-password"
        prepend-inner-icon="mdi-lock-outline"
        required
        :rules="passwordRules"
        :type="showPassword ? 'text' : 'password'"
        variant="outlined"
        density="comfortable"
        hide-details="auto"
        @click:append-inner="showPassword = !showPassword"
      />

      <v-text-field
        v-model="confirmPassword_new"
        :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
        class="mb-2"
        :label="$t('auth.confirmPassword')"
        autocomplete="new-password"
        prepend-inner-icon="mdi-lock-check-outline"
        required
        :rules="confirmPasswordRules"
        :type="showConfirmPassword ? 'text' : 'password'"
        variant="outlined"
        density="comfortable"
        hide-details="auto"
        @click:append-inner="showConfirmPassword = !showConfirmPassword"
      />

      <!-- Consent checkboxes -->
      <div class="mb-2">
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
              <a class="text-primary" href="/terms" @click.prevent.stop="showTermsDialog = true">{{
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
              <a class="text-primary" href="/privacy" @click.prevent.stop="showPrivacyDialog = true">{{
                $t('auth.privacyPolicy')
              }}</a>
            </span>
          </template>
        </v-checkbox>

        <HealthConsentCheckbox v-model="healthDataConsent" @open-privacy="showPrivacyDialog = true" />

      </div>

      <v-btn
        block
        class="mb-4 mt-2 text-white"
        color="primary"
        :disabled="authStore.loading"
        :loading="authStore.loading"
        rounded="lg"
        size="large"
        type="submit"
      >
        {{ $t('auth.createAccount') }}
      </v-btn>

      <p class="text-caption text-textSecondary mb-4">
        {{ $t('settings.minAgeNotice') }}
        <a class="text-primary" href="/legal" @click.prevent="showImprintDialog = true">{{
          $t('settings.imprint')
        }}</a>
      </p>

      <OAuthButtons class="mb-4" />
    </v-form>

    <div class="d-flex flex-column ga-2 mt-2 mb-4">
      <div v-for="key in benefitKeys" :key="key" class="d-flex align-center">
        <v-avatar size="20" class="mr-2" color="iconBackground">
          <v-icon color="primary" size="14">mdi-check</v-icon>
        </v-avatar>
        <span class="text-textSecondary text-body-2">{{ $t(key) }}</span>
      </div>
    </div>

    <LegalDialog v-model="showTermsDialog" doc="terms" />
    <LegalDialog v-model="showPrivacyDialog" doc="privacy" />
    <LegalDialog v-model="showImprintDialog" doc="imprint" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import type { VForm } from 'vuetify/components'
import { useI18n } from 'vue-i18n'
import LegalDialog from '@/components/legal/LegalDialog.vue'
import HealthConsentCheckbox from '@/components/legal/HealthConsentCheckbox.vue'
import OAuthButtons from '@/components/OAuthButtons.vue'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n({ useScope: 'global' })

const form = ref<VForm | null>(null)
const fullName = ref('')
const email = ref('')
const password_new = ref('')
const confirmPassword_new = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const showTermsDialog = ref(false)
const showPrivacyDialog = ref(false)
const showImprintDialog = ref(false)
const termsAccepted = ref(false)
const privacyAccepted = ref(false)
const healthDataConsent = ref(false)

// Benefits are shown below the form so the submit button stays above the fold on small screens.
const benefitKeys = ['auth.personalizedPlans', 'auth.trackYourProgress'] as const

const nameRules = [(v: string) => !!v?.trim() || t('auth.fullNameRequired')]
const emailRules = [
  (v: string) => !!v || t('auth.emailRequired'),
  (v: string) => /.+@.+\..+/.test(v) || t('auth.emailValid'),
]
const passwordRules = [
  (v: string) => !!v || t('auth.passwordRequired'),
  (v: string) => v.length >= 8 || t('auth.passwordMinLength'),
]
const confirmPasswordRules = computed(() => [
  (v: string) => !!v || t('auth.confirmPasswordRequired'),
  (v: string) => v === password_new.value || t('auth.passwordsDoNotMatch'),
])
const termsRules = [(v: boolean) => !!v || t('auth.mustAgreeToTerms')]
const privacyRules = [(v: boolean) => !!v || t('auth.mustAgreeToPrivacy')]

const handleCreateAccount = async () => {
  if (!form.value || authStore.loading) return
  const { valid } = await form.value.validate()
  if (!valid) return

  await authStore.createAccount({
    fullName: fullName.value,
    email: email.value,
    password: password_new.value,
    termsAccepted: termsAccepted.value && privacyAccepted.value,
    healthDataConsent: healthDataConsent.value,
  })
  // Navigation is handled inside authStore.createAccount
  // (verify-email page when verification is required, or auto-login to onboarding)
}

const navigateToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
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
