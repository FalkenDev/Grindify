<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import * as LucideIcons from 'lucide-vue-next'
import { onClickOutside } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { ADMIN_NAV, isNavSection, isNavItem } from '@/config/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { useStatsStore } from '@/stores/stats.store'

defineProps<{ collapsed: boolean }>()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const { logout } = authStore
const statsStore = useStatsStore()
const { stats } = storeToRefs(statsStore)
statsStore.fetchStats()

function getIcon(name: string) {
  return (LucideIcons as Record<string, object>)[name]
}

const activeNavId = computed(() => route.meta.navId as string | undefined)

const menuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)
onClickOutside(menuRef, () => { menuOpen.value = false })

async function handleLogout() {
  menuOpen.value = false
  await logout()
  router.replace('/login')
}

const avatarInitials = computed(() => {
  const u = user.value
  if (!u) return 'AD'
  if (u.firstName || u.lastName) return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase()
  return u.email[0].toUpperCase()
})

const displayName = computed(() => {
  const u = user.value
  if (!u) return 'Admin'
  if (u.firstName || u.lastName) return [u.firstName, u.lastName].filter(Boolean).join(' ')
  return u.email
})
</script>

<template>
  <aside
    class="sidebar sticky top-0 h-screen border-r border-border flex flex-col overflow-hidden transition-[width] duration-200 shrink-0"
    :class="collapsed ? 'w-sidebar-collapsed' : 'w-sidebar'"
    style="background: linear-gradient(180deg, #0b0b0d 0%, #0a0a0c 100%)"
  >
    <!-- Brand -->
    <div class="flex items-center gap-2.5 px-4 pt-[18px] pb-3 font-bold tracking-tight text-[15px] whitespace-nowrap overflow-hidden">
      <div
        class="w-7 h-7 rounded-[8px] flex items-center justify-center text-lime-ink font-extrabold text-[15px] shrink-0"
        style="background: linear-gradient(135deg, var(--lime) 0%, var(--lime-deep) 100%); box-shadow: 0 0 0 1px rgba(196,247,74,0.25), 0 6px 16px -6px rgba(196,247,74,0.4)"
      >G</div>
      <div
        class="flex items-baseline gap-1.5 transition-opacity duration-150"
        :class="collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'"
      >
        <span class="text-text">Grindify Admin</span>
        <span class="font-mono text-[10.5px] text-dim font-medium">v0.1.0</span>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto overflow-x-hidden px-2.5 pt-1.5 pb-2.5 flex flex-col gap-px">
      <template v-for="(entry, i) in ADMIN_NAV" :key="i">
        <div
          v-if="isNavSection(entry)"
          class="text-[10.5px] uppercase tracking-[0.08em] text-faint px-2 pt-3 pb-1.5 font-medium whitespace-nowrap overflow-hidden transition-[opacity,height,padding] duration-200"
          :class="collapsed ? 'opacity-0 !h-1 !py-0 pointer-events-none' : ''"
        >
          {{ entry.section }}
        </div>
        <button
          v-else-if="isNavItem(entry)"
          class="nav-item flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[13px] font-medium cursor-pointer relative transition-[background,color] duration-[120ms] whitespace-nowrap overflow-hidden w-full text-left"
          :class="[
            activeNavId === entry.id ? 'bg-surface-2 text-text active' : 'text-mute hover:bg-surface hover:text-text-2',
            collapsed ? 'justify-center !px-[9px]' : '',
          ]"
          :title="collapsed ? entry.label : undefined"
          @click="router.push(entry.path)"
        >
          <component
            :is="getIcon(entry.icon)"
            class="shrink-0 transition-colors"
            :class="activeNavId === entry.id ? 'text-lime' : 'text-dim'"
            :size="16"
          />
          <span
            class="transition-[opacity,width] duration-150"
            :class="collapsed ? 'opacity-0 w-0 overflow-hidden' : ''"
          >{{ entry.label }}</span>
          <span
            v-if="entry.id === 'a-users' && stats?.totalUsers != null && !collapsed"
            class="ml-auto font-mono text-[10.5px] text-dim"
          >{{ stats.totalUsers }}</span>
        </button>
      </template>
    </nav>

    <!-- Profile tile -->
    <div class="px-3 pb-3 pt-2.5 border-t border-border">
      <div ref="menuRef" class="relative">
        <div
          class="flex items-center gap-2.5 p-2 rounded-[10px] bg-surface-2 border border-border overflow-hidden cursor-pointer hover:bg-surface-3 transition-colors"
          :class="collapsed ? '!justify-center !bg-transparent !border-transparent !p-1' : ''"
          @click="menuOpen = !menuOpen"
        >
          <div
            class="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
            style="background: linear-gradient(135deg, var(--lime), var(--lime-deep)); color: var(--lime-ink); box-shadow: 0 0 0 1px var(--border-2)"
          >{{ avatarInitials }}</div>
          <div
            class="flex-1 min-w-0 transition-opacity duration-150"
            :class="collapsed ? 'opacity-0 w-0 overflow-hidden' : ''"
          >
            <div class="text-[12.5px] font-semibold text-text truncate">{{ displayName }}</div>
            <div class="text-[11px] text-dim truncate">Super admin</div>
          </div>
          <component
            :is="getIcon('MoreHorizontal')"
            class="text-dim shrink-0 transition-opacity duration-150"
            :class="collapsed ? 'opacity-0 w-0 overflow-hidden' : ''"
            :size="14"
          />
        </div>

        <div
          v-if="menuOpen"
          class="absolute bottom-[calc(100%+6px)] left-0 right-0 bg-surface-2 border border-border-2 rounded-inner overflow-hidden z-50"
          style="box-shadow: var(--shadow-pop)"
        >
          <div class="px-3.5 py-3 pb-2.5">
            <div class="text-[13px] font-semibold text-text truncate">{{ displayName }}</div>
            <div class="text-[11.5px] text-dim mt-px truncate">{{ user?.email }}</div>
          </div>
          <div class="h-px bg-border" />
          <button
            class="flex items-center gap-2 w-full px-3.5 py-2.5 text-[13px] text-red hover:bg-red-soft transition-colors cursor-pointer"
            @click="handleLogout"
          >
            <component :is="getIcon('LogOut')" :size="14" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
/* Active indicator line — requires ::before pseudo, can't be done in Tailwind */
.nav-item.active::before {
  content: '';
  position: absolute;
  left: -10px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: var(--lime);
  border-radius: 2px;
}
</style>
