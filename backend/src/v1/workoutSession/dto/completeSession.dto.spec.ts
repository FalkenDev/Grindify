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

import { plainToInstance } from 'class-transformer';
import { validate, ValidatorOptions } from 'class-validator';
import { VALIDATION_PIPE_OPTIONS } from '../../common/constants';
import { CompleteSessionDto } from './completeSession.dto';
import { AddExerciseToSessionDto } from './addExerciseToSession.dto';
import { LogPastWorkoutSessionDto } from './logPastWorkoutSession.dto';

/**
 * Transform + validate a plain payload the same way the global
 * ValidationPipe in main.ts does.
 */
async function validateLikePipe<T extends object>(
  cls: new () => T,
  plain: unknown,
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { transform, transformOptions, ...validatorOptions } =
    VALIDATION_PIPE_OPTIONS;
  const instance = plainToInstance(cls, plain, transformOptions);
  const errors = await validate(
    instance as object,
    validatorOptions as ValidatorOptions,
  );
  return { instance, errors };
}

describe('CompleteSessionDto', () => {
  // Decimal columns are serialized as strings ("10.00") and the frontend
  // sends them back unchanged when a set is not edited.
  const payload = {
    completedExercises: [
      {
        exerciseId: 1,
        rpe: 8,
        notes: '',
        sets: [
          { setNumber: 1, weight: '10.00', reps: 10 },
          { setNumber: 2, weight: 12.5, reps: '8' },
          { setNumber: 3, weight: null, reps: 5 },
        ],
      },
    ],
    notes: '',
  };

  it('accepts decimal strings such as "10.00" and converts them to numbers', async () => {
    const { instance, errors } = await validateLikePipe(
      CompleteSessionDto,
      payload,
    );

    expect(errors).toEqual([]);
    const sets = instance.completedExercises![0].sets;
    expect(sets[0].weight).toBe(10);
    expect(typeof sets[0].weight).toBe('number');
    expect(sets[1].reps).toBe(8);
    expect(sets[2].weight).toBeNull();
  });

  it('still rejects non-numeric strings', async () => {
    const { errors } = await validateLikePipe(CompleteSessionDto, {
      completedExercises: [
        { exerciseId: 1, sets: [{ setNumber: 1, weight: 'abc', reps: 5 }] },
      ],
    });

    expect(errors.length).toBeGreaterThan(0);
  });

  it('still rejects unknown properties (forbidNonWhitelisted)', async () => {
    const { errors } = await validateLikePipe(CompleteSessionDto, {
      ...payload,
      unexpected: true,
    });

    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('other session DTOs accept decimal strings', () => {
  it('AddExerciseToSessionDto', async () => {
    const { instance, errors } = await validateLikePipe(
      AddExerciseToSessionDto,
      {
        exerciseId: '3',
        sets: [{ setNumber: 1, weight: '62.50', reps: '10', rpe: '8' }],
      },
    );

    expect(errors).toEqual([]);
    expect(instance.sets[0].weight).toBe(62.5);
  });

  it('LogPastWorkoutSessionDto', async () => {
    const { instance, errors } = await validateLikePipe(
      LogPastWorkoutSessionDto,
      {
        workoutId: 1,
        startedAt: '2026-01-10T10:00:00.000Z',
        endedAt: '2026-01-10T11:00:00.000Z',
        completedExercises: [
          { exerciseId: 2, sets: [{ setNumber: 1, weight: '40.00', reps: 8 }] },
        ],
      },
    );

    expect(errors).toEqual([]);
    expect(instance.completedExercises![0].sets[0].weight).toBe(40);
  });
});
