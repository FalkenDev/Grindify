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
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { WorkoutSessionService } from './workoutSession.service';
import { WorkoutSession } from './workoutSession.entity';
import { Workout } from '../workout/workout.entity';
import { Exercise } from '../exercise/exercise.entity';
import { WorkoutSessionExercise } from './workoutSessionExercise.entity';
import { WorkoutSessionSet } from './workoutSessionSet.entity';
import { UserService } from '../user/user.service';
import { StatisticsService } from '../statistics/statistics.service';

const USER_A = 1;
const USER_B = 2;

describe('WorkoutSessionService access control (user A vs user B)', () => {
  let service: WorkoutSessionService;
  let workoutRepo: any;
  let sessionRepo: any;
  let exerciseRepo: any;

  beforeEach(async () => {
    // Workout 5 belongs to user B only
    workoutRepo = {
      findOne: jest.fn(async ({ where }: any) =>
        where.id === 5 && where.createdBy?.id === USER_B
          ? { id: 5, exercises: [] }
          : null,
      ),
      exists: jest.fn(async ({ where }: any) => where.createdBy?.id === USER_B),
    };
    const manager = {
      exists: jest.fn(async () => false),
      findOne: jest.fn(async () => null),
    };
    sessionRepo = {
      manager,
      findOne: jest.fn(),
      create: jest.fn((d: any) => d),
      save: jest.fn(async (d: any) => ({ ...d, id: 1 })),
    };
    exerciseRepo = { manager };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkoutSessionService,
        { provide: getRepositoryToken(WorkoutSession), useValue: sessionRepo },
        { provide: getRepositoryToken(Workout), useValue: workoutRepo },
        { provide: getRepositoryToken(Exercise), useValue: exerciseRepo },
        { provide: getRepositoryToken(WorkoutSessionExercise), useValue: {} },
        { provide: getRepositoryToken(WorkoutSessionSet), useValue: {} },
        { provide: DataSource, useValue: {} },
        { provide: UserService, useValue: {} },
        { provide: StatisticsService, useValue: {} },
      ],
    }).compile();

    service = module.get(WorkoutSessionService);
  });

  it("user A cannot start a session from user B's workout", async () => {
    await expect(service.createSession(5, USER_A)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(workoutRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 5, createdBy: { id: USER_A } },
      }),
    );
    expect(sessionRepo.save).not.toHaveBeenCalled();
  });

  it('user B can start a session from their own workout', async () => {
    await expect(service.createSession(5, USER_B)).resolves.toMatchObject({
      id: 1,
    });
  });

  it("user A cannot link an empty session to user B's scheduled session", async () => {
    await expect(service.createEmptySession(USER_A, 99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(sessionRepo.save).not.toHaveBeenCalled();
  });

  it("user A cannot add user B's private exercise to a session", async () => {
    sessionRepo.findOne.mockResolvedValue({ id: 1, exercises: [] });
    await expect(
      service.addExerciseToSession(1, 12, USER_A, []),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("hides a legacy link to another user's workout template", async () => {
    sessionRepo.findOne.mockResolvedValue({
      id: 1,
      exercises: [],
      workout: { id: 5, exercises: [] },
    });
    const session = await service.getOneSession(1, USER_A);
    expect(session.workout).toBeNull();
  });
});
