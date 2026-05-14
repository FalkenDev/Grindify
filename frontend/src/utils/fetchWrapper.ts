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

export const fetchWrapper = async <T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<T> => {
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

    if (response.status === 401) {
      await handleUnauthorized();
      return Promise.reject('401 Unauthorized');
    }

    if (response.status === 403) {
      await handleForbidden();
      return Promise.reject('403 Forbidden');
    }

    if (!response.ok) {
      const errorText = await response.text();
      
      // Check for 404 User not found error
      if (response.status === 404) {
        try {
          const errorBody = JSON.parse(errorText);
          if (errorBody.message === 'User not found') {
            await handleUserNotFound();
            return Promise.reject('User not found - logged out');
          }
        } catch {
          // Not JSON or different error, continue with normal error handling
        }
      }
      
      throw new Error(
        `HTTP error! Status: ${response.status}. Body: ${errorText}`,
      );
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

const handleUnauthorized = async () => {
  const authStore = useAuthStore();
  await authStore.logout();
  console.warn('401 Unauthorized: Redirecting to login...');
  router.push('/login');
};

const handleForbidden = async () => {
  const authStore = useAuthStore();
  await authStore.logout();
  console.warn('403 Forbidden: Redirecting to login...');
  router.push('/login');
};

const handleUserNotFound = async () => {
  const authStore = useAuthStore();
  await authStore.logout();
  console.warn('User not found: Logging out and redirecting to login...');
  router.push('/login');
};
