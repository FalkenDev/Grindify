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
import {
  assertAccessibleExercises,
  assertOwnedScheduledSession,
  findAccessibleExercise,
} from './ownership.util';

/**
 * Access tests (user A = 1, user B = 2) for IDs referenced in request bodies,
 * using an in-memory fake of the TypeORM EntityManager.
 */
const USER_A = 1;
const USER_B = 2;

const exercises = [
  { id: 10, isGlobal: true, createdById: null },
  { id: 11, isGlobal: false, createdById: USER_A },
  { id: 12, isGlobal: false, createdById: USER_B },
];
const scheduled = [
  { id: 20, userId: USER_A },
  { id: 21, userId: USER_B },
];

function matches(row: any, where: any): boolean {
  const ids = where.id?._type === 'in' ? where.id._value : [where.id];
  if (!ids.includes(row.id)) return false;
  if (where.isGlobal !== undefined && row.isGlobal !== where.isGlobal)
    return false;
  if (where.createdBy && row.createdById !== where.createdBy.id) return false;
  if (where.user && row.userId !== where.user.id) return false;
  return true;
}

function fakeManager() {
  const filter = (rows: any[], where: any) => {
    const clauses = Array.isArray(where) ? where : [where];
    return rows.filter((r) => clauses.some((c) => matches(r, c)));
  };
  const table = (entity: any) =>
    entity.name === 'Exercise' ? exercises : scheduled;
  return {
    findOne: jest.fn(
      async (entity: any, opts: any) =>
        filter(table(entity), opts.where)[0] ?? null,
    ),
    find: jest.fn(async (entity: any, opts: any) =>
      filter(table(entity), opts.where),
    ),
    exists: jest.fn(
      async (entity: any, opts: any) =>
        filter(table(entity), opts.where).length > 0,
    ),
  } as any;
}

describe('ownership.util (user A vs user B)', () => {
  it('allows global exercises and own exercises', async () => {
    const m = fakeManager();
    await expect(findAccessibleExercise(m, 10, USER_A)).resolves.toMatchObject({
      id: 10,
    });
    await expect(findAccessibleExercise(m, 11, USER_A)).resolves.toMatchObject({
      id: 11,
    });
    await expect(
      assertAccessibleExercises(m, [10, 11], USER_A),
    ).resolves.toBeUndefined();
  });

  it("rejects another user's private exercise with 404", async () => {
    const m = fakeManager();
    await expect(findAccessibleExercise(m, 12, USER_A)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      assertAccessibleExercises(m, [10, 12], USER_A),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejects another user's scheduled session with 404", async () => {
    const m = fakeManager();
    await expect(
      assertOwnedScheduledSession(m, 20, USER_A),
    ).resolves.toBeUndefined();
    await expect(
      assertOwnedScheduledSession(m, 21, USER_A),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('ignores a missing scheduled session id', async () => {
    const m = fakeManager();
    await expect(
      assertOwnedScheduledSession(m, undefined, USER_A),
    ).resolves.toBeUndefined();
    expect(m.exists).not.toHaveBeenCalled();
  });
});
