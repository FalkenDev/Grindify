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

// Utilities
import { useRouter } from 'vue-router';
import { defineStore } from 'pinia';
import { toast } from 'vuetify-sonner';
import { useWorkoutStore } from './workout.store';
import { useExerciseStore } from './exercise.store';
import { useMuscleGroupStore } from './muscleGroup.store';
import { useWorkoutSessionStore } from './workoutSession.store';
import { useActivityStore } from './activity.store';
import { useProgressPhotoStore } from './progressPhoto.store';
import { useScheduledSessionStore } from './scheduledSession.store';
import { useWeightLogStore } from './weightLog.store';
import { fetchWrapper, isRateLimitError } from '@/utils/fetchWrapper';
import { bumpSessionGeneration, runExclusiveLogout } from '@/utils/sessionGuard';
import type { User } from '@/interfaces/User.interface';
import i18n from '@/plugins/i18n';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8393/v1';

// localStorage keys written by pinia-plugin-persistedstate for user-specific stores.
// The 'app' store (locale, dark mode) is a device preference and is intentionally kept.
const PERSISTED_USER_STORE_KEYS = [
  'authStore',
  'workoutStore',
  'exerciseStore',
  'muscleGroupStore',
  'workoutSessionStore',
];
// Prefixes of other user-specific localStorage keys.
const USER_LOCAL_STORAGE_PREFIXES = ['personalized_dismissed_'];
// Service worker runtime caches that may contain user data.
const USER_CACHE_NAMES = ['api-cache', 'upload-cache'];

/**
 * Split a full name on the first whitespace: the first word is the first name
 * and everything after it is the last name ("Anna Maria Svensson" -> "Anna", "Maria Svensson").
 */
export const splitFullName = (fullName: string): { firstName: string; lastName: string } => {
  const trimmed = fullName.trim();
  const match = trimmed.match(/^(\S+)\s+([\s\S]*)$/);
  if (!match) return { firstName: trimmed, lastName: '' };
  return { firstName: match[1], lastName: match[2].trim() };
};

