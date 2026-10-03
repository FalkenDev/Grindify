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
  <v-bottom-navigation
    v-if="!route.meta.hideBottomNav"
    bg-color="cardBg"
    class="d-flex justify-space-around app-bottom-nav"
    :aria-label="$t('a11y.mainNavigation')"
    tag="nav"
  >
    <v-btn icon to="/" :ripple="false" :aria-label="$t('a11y.nav.home')">
      <v-icon :color="route.path === '/' ? 'primary' : ''">
        {{ route.path === '/' ? 'mdi-home' : 'mdi-home-outline' }}
      </v-icon>
    </v-btn>
    <v-btn icon to="/calendar" :ripple="false" :aria-label="$t('a11y.nav.calendar')">
      <v-icon :color="route.path === '/calendar' ? 'primary' : ''">
        {{ route.path === '/calendar' ? 'mdi-calendar' : 'mdi-calendar-outline' }}
      </v-icon>
    </v-btn>
    <v-btn icon to="/workout" :ripple="false" :aria-label="$t('a11y.nav.addWorkout')">
      <v-icon color="primary" size="40">mdi-plus-circle</v-icon>
    </v-btn>
    <v-btn icon to="/statistics" :ripple="false" :aria-label="$t('a11y.nav.statistics')">
      <v-icon :color="route.path === '/statistics' ? 'primary' : ''">mdi-chart-bar</v-icon>
    </v-btn>
    <v-btn icon to="/settings" :ripple="false" :aria-label="$t('a11y.nav.settings')">
      <v-icon :color="route.path === '/settings' ? 'primary' : ''">
        {{ route.path === '/settings' ? 'mdi-account' : 'mdi-account-outline' }}
      </v-icon>
    </v-btn>
  </v-bottom-navigation>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>
