/*
 * Copyright (c) 2026 FalkenDev
 *
 * This file is part of Grindify.
 *
 * Grindify is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with Grindify. If not, see
 * <https://www.gnu.org/licenses/>.
 */

import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/index.vue'
import { useAuthStore } from '@/stores/auth.store'
import Login from '@/pages/Login.vue'
import Register from '@/pages/Register.vue'
import Onboarding from '@/pages/Onboarding.vue'
import VerifyEmail from '@/pages/VerifyEmail.vue'
import ForgotPassword from '@/pages/ForgotPassword.vue'
import ResetPassword from '@/pages/ResetPassword.vue'
import OAuthCallback from '@/pages/OAuthCallback.vue'
import WorkoutDetails from '@/pages/WorkoutDetails.vue'
import Session from '@/pages/Session.vue'
import SessionSummary from '@/pages/SessionSummary.vue'
import Calendar from '@/pages/Calendar.vue'
import Settings from '@/pages/Settings.vue'
import AddWorkout from '@/pages/AddWorkout.vue'
import LogActivity from '@/pages/LogActivity.vue'
import Statistics from '@/pages/Statistics.vue'
import SessionDetail from '@/pages/SessionDetail.vue'
import LegalPage from '@/pages/LegalPage.vue'
import Consent from '@/pages/Consent.vue'
import NotFound from '@/pages/NotFound.vue'
import { updateDocumentTitle } from '@/utils/documentTitle'
import { safeRedirectPath } from '@/utils/safeRedirect'

// Routes that stay reachable while consent is pending (legal texts must be readable).
const CONSENT_EXEMPT_PATHS = ['/consent', '/privacy', '/terms', '/legal', '/oauth-callback']

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: 'pageTitles.home', requiresAuth: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: 'pageTitles.login' },
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { title: 'pageTitles.register' },
  },
  {
    path: '/verify-email',
    name: 'VerifyEmail',
    component: VerifyEmail,
    meta: { title: 'pageTitles.verifyEmail' },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword,
    meta: { title: 'pageTitles.forgotPassword' },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: ResetPassword,
    meta: { title: 'pageTitles.resetPassword' },
  },
  {
    path: '/oauth-callback',
    name: 'OAuthCallback',
    component: OAuthCallback,
    meta: { title: 'pageTitles.signingIn' },
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: Onboarding,
    meta: { title: 'pageTitles.onboarding', requiresAuth: true, hideBottomNav: true },
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: Statistics,
    meta: { title: 'pageTitles.statistics', requiresAuth: true },
  },
  {
    path: '/workout',
    name: 'Workout',
    component: AddWorkout,
    meta: { title: 'pageTitles.addWorkout', requiresAuth: true },
  },
  {
    path: '/log-activity',
    name: 'LogActivity',
    component: LogActivity,
    meta: { title: 'pageTitles.logActivity', requiresAuth: true },
  },
  {
    path: '/workout/:workoutId',
    name: 'WorkoutDetails',
    component: WorkoutDetails,
    meta: { title: 'pageTitles.workout', requiresAuth: true, hideBottomNav: true },
  },
  {
    path: '/session/:sessionId',
    name: 'SessionDetails',
    component: Session,
    meta: { title: 'pageTitles.session', requiresAuth: true },
  },
  {
    path: '/session-summary',
    name: 'SessionSummary',
    component: SessionSummary,
    meta: { title: 'pageTitles.sessionSummary', requiresAuth: true, hideBottomNav: true },
  },
  {
    path: '/session-history/:type/:id',
    name: 'SessionDetail',
    component: SessionDetail,
    meta: { title: 'pageTitles.sessionHistory', requiresAuth: true, hideBottomNav: true },
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: Calendar,
    meta: { title: 'pageTitles.calendar', requiresAuth: true },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { title: 'pageTitles.settings', requiresAuth: true },
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: LegalPage,
    props: { doc: 'privacy' },
    meta: { title: 'pageTitles.privacy', hideBottomNav: true },
  },
  {
    path: '/terms',
    name: 'Terms',
    component: LegalPage,
    props: { doc: 'terms' },
    meta: { title: 'pageTitles.terms', hideBottomNav: true },
  },
  {
    path: '/legal',
    name: 'LegalNotice',
    component: LegalPage,
    props: { doc: 'imprint' },
    meta: { title: 'pageTitles.imprint', hideBottomNav: true },
  },
  {
    path: '/consent',
    name: 'Consent',
    component: Consent,
    meta: { title: 'pageTitles.consent', requiresAuth: true, hideBottomNav: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: { title: 'pageTitles.notFound', hideBottomNav: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore() // Get store instance inside the guard
  const isAuthenticated = authStore.isAuthenticated

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest)

  if (requiresAuth && !isAuthenticated) {
    next({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  } else if (requiresGuest && isAuthenticated) {
    next('/')
  } else if (
    isAuthenticated &&
    authStore.user?.consentRequired === true &&
    !CONSENT_EXEMPT_PATHS.includes(to.path)
  ) {
    // New OAuth users and users who accepted an older terms version must consent first.
    next({ path: '/consent', query: { redirect: safeRedirectPath(to.fullPath) } })
  } else if (
    !CONSENT_EXEMPT_PATHS.includes(to.path) &&
    String(to.name) !== 'NotFound' &&
    isAuthenticated &&
    to.path !== '/onboarding' &&
    authStore.user &&
    !authStore.user.onboardingCompleted
  ) {
    // Redirect to onboarding if not completed (except when already on onboarding page)
    next('/onboarding')
  } else {
    next()
  }
})

router.afterEach(to => {
  updateDocumentTitle(to)
})

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (!localStorage.getItem('vuetify:dynamic-reload')) {
      localStorage.setItem('vuetify:dynamic-reload', 'true')
      location.assign(to.fullPath)
    } else {
      console.error('Dynamic import error, reloading page did not fix it', err)
    }
  } else {
    console.error(err)
  }
})

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
})

export default router
