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
  <div class="d-flex flex-column fill-height align-center justify-center text-center px-5 py-10">
    <v-icon size="64" color="primary" class="mb-4">mdi-map-marker-question-outline</v-icon>
    <h1 class="text-h4 font-weight-bold text-textPrimary mb-2">404</h1>
    <h2 class="text-h6 text-textPrimary mb-2">{{ $t('notFound.title') }}</h2>
    <p class="text-body-2 text-textSecondary mb-6">{{ $t('notFound.text') }}</p>
    <v-btn color="primary" rounded="lg" size="large" class="text-white" to="/">
      {{ $t('notFound.goHome') }}
    </v-btn>
  </div>
</template>
