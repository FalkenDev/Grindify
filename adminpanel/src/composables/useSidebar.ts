import { useMediaQuery, useStorage } from '@vueuse/core'
import { computed, ref } from 'vue'

// Desktop: the sidebar can be collapsed to an icon rail (persisted).
const collapsed = useStorage('grindify-admin-sidebar-collapsed', false)
// Mobile (< md): the sidebar is an off-canvas drawer, closed by default.
const mobileOpen = ref(false)

export function useSidebar() {
  // Tailwind's `md` breakpoint (768px): below it the sidebar is a drawer.
  const isMobile = useMediaQuery('(max-width: 767.98px)')

  const toggle = () => {
    if (isMobile.value) {
      mobileOpen.value = !mobileOpen.value
    } else {
      collapsed.value = !collapsed.value
    }
  }

  const closeMobile = () => {
    mobileOpen.value = false
  }

  // The icon rail only exists on desktop; the mobile drawer always shows labels.
  const railCollapsed = computed(() => collapsed.value && !isMobile.value)

  const sidebarClass = computed(() => (railCollapsed.value ? 'collapsed' : ''))

  return { collapsed, railCollapsed, mobileOpen, isMobile, toggle, closeMobile, sidebarClass }
}
