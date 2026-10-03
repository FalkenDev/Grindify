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
        <v-icon size="38" color="black">mdi-lock-reset</v-icon>
      </div>
      <h1 class="text-h5 font-weight-bold text-center text-textPrimary">
        {{ $t('auth.forgotPasswordTitle') }}
      </h1>
      <p class="text-center text-textSecondary mt-2">
        {{ $t('auth.forgotPasswordSubtitle') }}
      </p>
    </div>

    <v-form ref="form" @submit.prevent="handleSubmit">
      <v-text-field
        v-model="email"
        class="mb-6"
        autocomplete="email"
        :label="$t('auth.emailAddress')"
        prepend-inner-icon="mdi-email-outline"
        required
        :rules="emailRules"
        type="email"
        variant="outlined"
        hide-details="auto"
      />

      <v-btn
        block
        class="mb-4 text-white"
        color="primary"
        :disabled="loading"
        :loading="loading"
        rounded="lg"
        size="large"
        type="submit"
      >
        {{ $t('auth.sendResetCode') }}
      </v-btn>

      <div class="text-center">
        <v-btn color="primary" size="small" variant="text" @click="router.push('/login')">
          {{ $t('auth.backToLogin') }}
        </v-btn>
      </div>
    </v-form>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { toast } from 'vuetify-sonner'
import { useI18n } from 'vue-i18n'
import type { VForm } from 'vuetify/components'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n({ useScope: 'global' })

const form = ref<VForm | null>(null)
const email = ref('')
const loading = ref(false)

const emailRules = [
  (v: string) => !!v || t('auth.emailRequired'),
  (v: string) => /.+@.+\..+/.test(v) || t('auth.emailValid'),
]

const handleSubmit = async () => {
  if (!form.value) return
  const { valid } = await form.value.validate()
  if (!valid) return

  loading.value = true
  try {
    await authStore.forgotPassword(email.value)
    toast.success(t('auth.resetCodeSent'))
    router.push({ path: '/reset-password', query: { email: email.value } })
  } catch {
    toast.error(t('auth.resetCodeFailed'), { progressBar: true, duration: 5000 })
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
