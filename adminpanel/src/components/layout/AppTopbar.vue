<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMagicKeys, whenever, onClickOutside } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import {
  PanelLeft,
  ChevronRight,
  Search,
  Moon,
  Bell,
  LogOut,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'

const emit = defineEmits<{ toggleSidebar: [] }>()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const { logout } = authStore
const currentTitle = computed(() => (route.meta.title as string) || 'Overview')

const { Meta_K, Ctrl_K } = useMagicKeys()
whenever(Meta_K, () => {})
whenever(Ctrl_K, () => {})

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
</script>

<template>
  <header class="sticky top-0 z-30 h-topbar flex items-center px-6 gap-4 bg-bg/85 backdrop-blur-md border-b border-border shrink-0">

    <button
      class="flex items-center justify-center w-8 h-8 rounded-[8px] text-mute hover:bg-surface-2 hover:text-text-2 transition-colors cursor-pointer shrink-0"
      aria-label="Toggle sidebar"
      @click="emit('toggleSidebar')"
    >
      <PanelLeft :size="16" />
    </button>

    <div class="flex items-center gap-2 text-[13px] text-mute whitespace-nowrap">
      <span>Admin</span>
      <ChevronRight :size="12" class="text-faint" />
      <span class="text-text font-medium">{{ currentTitle }}</span>
    </div>

    <div class="flex flex-1 max-w-[420px] items-center gap-2 px-2.5 py-[7px] bg-surface-2 border border-border rounded-[10px] text-mute hover:border-border-strong hover:bg-surface transition-colors cursor-text">
      <Search :size="14" class="shrink-0" />
      <input
        placeholder="Search users, exercises, settings…"
        readonly
        class="flex-1 bg-transparent border-0 outline-none text-[13px] text-text cursor-text placeholder:text-dim"
      />
      <span class="font-mono text-[10.5px] text-dim bg-surface-3 border border-border-2 px-[5px] py-px rounded-[5px] whitespace-nowrap">⌘K</span>
    </div>

    <div class="flex items-center gap-1 ml-auto">
      <button class="flex items-center justify-center w-8 h-8 rounded-[8px] text-mute hover:bg-surface-2 hover:text-text-2 transition-colors cursor-pointer" aria-label="Toggle theme">
        <Moon :size="16" />
      </button>
      <button class="relative flex items-center justify-center w-8 h-8 rounded-[8px] text-mute hover:bg-surface-2 hover:text-text-2 transition-colors cursor-pointer" aria-label="Notifications">
        <Bell :size="16" />
        <span class="absolute top-[6px] right-[6px] w-1.5 h-1.5 rounded-full bg-lime border-[1.5px] border-bg" />
      </button>

      <div class="w-px h-5 bg-border-2 mx-1" />

      <div ref="menuRef" class="relative">
        <button
          class="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[10px] font-semibold cursor-pointer transition-opacity hover:opacity-80"
          style="background: linear-gradient(135deg, var(--lime), var(--lime-deep)); color: var(--lime-ink); box-shadow: 0 0 0 1px var(--border-2);"
          aria-label="Account menu"
          @click="menuOpen = !menuOpen"
        >
          {{ avatarInitials }}
        </button>

        <div v-if="menuOpen" class="absolute top-[calc(100%+8px)] right-0 min-w-[200px] bg-surface-2 border border-border-2 rounded-inner overflow-hidden z-50" style="box-shadow: var(--shadow-pop)">
          <div class="px-3.5 py-3 pb-2.5">
            <div class="text-[13px] font-semibold text-text truncate">
              {{ user?.firstName ? [user.firstName, user.lastName].filter(Boolean).join(' ') : (user?.email ?? 'Admin') }}
            </div>
            <div class="text-[11.5px] text-dim mt-px truncate">{{ user?.email }}</div>
          </div>
          <div class="h-px bg-border" />
          <button
            class="flex items-center gap-2 w-full px-3.5 py-2.5 text-[13px] text-red hover:bg-red-soft transition-colors cursor-pointer"
            @click="handleLogout"
          >
            <LogOut :size="14" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
