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
  <v-app>
    <VSonner position="top-center" />
    <PWAUpdatePrompt />
    <v-main class="app-main" :style="{ '--extra-pb': showResumeBar ? '45px' : '0px' }">
      <router-view :key="$route.name" />
    </v-main>
    <v-card
      v-if="showResumeBar"
      class="resume-card d-flex align-center justify-space-between px-5 border-t-sm border-b-sm"
      :style="{ borderColor: theme.current.value.colors.primary + ' !important' }"
      height="45"
      color="cardBg"
      width="100%"
      elevation="0"
      rounded="0"
      @click="routeToSelectedWorkoutSession"
    >
      <div class="d-flex align-center ga-2">
        <v-icon color="primary" size="small">mdi-dumbbell</v-icon>
        <h1 class="text-body-1 text-primary font-weight-bold">
          {{ $t('navigation.resumeWorkout') }}
        </h1>
      </div>
      <v-icon color="primary"> mdi-chevron-right </v-icon>
    </v-card>
    <BottomNavigation v-if="authStore.isAuthenticated && !$route.meta.hideBottomNav" />
  </v-app>
</template>

<script lang="ts" setup>
import { useAuthStore } from './stores/auth.store'
import { VSonner } from 'vuetify-sonner'
import { useWorkoutSessionStore } from './stores/workoutSession.store'
import 'vuetify-sonner/style.css'
import router from './router'
import { useRoute } from 'vue-router'
import { useAppStore } from './stores/app'
import { useTheme } from 'vuetify'
import { useI18n } from 'vue-i18n'
import { updateDocumentTitle } from './utils/documentTitle'

const workoutSessionStore = useWorkoutSessionStore()
const authStore = useAuthStore()
const appStore = useAppStore()
const theme = useTheme()
const route = useRoute()

// Initialize theme from persisted preference
theme.global.name.value = appStore.darkMode ? 'dark' : 'light'

// Keep the document title in sync when the language changes.
const { locale } = useI18n({ useScope: 'global' })
watch(locale, () => updateDocumentTitle(route))

// Refresh the persisted user on start so consent/terms-version changes are picked up
// (the router guard sends the user to /consent when consentRequired is true).
onMounted(async () => {
  if (!authStore.isAuthenticated) return
  try {
    const user = await authStore.refreshUser()
    const current = router.currentRoute.value
    if (user?.consentRequired && current.meta.requiresAuth && current.path !== '/consent') {
      router.replace({ path: '/consent', query: { redirect: current.fullPath } })
    }
  } catch {
    // Offline or session expired – fetchWrapper handles 401 by logging out.
  }
})

const isActiveSession = computed(() => {
  const session = workoutSessionStore.selectedWorkoutSession as { status?: string } | null
  return session != null && session.status === 'in_progress'
})

const isOnSessionPage = computed(() => {
  const path = route.path
  return path.startsWith('/session') || path.startsWith('/session-history')
})

const showResumeBar = computed(() => {
  return authStore.isAuthenticated && isActiveSession.value && !isOnSessionPage.value
})

const routeToSelectedWorkoutSession = () => {
  if (
    workoutSessionStore.selectedWorkoutSession &&
    'id' in workoutSessionStore.selectedWorkoutSession
  ) {
    router.push('/session/' + workoutSessionStore.selectedWorkoutSession.id)
  }
}
</script>
<style scoped>
.resume-card {
  position: fixed;
  left: 0;
  right: 0;
  margin-inline: auto;
  max-width: var(--app-max-width);
  bottom: calc(56px + env(safe-area-inset-bottom, 0px));
  z-index: 1100;
  width: 100%;
}

.bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  width: 100%;
}

:deep(.v-field) {
  background-color: rgb(var(--v-theme-cardBg)) !important;
  border-radius: 12px !important;
}

:deep(.v-field__outline__start) {
  border-radius: 6px 0 0 6px !important;
}

:deep(.v-field__outline__end) {
  border-radius: 0 6px 6px 0 !important;
}
</style>

<style>
/*
 * Desktop: keep the mobile layout in a centered column instead of stretching it.
 * Fixed/overlay elements (bottom navigation, fullscreen dialogs, bottom sheets)
 * are constrained to the same column.
 */
:root {
  --app-max-width: 600px;
}

.app-main {
  width: 100%;
  max-width: var(--app-max-width);
  margin-inline: auto;
}

.v-bottom-navigation.app-bottom-nav {
  left: 0 !important;
  right: 0 !important;
  width: 100% !important;
  max-width: var(--app-max-width);
  margin-inline: auto;
}

.v-dialog.v-dialog--fullscreen > .v-overlay__content,
.v-bottom-sheet > .v-bottom-sheet__content.v-overlay__content {
  left: 0;
  right: 0;
  max-width: var(--app-max-width) !important;
  margin-inline: auto !important;
}
</style>
