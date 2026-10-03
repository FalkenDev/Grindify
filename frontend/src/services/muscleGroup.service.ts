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

import type { MuscleGroup } from '@/interfaces/Exercise.interface';
import { fetchWrapper } from '@/utils/fetchWrapper';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8393/v1';

export const fetchAllMuscleGroups = async () => {
  try {
    const data = await fetchWrapper<MuscleGroup[]>(`${apiUrl}/muscleGroups`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching muscle groups:', error);
    throw new Error('Failed to fetch muscle groups');
  }
};

export const getMuscleGroupById = async (id: number) => {
  try {
    const data = await fetchWrapper<MuscleGroup>(`${apiUrl}/muscleGroups/${id}`);
    return data;
  } catch (error) {
    console.error('Error fetching muscle group by ID:', error);
    throw new Error('Failed to fetch muscle group by ID');
  }
};

// Muscle groups are read-only for the app; create/update/delete is superadmin-only
// and handled in the admin panel.
