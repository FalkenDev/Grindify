<script setup lang="ts">
import { watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { Toaster } from 'vue-sonner'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import { useSidebar } from '@/composables/useSidebar'

const { collapsed, toggle } = useSidebar()
const route = useRoute()

watch(
  collapsed,
  (val) => {
    document.getElementById('app')?.classList.toggle('collapsed', val)
  },
  { immediate: true },
)
</script>

<template>
  <template v-if="route.meta.layout === 'auth'">
    <RouterView />
  </template>
  <template v-else>
    <AppSidebar :collapsed="collapsed" />
    <div class="admin-main">
      <AppTopbar @toggle-sidebar="toggle" />
      <main class="admin-content">
        <RouterView />
      </main>
    </div>
  </template>

  <Teleport to="body">
    <Toaster position="bottom-right" :duration="3200" theme="dark" />
  </Teleport>
</template>
