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
  <div class="login-page d-flex flex-column fill-height pa-0 background-background px-5">
    <div class="d-flex flex-column justify-center align-center mt-8">
      <img src="@/assets/logosvg.svg" alt="Grindify Logo" width="80" height="80" />
      <h1 class="text-h4 font-weight-bold text-center text-textPrimary mt-3">Grindify</h1>
      <v-card-subtitle class="text-center mb-4">
        {{ $t('auth.fitnessJourneyStartsHere') }}
      </v-card-subtitle>
    </div>

    <v-form ref="form" class="flex-grow-1" @submit.prevent="handleLogin">
      <v-text-field
        v-model="email"
        class="mb-4"
        autocomplete="email"
        :label="$t('auth.emailAddress')"
        prepend-inner-icon="mdi-email-outline"
        required
        :rules="emailRules"
        type="email"
        variant="outlined"
        hide-details="auto"
      />

      <v-text-field
        v-model="password"
        :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
        class="mb-4"
        :label="$t('auth.password')"
        autocomplete="current-password"
        prepend-inner-icon="mdi-lock-outline"
        required
        :rules="passwordRules"
        :type="showPassword ? 'text' : 'password'"
        variant="outlined"
        hide-details="auto"
        @click:append-inner="showPassword = !showPassword"
      />

      <div class="d-flex justify-end">
        <v-btn
          class="mb-4 text-body"
          color="primary"
          size="small"
          variant="text"
          @click="router.push('/forgot-password')"
        >
          {{ $t('auth.forgotPassword') }}
        </v-btn>
      </div>

      <v-btn
        block
        class="mt-2 text-white"
        color="primary"
        :disabled="authStore.loading"
        :loading="authStore.loading"
        rounded="lg"
        size="large"
        type="submit"
      >
        {{ $t('auth.login') }}
      </v-btn>

      <v-btn
        block
        class="mt-3 mb-6"
        color="primary"
        rounded="lg"
        size="large"
        variant="outlined"
        @click="navigateToCreateAccount"
      >
        {{ $t('auth.createAccount') }}
      </v-btn>

      <OAuthButtons />
    </v-form>

    <div class="footer text-center mt-auto mb-4">
      <div class="d-flex justify-center align-center flex-wrap ga-1 mt-4">
        <v-btn
          variant="text"
          color="textSecondary"
          class="text-caption legal-link"
          to="/privacy"
        >
          {{ $t('settings.privacyPolicy') }}
        </v-btn>
        <span class="text-textSecondary text-caption" aria-hidden="true">·</span>
        <v-btn
          variant="text"
          color="textSecondary"
          class="text-caption legal-link"
          to="/terms"
        >
          {{ $t('settings.termsAndConditions') }}
        </v-btn>
        <span class="text-textSecondary text-caption" aria-hidden="true">·</span>
        <v-btn
          variant="text"
          color="textSecondary"
          class="text-caption legal-link"
          to="/legal"
        >
          {{ $t('settings.imprint') }}
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vuetify-sonner'
import { useAuthStore } from '@/stores/auth.store'
import type { VForm } from 'vuetify/components'
import { useI18n } from 'vue-i18n'
import OAuthButtons from '@/components/OAuthButtons.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { t } = useI18n({ useScope: 'global' })

const form = ref<VForm | null>(null)
const email = ref('')
const password = ref('')
const showPassword = ref(false)

const emailRules = [
  (v: string) => !!v || t('auth.emailRequired'),
  (v: string) => /.+@.+\..+/.test(v) || t('auth.emailValid'),
]
const passwordRules = [(v: string) => !!v || t('auth.passwordRequired')]

const handleLogin = async () => {
  if (!form.value || authStore.loading) return
  const { valid } = await form.value.validate()
  if (!valid) return

  try {
    // The store navigates on success and shows a toast on failure
    // (including 429 "too many attempts").
    await authStore.login(email.value, password.value)
  } catch {
    // Already handled in the store; keep the user on the login page.
  }
}

// OAuth failures redirect back here with ?error=<code>
const oauthErrorKeys: Record<string, string> = {
  oauth_failed: 'auth.oauthFailed',
  oauth_email_unverified: 'auth.oauthEmailUnverified',
  oauth_account_exists: 'auth.oauthAccountExists',
}

onMounted(() => {
  const error = route.query.error
  if (typeof error !== 'string') return
  toast.error(t(oauthErrorKeys[error] ?? 'auth.oauthFailed'), { duration: 5000 })
  router.replace({ query: {} })
})

const navigateToCreateAccount = () => {
  router.push('/register')
}
</script>

<style scoped>
/* WCAG 2.5.5: at least 44x44px touch target for the legal links */
.legal-link {
  min-height: 44px;
  min-width: 44px;
  text-transform: none;
  letter-spacing: normal;
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
