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
  <div v-if="enabledProviders.length > 0">
    <v-divider>
      <span class="text-textSecondary text-body-2">{{ $t('auth.orContinueWith') }}</span>
    </v-divider>

    <div class="d-flex flex-row ga-5 w-100 justify-center mt-4">
      <v-btn
        v-for="provider in enabledProviders"
        :key="provider.id"
        type="button"
        color="cardBg"
        class="border-sm flex-grow-1"
        variant="flat"
        @click="loginWith(provider.id)"
      >
        <v-icon size="24" class="me-2">{{ provider.icon }}</v-icon>
        <span>{{ provider.label }}</span>
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Google/GitHub sign-in buttons, shared by Login and Register.
 * Only providers enabled on the server (GET /auth/providers) are shown; if none
 * are enabled, or the lookup fails, nothing is rendered (not even the divider).
 * New OAuth users are sent to the consent page by the router guard.
 */
import { computed, onMounted, ref } from 'vue'

type OAuthProvider = 'google' | 'github'
type ProviderAvailability = Record<OAuthProvider, boolean>

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8393/v1'

const PROVIDERS: { id: OAuthProvider; icon: string; label: string }[] = [
  { id: 'google', icon: 'mdi-google', label: 'Google' },
  { id: 'github', icon: 'mdi-github', label: 'GitHub' },
]

const NONE: ProviderAvailability = { google: false, github: false }

// Fetched once per page load and shared by every instance (Login, Register).
let providersRequest: Promise<ProviderAvailability> | null = null

const fetchProviders = (): Promise<ProviderAvailability> => {
  providersRequest ??= fetch(`${apiUrl}/auth/providers`, { credentials: 'include' })
    .then(async response => {
      if (!response.ok) throw new Error(`Status ${response.status}`)
      const data = (await response.json()) as Partial<ProviderAvailability>
      return { google: data?.google === true, github: data?.github === true }
    })
    .catch(() => {
      // Hide the buttons, but allow a retry the next time the component mounts.
      providersRequest = null
      return NONE
    })
  return providersRequest
}

const availability = ref<ProviderAvailability>(NONE)

const enabledProviders = computed(() => PROVIDERS.filter(p => availability.value[p.id]))

onMounted(async () => {
  availability.value = await fetchProviders()
})

const loginWith = (provider: OAuthProvider) => {
  window.location.href = `${apiUrl}/auth/${provider}`
}
</script>
