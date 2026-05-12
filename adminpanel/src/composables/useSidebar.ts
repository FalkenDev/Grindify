import { useStorage } from '@vueuse/core'
import { computed } from 'vue'

const collapsed = useStorage('grindify-admin-sidebar-collapsed', false)

export function useSidebar() {
  const toggle = () => {
    collapsed.value = !collapsed.value
  }

  const sidebarClass = computed(() => collapsed.value ? 'collapsed' : '')

  return { collapsed, toggle, sidebarClass }
}
