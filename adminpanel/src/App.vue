<script setup lang="ts">
import { watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { Toaster } from 'vue-sonner'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import { useSidebar } from '@/composables/useSidebar'

const { railCollapsed, mobileOpen, toggle, closeMobile } = useSidebar()
const route = useRoute()

watch(
  railCollapsed,
  (val) => {
    document.getElementById('app')?.classList.toggle('collapsed', val)
  },
  { immediate: true },
)

// The mobile drawer closes whenever the user navigates.
watch(() => route.fullPath, closeMobile)
</script>

<template>
  <template v-if="route.meta.layout === 'auth'">
    <RouterView />
  </template>
  <template v-else>
    <AppSidebar :collapsed="railCollapsed" :mobile-open="mobileOpen" @navigate="closeMobile" />
    <!-- Backdrop for the off-canvas sidebar on small screens -->
    <div
      v-if="mobileOpen"
      class="fixed inset-0 z-40 bg-black/60 md:hidden"
      aria-hidden="true"
      @click="closeMobile"
    />
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