const clearUserLocalStorage = () => {
  try {
    for (const key of PERSISTED_USER_STORE_KEYS) localStorage.removeItem(key);
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && USER_LOCAL_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
};

const clearUserCaches = async () => {
  try {
    if (typeof caches === 'undefined') return;
    await Promise.all(USER_CACHE_NAMES.map((name) => caches.delete(name)));
  } catch (error) {
    console.error('Failed to clear caches:', error);
  }
};

export const useAuthStore = defineStore(
  'authStore',
  () => {
    const router = useRouter();
    const loading = ref(false);
    const isAuthenticated = ref(false);
    const user = ref();
    const token = ref('');

    const login = async (email: string, password: string) => {
      loading.value = true;
      try {
        const data = await fetchWrapper<{ user: User }>(`${apiUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        bumpSessionGeneration();
        isAuthenticated.value = true;
        user.value = data.user;
        token.value = '';

        // Give the browser a tick to persist Set-Cookie before fetching protected resources.
        await new Promise((resolve) => setTimeout(resolve, 0));

        await useWorkoutStore().resetStore();
        await useExerciseStore().resetStore();
        await useMuscleGroupStore().resetStore();
        await useWorkoutSessionStore().resetStore();

        router.push('/');
        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '';
        if (errorMessage.includes('email_not_verified')) {
          toast.info(i18n.global.t('auth.emailNotVerifiedToast'), { progressBar: true, duration: 3000 });
          router.push({ path: '/verify-email', query: { email } });
          isAuthenticated.value = false;
          throw error;
        }
        console.error('Login failed:', error);
        toast.error(
          i18n.global.t(isRateLimitError(error) ? 'auth.tooManyAttempts' : 'auth.loginFailed'),
          { progressBar: true, duration: 5000 },
        );
        isAuthenticated.value = false;
        throw error;
      } finally {
        loading.value = false;
      }
    };

    /**
     * Log out: invalidate the session server-side (clears the httpOnly cookie and
     * bumps tokenVersion), then wipe all user data kept on the device. Local
     * cleanup always runs, even if the API call fails (e.g. offline).
     *
     * The auth state is cleared first so no store re-fetches user data while the
     * rest of the cleanup runs (that used to cause a 401 -> logout -> refetch loop),
     * and concurrent/repeated calls are coalesced into one logout.
     */
    const logout = (options: { callApi?: boolean } = {}): Promise<void> => {
      const { callApi = true } = options;
      return runExclusiveLogout(async () => {
        resetStore();

        if (callApi) {
          try {
            // Plain fetch (not fetchWrapper) so a 401 here can't recurse into logout again.
            await fetch(`${apiUrl}/auth/logout`, { method: 'POST', credentials: 'include' });
          } catch (error) {
            console.error('Logout request failed:', error);
          }
        }

        try {
          await Promise.all([
            useWorkoutStore().resetStore(),
            useExerciseStore().resetStore(),
            useMuscleGroupStore().resetStore(),
            useWorkoutSessionStore().resetStore(),
            useActivityStore().resetStore(),
          ]);
          useProgressPhotoStore().resetStore();
          useScheduledSessionStore().resetStore();
          useWeightLogStore().resetStore();
        } catch (error) {
          console.error('Failed to reset stores on logout:', error);
        }

        // Let the persistence plugin flush the reset state before removing the keys.
        await nextTick();
        clearUserLocalStorage();
        await clearUserCaches();

        if (router?.currentRoute.value.path !== '/login') {
          await router?.push('/login');
        }
      });
    };

    const createAccount = async (registerData: {
      fullName: string;
      email: string;
      password: string;
      termsAccepted: boolean;
      /** Optional: consent to health data processing can be given (or not) freely. */
      healthDataConsent: boolean;
    }): Promise<boolean> => {
      loading.value = true;
      try {
        const { firstName, lastName } = splitFullName(registerData.fullName);

        const registeredUser = await fetchWrapper<{ emailVerified: boolean }>(`${apiUrl}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName,
            lastName,
            email: registerData.email,
            password: registerData.password,
            termsAccepted: registerData.termsAccepted,
            ...(registerData.healthDataConsent ? { healthDataConsent: true } : {}),
          }),
        });

        if (registeredUser.emailVerified) {
          // Email verification is disabled — auto-login
          await login(registerData.email, registerData.password);
        } else {
          // Email verification is required — redirect to verify page
          router.push({ path: '/verify-email', query: { email: registerData.email } });
        }
        return true;
      } catch (error) {
        console.error('Account creation failed:', error);
        const errorMessage = error instanceof Error ? error.message : '';

        if (errorMessage.includes('User already exists')) {
          toast.error(i18n.global.t('auth.accountAlreadyExists'), { progressBar: true, duration: 5000 });
          return false;
        }

        if (isRateLimitError(error)) {
          toast.error(i18n.global.t('auth.tooManyAttempts'), { progressBar: true, duration: 5000 });
          return false;
        }

        toast.error(i18n.global.t('auth.accountCreationFailed'), { progressBar: true, duration: 5000 });
        return false;
      } finally {
        loading.value = false;
      }
    };

    const verifyEmail = async (email: string, code: string): Promise<void> => {
      const data = await fetchWrapper<{ user: User }>(`${apiUrl}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      bumpSessionGeneration();
      isAuthenticated.value = true;
      user.value = data.user;
      token.value = '';
    };

    const resendVerification = async (email: string): Promise<void> => {
      await fetchWrapper(`${apiUrl}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    };

    const forgotPassword = async (email: string): Promise<void> => {
      await fetchWrapper(`${apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    };

    const resetPassword = async (email: string, code: string, newPassword: string): Promise<void> => {
      await fetchWrapper(`${apiUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });
    };

    const setUserFromOAuth = (oauthUser: User) => {
      bumpSessionGeneration();
      isAuthenticated.value = true;
      user.value = oauthUser;
      token.value = '';
    };

    /** Whether the user has consented to health data processing (weight, measurements, photos). */
    const hasHealthConsent = computed<boolean>(() => {
      const u = user.value as User | null | undefined;
      if (!u) return false;
      return u.healthDataConsent ?? !!u.healthDataConsentAt;
    });

    /**
     * Accept (or renew) the current terms/privacy policy. Health data consent is
     * optional and only sent when the user explicitly ticked it.
     */
    const giveConsent = async (healthDataConsent = false): Promise<User> => {
      const data = await fetchWrapper<User>(`${apiUrl}/users/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termsAccepted: true, ...(healthDataConsent ? { healthDataConsent: true } : {}) }),
      });
      user.value = data;
      return data;
    };

    /** Give consent to health data processing (enables weight, measurements and progress photos). */
    const giveHealthConsent = async (): Promise<User> => {
      const data = await fetchWrapper<User>(`${apiUrl}/users/consent/health`, {
        method: 'POST',
      });
      user.value = data;
      void useWeightLogStore().refreshAll();
      void useProgressPhotoStore().fetchPhotos(true);
      return data;
    };

    /**
     * Withdraw consent to health data processing. The backend deletes weight logs,
     * progress photos and body measurements.
     */
    const withdrawHealthConsent = async (): Promise<User> => {
      const data = await fetchWrapper<User>(`${apiUrl}/users/consent/health`, {
        method: 'DELETE',
      });
      user.value = data;
      useWeightLogStore().resetStore();
      useProgressPhotoStore().resetStore();
      return data;
    };

    /** Called when the API rejects a request with 403 CONSENT_REQUIRED. */
    const markConsentRequired = () => {
      if (user.value) user.value = { ...user.value, consentRequired: true };
    };

    /** Called when the API rejects a request with 403 HEALTH_CONSENT_REQUIRED. */
    const markHealthConsentMissing = () => {
      if (user.value) {
        user.value = { ...user.value, healthDataConsent: false, healthDataConsentAt: null };
      }
    };

    const resetStore = () => {
      isAuthenticated.value = false;
      user.value = null;
      token.value = '';
      loading.value = false;
    };

    const refreshUser = async () => {
      try {
        const data = await fetchWrapper<User>(`${apiUrl}/users`);
        user.value = data;
        return data;
      } catch (error) {
        console.error('Failed to refresh user data:', error);
        throw error;
      }
    };

    return {
      isAuthenticated,
      user,
      token,
      loading,
      login,
      logout,
      createAccount,
      verifyEmail,
      resendVerification,
      forgotPassword,
      resetPassword,
      setUserFromOAuth,
      hasHealthConsent,
      giveConsent,
      giveHealthConsent,
      withdrawHealthConsent,
      markConsentRequired,
      markHealthConsentMissing,
      resetStore,
      refreshUser,
    };
  },
  {
    persist: {
      pick: ['isAuthenticated', 'user', 'token'],
    },
  },
);
