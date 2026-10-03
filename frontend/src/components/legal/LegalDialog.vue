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
  <v-dialog
    :model-value="modelValue"
    fullscreen
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card class="bg-background">
      <BackHeader :title="$t(`legal.${doc}.title`)" @close="emit('update:modelValue', false)" />
      <v-card-text class="pa-6">
        <LegalDocument :doc="doc" />
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-btn
          block
          color="primary"
          rounded="lg"
          size="large"
          @click="emit('update:modelValue', false)"
        >
          {{ $t('common.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import LegalDocument, { type LegalDocumentType } from '@/components/legal/LegalDocument.vue'

defineProps<{ modelValue: boolean; doc: LegalDocumentType }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>
