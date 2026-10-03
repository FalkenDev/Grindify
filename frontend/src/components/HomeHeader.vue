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
  <div class="d-flex justify-space-between align-center">
    <div class="d-flex ga-3 align-center">
      <v-avatar color="white" style="border-radius: 8px" size="40">
        <v-img v-if="user?.avatar" :src="getImageUrl(user.avatar)" :alt="$t('a11y.userAvatar')" cover />
        <v-icon v-else color="grey"> mdi-account </v-icon>
      </v-avatar>
      <div>
        <h1 class="text-h6">
          {{ user ? user.firstName + ' ' + user.lastName : $t('home.guest') }}
        </h1>
        <p class="text-body-2">
          {{ greeting }}
        </p>
      </div>
    </div>
    <v-btn color="cardBg" density="compact" icon size="45" variant="flat">
      <v-icon>mdi-menu</v-icon>
      <v-menu activator="parent">
        <v-list>
          <v-list-item @click="authStore.logout()">
            <v-list-item-title>{{ $t('settings.logout') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-btn>
  </div>
</template>
<script lang="ts" setup>
import { useAuthStore } from '@/stores/auth.store'
import type { User, StreakInfo } from '@/interfaces/User.interface'
import { useGreeting } from '@/composables/useGreeting'
import { onMounted } from 'vue'

const props = withDefaults(defineProps<{ streakInfo?: StreakInfo | null }>(), {
  streakInfo: null,
})

const authStore = useAuthStore()

const streakInfoRef = computed(() => props.streakInfo)
const { greeting } = useGreeting(streakInfoRef)

const user = computed<User | null>(() => authStore.user)

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8393/v1'

const getImageUrl = (imagePath: string) => {
  if (imagePath.startsWith('http')) {
    return imagePath
  }
  // Remove /v1 from API URL for static assets
  const baseUrl = apiUrl.replace('/v1', '')
  return `${baseUrl}${imagePath}`
}

// Refresh user data when component mounts to get latest avatar
onMounted(async () => {
  try {
    await authStore.refreshUser()
  } catch (error) {
    console.error('Failed to refresh user data:', error)
  }
})
</script>
