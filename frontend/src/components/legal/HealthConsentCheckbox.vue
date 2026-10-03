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
  <div>
    <v-checkbox
      :model-value="modelValue"
      color="primary"
      density="compact"
      hide-details
      @update:model-value="emit('update:modelValue', !!$event)"
    >
      <template #label>
        <span class="text-body-2">{{ $t('consent.healthLabel') }}</span>
      </template>
    </v-checkbox>
    <p class="text-caption text-textSecondary health-consent-hint">
      {{ $t('consent.healthHint') }}
      <a class="text-primary" href="/privacy" @click.prevent="emit('openPrivacy')">{{
        $t('auth.privacyPolicy')
      }}</a>
    </p>
  </div>
</template>

<script setup lang="ts">
/**
 * Separate, explicit and OPTIONAL consent to processing of health data
 * (GDPR Art. 9(2)(a) and Art. 7(4)): body weight, body measurements and progress
 * photos. Not ticking it only disables those features.
 */
defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  openPrivacy: []
}>()
</script>

<style scoped>
.health-consent-hint {
  /* Align with the checkbox label */
  padding-left: 40px;
}
</style>
