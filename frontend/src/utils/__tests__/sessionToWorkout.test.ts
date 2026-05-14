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

import { describe, it, expect } from 'vitest'
import { mapSessionToWorkoutInitialData } from '../sessionToWorkout'
import type { WorkoutSession } from '@/interfaces/workoutSession.interface'

const baseSession: WorkoutSession = {
  id: 1,
  userId: 1,
  startedAt: '2026-04-08T10:00:00Z',
  endedAt: '2026-04-08T11:00:00Z',
  status: 'finished',
  workout: null,
  exercises: [
    {
      exerciseId: 10,
      exercise: { id: 10, name: 'Bench Press' } as unknown as NonNullable<WorkoutSession['exercises'][0]['exercise']>,
      sets: [
        { setNumber: 1, weight: 80, reps: 10 },
        { setNumber: 2, weight: 85, reps: 8 },
        { setNumber: 3, weight: 90, reps: 6 },
      ],
    },
    {
      exerciseId: 20,
      exercise: { id: 20, name: 'Squat' } as unknown as NonNullable<WorkoutSession['exercises'][0]['exercise']>,
      sets: [
        { setNumber: 1, weight: 100, reps: 5 },
      ],
    },
  ],
  totalWeight: 5000,
  exerciseStats: [],
  createdAt: '2026-04-08T10:00:00Z',
  updatedAt: '2026-04-08T11:00:00Z',
}

describe('mapSessionToWorkoutInitialData', () => {
  it('maps exercise count correctly', () => {
    const result = mapSessionToWorkoutInitialData(baseSession)
    expect(result.exercises).toHaveLength(2)
  })

  it('uses exercise.id from the exercise object', () => {
    const result = mapSessionToWorkoutInitialData(baseSession)
    expect(result.exercises[0].exerciseId).toBe(10)
    expect(result.exercises[1].exerciseId).toBe(20)
  })

  it('falls back to exerciseId when exercise object is absent', () => {
    const session: WorkoutSession = {
      ...baseSession,
      exercises: [{ exerciseId: 99, exercise: undefined, sets: [] }],
    }
    const result = mapSessionToWorkoutInitialData(session)
    expect(result.exercises[0].exerciseId).toBe(99)
  })

  it('sets sets count to number of completed sets', () => {
    const result = mapSessionToWorkoutInitialData(baseSession)
    expect(result.exercises[0].sets).toBe(3)
    expect(result.exercises[1].sets).toBe(1)
  })

  it('uses last set reps and weight as defaults', () => {
    const result = mapSessionToWorkoutInitialData(baseSession)
    expect(result.exercises[0].reps).toBe(6)
    expect(result.exercises[0].weight).toBe(90)
  })

  it('defaults to 1 set, 10 reps, 0 weight when sets array is empty', () => {
    const session: WorkoutSession = {
      ...baseSession,
      exercises: [{ exerciseId: 5, exercise: undefined, sets: [] }],
    }
    const result = mapSessionToWorkoutInitialData(session)
    expect(result.exercises[0].sets).toBe(1)
    expect(result.exercises[0].reps).toBe(10)
    expect(result.exercises[0].weight).toBe(0)
  })

  it('sets pauseSeconds to 60 for all exercises', () => {
    const result = mapSessionToWorkoutInitialData(baseSession)
    result.exercises.forEach(ex => expect(ex.pauseSeconds).toBe(60))
  })

  it('assigns order starting from 1', () => {
    const result = mapSessionToWorkoutInitialData(baseSession)
    expect(result.exercises[0].order).toBe(1)
    expect(result.exercises[1].order).toBe(2)
  })

  it('converts durationSeconds to minutes rounded', () => {
    const result = mapSessionToWorkoutInitialData(baseSession, 3750)
    expect(result.time).toBe(63)
  })

  it('sets time to 0 when durationSeconds is not provided', () => {
    const result = mapSessionToWorkoutInitialData(baseSession)
    expect(result.time).toBe(0)
  })

})
