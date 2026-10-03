<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { FileQuestion } from 'lucide-vue-next'

const route = useRoute()
</script>

<template>
  <div class="page-head">
    <div class="titles">
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist.</p>
    </div>
  </div>

  <div class="flex flex-col items-center justify-center gap-2.5 py-16 px-8 bg-surface border border-dashed border-border-strong rounded-card text-center">
    <FileQuestion :size="32" class="text-faint mb-1" />
    <div class="text-[14px] font-semibold text-text-2">404</div>
    <div class="text-[12.5px] text-dim max-w-[320px] leading-relaxed break-all">
      No route matches <code class="font-mono text-mute">{{ route.path }}</code>.
    </div>
    <RouterLink
      to="/"
      class="mt-3 px-3.5 py-2 bg-lime text-lime-ink rounded-chip text-[13px] font-bold hover:opacity-90 transition-opacity"
    >
      Back to overview
    </RouterLink>
  </div>
</template>
