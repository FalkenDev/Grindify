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
  <div class="legal-document">
    <p class="text-caption text-textSecondary mb-4">
      {{ t('legal.versionLine', { version: LEGAL_VERSION, date: LEGAL_DATE }) }}
    </p>

    <v-alert
      v-if="missing.length"
      class="mb-6"
      density="compact"
      :title="t('legal.notConfiguredTitle')"
      type="warning"
      variant="tonal"
    >
      <span class="text-body-2">{{ t('legal.notConfiguredText', { missing: missingNames }) }}</span>
    </v-alert>

    <section v-for="(section, index) in sections" :key="index" class="mb-5">
      <h3 class="text-h6 mb-2">{{ rt(section.title) }}</h3>
      <p v-for="(paragraph, pIndex) in section.paragraphs ?? []" :key="`p${pIndex}`" class="text-body-2 mb-2">
        {{ rt(paragraph, params) }}
      </p>
      <ul v-if="section.items?.length" class="text-body-2 mb-2 pl-4">
        <li v-for="(item, iIndex) in section.items" :key="`i${iIndex}`" class="mb-1">
          <strong v-if="item.label">{{ rt(item.label, params) }}:</strong>
          {{ rt(item.text, params) }}
        </li>
      </ul>
      <p v-for="(paragraph, aIndex) in section.after ?? []" :key="`a${aIndex}`" class="text-body-2 mb-2">
        {{ rt(paragraph, params) }}
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  LEGAL_DATE,
  LEGAL_VERSION,
  legalConfig,
  legalConfigEnvNames,
  missingLegalConfig,
  type LegalConfigKey,
} from '@/config/legal'

export type LegalDocumentType = 'privacy' | 'terms' | 'imprint'

const props = defineProps<{ doc: LegalDocumentType }>()

const { t, tm, rt } = useI18n({ useScope: 'global' })

type Message = Parameters<typeof rt>[0]
interface LegalSection {
  title: Message
  paragraphs?: Message[]
  items?: { label?: Message; text: Message }[]
  after?: Message[]
}

// Operator values each document depends on.
const requiredConfig: Record<LegalDocumentType, LegalConfigKey[]> = {
  privacy: ['operatorName', 'contactEmail', 'backupRetentionDays', 'logRetentionDays'],
  terms: ['operatorName', 'contactEmail'],
  imprint: ['operatorName', 'operatorCity', 'operatorCountry', 'contactEmail'],
}

const sections = computed(() => tm(`legal.${props.doc}.sections`) as unknown as LegalSection[])

const missing = computed(() => missingLegalConfig(requiredConfig[props.doc]))
const missingNames = computed(() => missing.value.map(key => legalConfigEnvNames[key]).join(', '))

const params = computed(() => {
  const value = (key: LegalConfigKey) => legalConfig[key] || t('legal.notConfiguredValue')
  return {
    operator: value('operatorName'),
    email: value('contactEmail'),
    city: value('operatorCity'),
    country: value('operatorCountry'),
    backupDays: value('backupRetentionDays'),
    logDays: value('logRetentionDays'),
  }
})
</script>
