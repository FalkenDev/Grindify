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

import { NotFoundException } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { Exercise } from '../exercise/exercise.entity';
import { ScheduledSession } from '../scheduledSession/scheduledSession.entity';

/**
 * Ownership helpers for IDs that arrive in request bodies. A user may only
 * reference their own resources — and, for exercises, global ones. Other
 * users' resources are reported as "not found" (never 403) so their
 * existence is not revealed.
 */

/** where-clause: exercise is global OR owned by the user. */
export function accessibleExerciseWhere(id: number, userId: number) {
  return [
    { id, isGlobal: true },
    { id, createdBy: { id: userId } },
  ];
}

export async function findAccessibleExercise(
  manager: EntityManager,
  id: number,
  userId: number,
  relations: string[] = [],
): Promise<Exercise> {
  const exercise = await manager.findOne(Exercise, {
    where: accessibleExerciseWhere(id, userId),
    relations,
    withDeleted: true,
  });
  if (!exercise) throw new NotFoundException(`Exercise ${id} not found`);
  return exercise;
}

export async function assertAccessibleExercises(
  manager: EntityManager,
  ids: number[],
  userId: number,
): Promise<void> {
  const unique = [...new Set(ids)];
  if (!unique.length) return;
  const found = await manager.find(Exercise, {
    where: [
      { id: In(unique), isGlobal: true },
      { id: In(unique), createdBy: { id: userId } },
    ],
    select: ['id'],
    withDeleted: true,
  });
  const foundIds = new Set(found.map((e) => e.id));
  const missing = unique.find((id) => !foundIds.has(id));
  if (missing !== undefined) {
    throw new NotFoundException(`Exercise ${missing} not found`);
  }
}

/** Throws 404 unless the scheduled session exists and belongs to the user. */
export async function assertOwnedScheduledSession(
  manager: EntityManager,
  id: number | null | undefined,
  userId: number,
): Promise<void> {
  if (id === undefined || id === null) return;
  const exists = await manager.exists(ScheduledSession, {
    where: { id, user: { id: userId } },
  });
  if (!exists) throw new NotFoundException('Scheduled session not found');
}
