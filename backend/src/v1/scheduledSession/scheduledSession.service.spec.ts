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

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ScheduledSessionService } from './scheduledSession.service';
import {
  ScheduledSession,
  ScheduledSessionType,
} from './scheduledSession.entity';
import { WorkoutSession } from '../workoutSession/workoutSession.entity';
import { ActivityLog } from '../activityLog/activityLog.entity';
import { Workout } from '../workout/workout.entity';
import { Activity } from '../activity/activity.entity';

const USER_A = 1;
const USER_B = 2;

describe('ScheduledSessionService access control (user A vs user B)', () => {
  let service: ScheduledSessionService;
  let scheduledRepo: any;

  beforeEach(async () => {
    const owned = (ownerId: number) =>
      jest.fn(async ({ where }: any) =>
        where.createdBy?.id === ownerId ? { id: where.id } : null,
      );
    scheduledRepo = {
      create: jest.fn((d: any) => d),
      save: jest.fn(async (d: any) => ({ ...d, id: 7 })),
      findOne: jest.fn(async ({ where }: any) =>
        where.user?.id === USER_A
          ? {
              id: where.id,
              type: ScheduledSessionType.ACTIVITY,
              workout: null,
              activity: { id: 3 },
            }
          : null,
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduledSessionService,
        {
          provide: getRepositoryToken(ScheduledSession),
          useValue: scheduledRepo,
        },
        { provide: getRepositoryToken(WorkoutSession), useValue: {} },
        { provide: getRepositoryToken(ActivityLog), useValue: {} },
        // workouts belong to user B, activities to user A
        {
          provide: getRepositoryToken(Workout),
          useValue: { findOne: owned(USER_B) },
        },
        {
          provide: getRepositoryToken(Activity),
          useValue: { findOne: owned(USER_A) },
        },
      ],
    }).compile();

    service = module.get(ScheduledSessionService);
  });

  it("user A cannot schedule user B's workout", async () => {
    await expect(
      service.create(USER_A, {
        type: ScheduledSessionType.WORKOUT,
        workoutId: 5,
        isRecurring: false,
        scheduledDate: '2026-10-01',
      } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(scheduledRepo.save).not.toHaveBeenCalled();
  });

  it('only stores the reference matching the type (smuggled workoutId is dropped)', async () => {
    await service.create(USER_A, {
      type: ScheduledSessionType.ACTIVITY,
      activityId: 3,
      workoutId: 5, // user B's workout
      isRecurring: false,
      scheduledDate: '2026-10-01',
    } as any);
    expect(scheduledRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ workout: null, activity: { id: 3 } }),
    );
  });

  it("user A cannot point an existing schedule at user B's workout", async () => {
    await expect(
      service.update(USER_A, 7, {
        type: ScheduledSessionType.WORKOUT,
        workoutId: 5,
      } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(scheduledRepo.save).not.toHaveBeenCalled();
  });

  it('rejects unbounded date ranges', async () => {
    await expect(
      service.findForDateRange(USER_A, '2000-01-01', '2030-01-01'),
    ).rejects.toThrow();
  });
});
