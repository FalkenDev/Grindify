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

import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { Activity, ActivityLog } from '@/interfaces/Activity.interface';
import * as activityService from '@/services/activity.service';
import * as activityLogService from '@/services/activityLog.service';
import { useAuthStore } from './auth.store';

export const useActivityStore = defineStore(
  'activityStore',
  () => {
    const authStore = useAuthStore();
    const activities = ref<Activity[]>([]);
    const activityLogs = ref<ActivityLog[]>([]);
    const isLoadingActivities = ref<boolean>(false);
    const isLoadingLogs = ref<boolean>(false);
    const lastFetchedActivities = ref<number | null>(null);
    const lastFetchedLogs = ref<number | null>(null);
    const cacheDuration = 10 * 1000;

    const fetchActivities = async (reload = false) => {
      // Never fetch user data without a session (e.g. during/after logout).
      if (!authStore.isAuthenticated) return;
      const now = Date.now();
      if (
        activities.value &&
        !reload &&
        lastFetchedActivities.value &&
        now - lastFetchedActivities.value < cacheDuration
      ) {
        return;
      }

      try {
        isLoadingActivities.value = true;
        activities.value = await activityService.fetchAllActivities();
        lastFetchedActivities.value = now;
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        isLoadingActivities.value = false;
      }
    };

    const fetchActivityLogs = async (reload = false) => {
      if (!authStore.isAuthenticated) return;
      const now = Date.now();
      if (
        activityLogs.value &&
        !reload &&
        lastFetchedLogs.value &&
        now - lastFetchedLogs.value < cacheDuration
      ) {
        return;
      }

      try {
        isLoadingLogs.value = true;
        activityLogs.value = await activityLogService.fetchAllActivityLogs();
        lastFetchedLogs.value = now;
      } catch (error) {
        console.error('Error fetching activity logs:', error);
      } finally {
        isLoadingLogs.value = false;
      }
    };

    // Only fetch when authenticated
    watch(
      () => authStore.isAuthenticated,
      (authed) => {
        if (authed) {
          void fetchActivities(true);
          void fetchActivityLogs(true);
        }
      },
      { immediate: true },
    );

    const resetStore = async () => {
      activities.value = [];
      activityLogs.value = [];
      isLoadingActivities.value = false;
      isLoadingLogs.value = false;
      lastFetchedActivities.value = null;
      lastFetchedLogs.value = null;
      if (authStore.isAuthenticated) {
        await fetchActivities(true);
        await fetchActivityLogs(true);
      }
    };

    return {
      activities,
      activityLogs,
      isLoadingActivities,
      isLoadingLogs,
      fetchActivities,
      fetchActivityLogs,
      resetStore,
    };
  },
);
