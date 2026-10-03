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
  <v-card class="fill-height bg-background" rounded="0">
    <BackHeader :title="$t(`legal.${doc}.title`)" @close="goBack" />
    <v-card-text class="pa-6">
      <LegalDocument :doc="doc" />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import LegalDocument, { type LegalDocumentType } from '@/components/legal/LegalDocument.vue'

defineProps<{ doc: LegalDocumentType }>()

const router = useRouter()

const goBack = () => {
  // Opened directly (e.g. from a link) there is no history entry to go back to.
  if (window.history.state?.back) router.back()
  else router.push('/')
}
</script>
