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
        <v-icon size="38" color="black">mdi-email-check-outline</v-icon>
      </div>
      <h1 class="text-h5 font-weight-bold text-center text-textPrimary">
        {{ $t('auth.verifyYourEmail') }}
      </h1>
      <p class="text-center text-textSecondary mt-2">
        {{ $t('auth.verifyEmailSent') }} <strong>{{ email }}</strong>
      </p>
    </div>

    <v-form ref="form" @submit.prevent="handleVerify">
      <v-otp-input
        v-model="code"
        :length="6"
        type="number"
        variant="outlined"
        class="mb-6"
        focus-all
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
        {{ $t('auth.verifyEmail') }}
      </v-btn>

      <div class="text-center">
        <span class="text-textSecondary text-body-2">{{ $t('auth.didntReceiveCode') }}</span>
        <v-btn
          color="primary"
          size="small"
          variant="text"
          :disabled="resendCooldown > 0"
          @click="handleResend"
        >
          {{ resendCooldown > 0 ? $t('auth.resendIn', { seconds: resendCooldown }) : $t('auth.resendCode') }}
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

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n({ useScope: 'global' })

const email = computed(() => (route.query.email as string) ?? '')
const code = ref('')
const loading = ref(false)
const resendCooldown = ref(0)

let cooldownInterval: ReturnType<typeof setInterval> | null = null

const startCooldown = () => {
  resendCooldown.value = 60
  cooldownInterval = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0 && cooldownInterval) {
      clearInterval(cooldownInterval)
      cooldownInterval = null
    }
  }, 1000)
}

const handleVerify = async () => {
  if (!email.value || code.value.length < 6) return
  loading.value = true
  try {
    await authStore.verifyEmail(email.value, code.value)
    router.push('/onboarding')
  } catch (error) {
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('already verified')) {
      toast.info(t('auth.emailAlreadyVerified'))
      router.push('/')
    } else {
      toast.error(t('auth.invalidVerificationCode'), { progressBar: true, duration: 5000 })
    }
    code.value = ''
  } finally {
    loading.value = false
  }
}

const handleResend = async () => {
  if (!email.value || resendCooldown.value > 0) return
  try {
    await authStore.resendVerification(email.value)
    toast.success(t('auth.verificationCodeResent'))
    startCooldown()
  } catch (error) {
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('Please wait')) {
      toast.warning(t('auth.resendTooSoon'))
      startCooldown()
    } else {
      toast.error(t('auth.resendFailed'), { progressBar: true, duration: 5000 })
    }
  }
}

onUnmounted(() => {
  if (cooldownInterval) clearInterval(cooldownInterval)
})
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
