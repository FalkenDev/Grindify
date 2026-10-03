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
  <div class="d-flex flex-column fill-height pa-0 background-background px-5">
    <div class="d-flex flex-column justify-center align-center mt-16 mb-8">
      <div
        class="bg-primary d-flex justify-center align-center rounded mb-4"
        style="width: 60px; height: 60px"
      >
        <v-icon size="38" color="black">mdi-lock-open-outline</v-icon>
      </div>
      <h1 class="text-h5 font-weight-bold text-center text-textPrimary">
        {{ $t('auth.resetPasswordTitle') }}
      </h1>
      <p class="text-center text-textSecondary mt-2">
        {{ $t('auth.resetPasswordSubtitle') }} <strong>{{ email }}</strong>
      </p>
    </div>

    <v-form ref="form" @submit.prevent="handleSubmit">
      <v-otp-input
        v-model="code"
        :length="6"
        type="number"
        variant="outlined"
        class="mb-4"
        focus-all
      />

      <v-text-field
        v-model="newPassword"
        :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
        class="mb-4"
        :label="$t('auth.newPassword')"
        autocomplete="new-password"
        prepend-inner-icon="mdi-lock-outline"
        required
        :rules="passwordRules"
        :type="showPassword ? 'text' : 'password'"
        variant="outlined"
        hide-details="auto"
        @click:append-inner="showPassword = !showPassword"
      />

      <v-text-field
        v-model="confirmPassword"
        :append-inner-icon="showConfirm ? 'mdi-eye-off' : 'mdi-eye'"
        class="mb-6"
        :label="$t('auth.confirmPassword')"
        autocomplete="new-password"
        prepend-inner-icon="mdi-lock-check-outline"
        required
        :rules="confirmRules"
        :type="showConfirm ? 'text' : 'password'"
        variant="outlined"
        hide-details="auto"
        @click:append-inner="showConfirm = !showConfirm"
      />

      <v-btn
        block
        class="mb-4 text-white"
        color="primary"
        :disabled="loading || code.length < 6"
        :loading="loading"
        rounded="lg"
        size="large"
        type="submit"
      >
        {{ $t('auth.resetPassword') }}
      </v-btn>

      <div class="text-center">
        <v-btn color="primary" size="small" variant="text" @click="router.push('/forgot-password')">
          {{ $t('auth.requestNewCode') }}
        </v-btn>
      </div>
    </v-form>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { toast } from 'vuetify-sonner'
import { useI18n } from 'vue-i18n'
import type { VForm } from 'vuetify/components'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n({ useScope: 'global' })

const email = computed(() => (route.query.email as string) ?? '')
const form = ref<VForm | null>(null)
const code = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirm = ref(false)
const loading = ref(false)

const passwordRules = [
  (v: string) => !!v || t('auth.passwordRequired'),
  (v: string) => v.length >= 8 || t('auth.passwordMinLength'),
]

const confirmRules = [
  (v: string) => !!v || t('auth.confirmPasswordRequired'),
  (v: string) => v === newPassword.value || t('auth.passwordsDoNotMatch'),
]

const handleSubmit = async () => {
  if (!form.value || !email.value) return
  const { valid } = await form.value.validate()
  if (!valid || code.value.length < 6) return

  loading.value = true
  try {
    await authStore.resetPassword(email.value, code.value, newPassword.value)
    toast.success(t('auth.passwordResetSuccess'))
    router.push('/login')
  } catch (error) {
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('Invalid or expired')) {
      toast.error(t('auth.invalidResetCode'), { progressBar: true, duration: 5000 })
    } else {
      toast.error(t('auth.passwordResetFailed'), { progressBar: true, duration: 5000 })
    }
    code.value = ''
  } finally {
    loading.value = false
  }
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
