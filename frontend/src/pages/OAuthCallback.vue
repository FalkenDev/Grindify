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
  <div class="d-flex flex-column fill-height align-center justify-center">
    <v-progress-circular indeterminate color="primary" size="48" />
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { toast } from 'vuetify-sonner'
import { useI18n } from 'vue-i18n'
import { safeRedirectPath } from '@/utils/safeRedirect'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n({ useScope: 'global' })

onMounted(async () => {
  try {
    // The backend has set the httpOnly auth cookie before redirecting here;
    // fetch the user with it instead of trusting data in the URL.
    const user = await authStore.refreshUser()
    authStore.setUserFromOAuth(user)
    router.replace(safeRedirectPath(route.query.redirect))
  } catch {
    toast.error(t('auth.oauthFailed'), { progressBar: true, duration: 5000 })
    router.replace('/login')
  }
})
</script>
