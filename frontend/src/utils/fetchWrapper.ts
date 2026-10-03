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

import router from '@/router';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'vuetify-sonner';
import i18n from '@/plugins/i18n';
import { getSessionGeneration, isAuthEndpoint, shouldEndSession } from '@/utils/sessionGuard';

/**
 * Error thrown for non-2xx responses. The message keeps the historical
 * "HTTP error! Status: X. Body: ..." format so existing `message.includes(...)`
 * checks keep working, while `status` allows reliable status handling.
 */
export class HttpError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(`HTTP error! Status: ${status}. Body: ${body}`);
    this.name = 'HttpError';
    this.status = status;
    this.body = body;
  }
}

export const isRateLimitError = (error: unknown): boolean =>
  error instanceof HttpError
    ? error.status === 429
    : error instanceof Error && error.message.includes('Status: 429');

export const fetchWrapper = async <T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<T> => {
  // Remember which session this request belongs to, so a late 401 from a request
  // started before a logout/login can't end the (new) session.
  const generationAtStart = getSessionGeneration();
  try {
    const mergedOptions: RequestInit = {
      ...options,
      credentials: 'include',
    };

    const headers = new Headers(mergedOptions.headers || {});
    if (
      mergedOptions.body &&
      typeof mergedOptions.body === 'string' &&
      !headers.has('Content-Type')
    ) {
      headers.set('Content-Type', 'application/json');
    }
    mergedOptions.headers = headers;

    const response = await fetch(url, mergedOptions);

    // Auth endpoints use 401/403 for bad credentials / unverified email: surface
    // them as HttpError so callers can inspect the body, never as a session expiry.
    const authEndpoint = isAuthEndpoint(url);

    if (response.status === 401 && !authEndpoint) {
      await handleUnauthorized(url, generationAtStart);
      return Promise.reject('401 Unauthorized');
    }

    if (response.status === 403 && !authEndpoint) {
      const errorText = await response.text();
      const code = consentErrorCode(errorText);
      if (code === 'CONSENT_REQUIRED') {
        await handleConsentRequired();
        return Promise.reject(new HttpError(403, errorText));
      }
      if (code === 'HEALTH_CONSENT_REQUIRED') {
        handleHealthConsentRequired();
        return Promise.reject(new HttpError(403, errorText));
      }
      await handleForbidden(url, generationAtStart);
      return Promise.reject('403 Forbidden');
    }

    if (!response.ok) {
      const errorText = await response.text();
      
      // Check for 404 User not found error
      if (response.status === 404) {
        try {
          const errorBody = JSON.parse(errorText);
          if (errorBody.message === 'User not found') {
            await handleUserNotFound(url, generationAtStart);
            return Promise.reject('User not found - logged out');
          }
        } catch {
          // Not JSON or different error, continue with normal error handling
        }
      }
      
      throw new HttpError(response.status, errorText);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return (await response.json()) as T;
    }
    return (await response.text()) as unknown as T;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

const consentErrorCode = (text: string): 'CONSENT_REQUIRED' | 'HEALTH_CONSENT_REQUIRED' | null => {
  try {
    const body = JSON.parse(text) as { code?: unknown };
    return body?.code === 'CONSENT_REQUIRED' || body?.code === 'HEALTH_CONSENT_REQUIRED'
      ? body.code
      : null;
  } catch {
    return null;
  }
};

let lastHealthConsentToast = 0;

/**
 * Health data consent is optional: don't redirect, just mark it as missing so the
 * affected features show HealthConsentPrompt, and tell the user why it failed.
 */
const handleHealthConsentRequired = () => {
  const authStore = useAuthStore();
  authStore.markHealthConsentMissing();
  const now = Date.now();
  if (now - lastHealthConsentToast > 5000) {
    lastHealthConsentToast = now;
    toast.info(i18n.global.t('healthConsent.requiredToast'), { progressBar: true, duration: 5000 });
  }
};

const handleConsentRequired = async () => {
  const authStore = useAuthStore();
  authStore.markConsentRequired();
  const current = router.currentRoute.value;
  if (current.path !== '/consent') {
    console.warn('403 CONSENT_REQUIRED: Redirecting to consent page...');
    router.push({ path: '/consent', query: { redirect: current.fullPath } });
  }
};

/**
 * Session-ending handlers. They only log out when it is the current, still
 * authenticated session that was rejected: never while a logout is already
 * running, when nobody is logged in, or for requests started before the last
 * login/logout. This prevents 401 -> logout -> refetch -> 401 loops.
 */
const endSession = async (url: string, generationAtStart: number, reason: string) => {
  const authStore = useAuthStore();
  if (!shouldEndSession({ url, generationAtStart, isAuthenticated: authStore.isAuthenticated })) {
    return;
  }
  console.warn(`${reason}: Logging out and redirecting to login...`);
  // The session is already invalid server-side for a 401, so skip the logout call.
  await authStore.logout({ callApi: reason !== '401 Unauthorized' });
  if (router.currentRoute.value.path !== '/login') {
    await router.push('/login');
  }
};

const handleUnauthorized = (url: string, generationAtStart: number) =>
  endSession(url, generationAtStart, '401 Unauthorized');

const handleForbidden = (url: string, generationAtStart: number) =>
  endSession(url, generationAtStart, '403 Forbidden');

const handleUserNotFound = (url: string, generationAtStart: number) =>
  endSession(url, generationAtStart, 'User not found');
