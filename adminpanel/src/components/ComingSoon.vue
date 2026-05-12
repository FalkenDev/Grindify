<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import * as LucideIcons from 'lucide-vue-next'
import { NAV_ITEMS } from '@/config/navigation'

const route = useRoute()

const title = computed(() => (route.meta.title as string) || 'Coming Soon')
const description = computed(() => (route.meta.description as string) || '')

function getIcon(name: string) {
  return (LucideIcons as Record<string, object>)[name]
}

const pageIcon = computed(() => {
  const item = NAV_ITEMS.find((n) => n.id === route.meta.navId)
  return item?.icon ? getIcon(item.icon) : getIcon('LayoutDashboard')
})
</script>

<template>
  <div class="page-head">
    <div class="titles">
      <h1>{{ title }}</h1>
      <p v-if="description">{{ description }}</p>
    </div>
  </div>

  <div class="flex flex-col items-center justify-center gap-2.5 py-16 px-8 bg-surface border border-dashed border-border-strong rounded-card text-center">
    <component :is="getIcon('Construction')" :size="32" class="text-faint mb-1" />
    <div class="text-[14px] font-semibold text-text-2">Coming soon</div>
    <div class="text-[12.5px] text-dim max-w-[280px] leading-relaxed">This section is under construction.</div>
  </div>
</template>
