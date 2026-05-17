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

import { fetchWrapper } from '@/utils/fetchWrapper';
import type { Activity, CreateActivityDto } from '@/interfaces/Activity.interface';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8393/v1';

export const fetchAllActivities = async (filter: 'all' | 'global' | 'mine' = 'all') => {
  try {
    const data = await fetchWrapper<Activity[]>(`${apiUrl}/activity?filter=${filter}`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw new Error('Failed to fetch activities');
  }
};

export const duplicateActivity = async (activityId: number, transferStats: boolean = false) => {
  try {
    const data = await fetchWrapper<Activity>(`${apiUrl}/activity/${activityId}/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transferStats }),
    });
    return data;
  } catch (error) {
    console.error('Error duplicating activity:', error);
    throw new Error('Failed to duplicate activity');
  }
};

export const fetchActivityById = async (activityId: number) => {
  try {
    const data = await fetchWrapper<Activity>(`${apiUrl}/activity/${activityId}`);
    return data;
  } catch (error) {
    console.error('Error fetching activity:', error);
    throw new Error('Failed to fetch activity');
  }
};

export const createActivity = async (activity: CreateActivityDto) => {
  try {
    const data = await fetchWrapper<Activity>(`${apiUrl}/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activity),
    });
    return data;
  } catch (error) {
    console.error('Error creating activity:', error);
    throw new Error('Failed to create activity');
  }
};

export const updateActivity = async (
  activityId: number,
  activity: Partial<CreateActivityDto>,
) => {
  try {
    const data = await fetchWrapper<Activity>(`${apiUrl}/activity/${activityId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activity),
    });
    return data;
  } catch (error) {
    console.error('Error updating activity:', error);
    throw new Error('Failed to update activity');
  }
};

export const deleteActivity = async (activityId: number) => {
  try {
    await fetchWrapper(`${apiUrl}/activity/${activityId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error deleting activity:', error);
    throw new Error('Failed to delete activity');
  }
};
