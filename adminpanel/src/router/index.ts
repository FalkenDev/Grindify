import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { layout: 'auth', title: 'Sign in' },
    },
    {
      path: '/',
      name: 'overview',
      component: () => import('@/views/OverviewView.vue'),
      meta: {
        title: 'Overview',
        description: 'Instance overview and aggregate stats',
        navId: 'a-overview',
      },
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('@/views/UsersView.vue'),
      meta: {
        title: 'Users',
        description: 'Manage user accounts, roles, and access',
        navId: 'a-users',
      },
    },
    {
      path: '/exercises',
      name: 'global-exercises',
      component: () => import('@/views/GlobalExercisesView.vue'),
      meta: {
        title: 'Global Exercises',
        description: 'Manage the global exercise library',
        navId: 'a-exercises',
      },
    },
    {
      path: '/exercise-images',
      name: 'exercise-images',
      component: () => import('@/views/ExerciseImagesView.vue'),
      meta: {
        title: 'Exercise Images',
        description: 'Upload and manage exercise media',
        navId: 'a-images',
      },
    },
    {
      path: '/templates',
      name: 'workout-templates',
      component: () => import('@/views/WorkoutTemplatesView.vue'),
      meta: {
        title: 'Workout Templates',
        description: 'Curated workout templates for users',
        navId: 'a-templates',
      },
    },
    {
      path: '/activities',
      name: 'activity-types',
      component: () => import('@/views/ActivityTypesView.vue'),
      meta: {
        title: 'Activity Types',
        description: 'Configure activity types and metrics',
        navId: 'a-activities',
      },
    },
    {
      path: '/analytics',
      name: 'analytics',
      component: () => import('@/views/AnalyticsView.vue'),
      meta: {
        title: 'Analytics',
        description: 'Instance-wide usage and engagement analytics',
        navId: 'a-analytics',
      },
    },
    {
      path: '/import-export',
      name: 'import-export',
      component: () => import('@/views/ImportExportView.vue'),
      meta: {
        title: 'Import / Export',
        description: 'Bulk data import, export, and migrations',
        navId: 'a-io',
      },
    },
    {
      path: '/audit-logs',
      name: 'audit-logs',
      component: () => import('@/views/AuditLogsView.vue'),
      meta: {
        title: 'Audit Logs',
        description: 'Full event log for all admin actions',
        navId: 'a-audit',
      },
    },
    {
      path: '/system-health',
      name: 'system-health',
      component: () => import('@/views/SystemHealthView.vue'),
      meta: {
        title: 'System Health',
        description: 'Service status, uptime, and diagnostics',
        navId: 'a-health',
      },
    },
    {
      path: '/versions',
      name: 'versions',
      component: () => import('@/views/VersionsView.vue'),
      meta: {
        title: 'Versions',
        description: 'Release history and update management',
        navId: 'a-versions',
      },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: {
        title: 'Settings',
        description: 'Instance configuration and preferences',
        navId: 'a-settings',
      },
    },
  ],
})

router.beforeEach(async (to) => {
  if (to.name === 'login') return true

  const authStore = useAuthStore()
  if (!authStore.checked) {
    await authStore.fetchMe()
  }

  if (!authStore.user) return { name: 'login' }
  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} — Grindify Admin` : 'Grindify Admin'
})

export default router
