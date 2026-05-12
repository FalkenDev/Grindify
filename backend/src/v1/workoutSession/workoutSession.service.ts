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

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { WorkoutSession } from './workoutSession.entity';
import { Workout } from '../workout/workout.entity';
import { WorkoutSessionExercise } from './workoutSessionExercise.entity';
import { WorkoutSessionSet } from './workoutSessionSet.entity';
import { Exercise } from '../exercise/exercise.entity';
import { WorkoutStatus } from '../types/WorkoutStatus.type';
import { UserService } from '../user/user.service';
import { StatisticsService } from '../statistics/statistics.service';
import { UpdateWorkoutSessionDto } from './dto/updateWorkoutSession.dto';

export interface PreviousSetItem {
  setNumber: number;
  weight: number | null;
  reps: number | null;
}

export interface PreviousSetsResponseItem {
  exerciseId: number;
  sets: PreviousSetItem[];
}

@Injectable()
export class WorkoutSessionService {
  constructor(
    @InjectRepository(WorkoutSession)
    private readonly sessionRepo: Repository<WorkoutSession>,
    @InjectRepository(Workout)
    private readonly workoutRepo: Repository<Workout>,
    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,
    @InjectRepository(WorkoutSessionExercise)
    private readonly sessionExerciseRepo: Repository<WorkoutSessionExercise>,
    @InjectRepository(WorkoutSessionSet)
    private readonly setRepo: Repository<WorkoutSessionSet>,
    private readonly dataSource: DataSource,
    private readonly userService: UserService,
    private readonly statisticsService: StatisticsService,
  ) {}

  private roundToTwoDecimals(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  async getAllSessions(userId: number): Promise<WorkoutSession[]> {
    return this.sessionRepo.find({ where: { user: { id: userId } } });
  }

  async getOneSession(id: number, userId: number): Promise<WorkoutSession> {
    const session = await this.sessionRepo.findOne({
      where: { id, user: { id: userId } },
      relations: [
        'workout',
        'workout.exercises',
        'workout.exercises.exercise',
        'exercises',
        'exercises.exercise',
        'exercises.sets',
      ],
      withDeleted: true,
    });

    if (!session) throw new NotFoundException('Workout session not found');

    // Sort session exercises by order
    if (session.exercises) {
      session.exercises.sort((a, b) => a.order - b.order);
    }
    // Sort workout exercises by order
    if (session.workout?.exercises) {
      session.workout.exercises.sort((a, b) => a.order - b.order);
    }

    return session;
  }

  async getPreviousSets(
    userId: number,
    sessionId: number,
    exerciseIds?: number[],
  ): Promise<PreviousSetsResponseItem[]> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, user: { id: userId } },
      relations: ['workout', 'exercises', 'exercises.exercise'],
    });

    if (!session) throw new NotFoundException('Session not found');

    const workoutId = session.workout?.id;
    const result: PreviousSetsResponseItem[] = [];
    const targetExerciseIds =
      exerciseIds && exerciseIds.length > 0
        ? [...new Set(exerciseIds)]
        : session.exercises
            .map((sessionEx) => sessionEx.exercise?.id)
            .filter(
              (exerciseId): exerciseId is number =>
                typeof exerciseId === 'number',
            );

    for (const exerciseId of targetExerciseIds) {
      let previousEx: WorkoutSessionExercise | null = null;

      // Prefer: last finished session with same workout template
      if (workoutId) {
        previousEx = await this.sessionExerciseRepo
          .createQueryBuilder('se')
          .innerJoin('se.session', 'ws')
          .leftJoinAndSelect('se.sets', 'sets')
          .where('se.exercise.id = :exerciseId', { exerciseId })
          .andWhere('ws.user.id = :userId', { userId })
          .andWhere('ws.workout.id = :workoutId', { workoutId })
          .andWhere('ws.status = :status', { status: 'finished' })
          .andWhere('ws.id != :sessionId', { sessionId })
          .orderBy('ws.endedAt', 'DESC')
          .addOrderBy('sets.setNumber', 'ASC')
          .getOne();
      }

      // Fallback: last finished session (any workout) with this exercise
      if (!previousEx) {
        previousEx = await this.sessionExerciseRepo
          .createQueryBuilder('se')
          .innerJoin('se.session', 'ws')
          .leftJoinAndSelect('se.sets', 'sets')
          .where('se.exercise.id = :exerciseId', { exerciseId })
          .andWhere('ws.user.id = :userId', { userId })
          .andWhere('ws.status = :status', { status: 'finished' })
          .andWhere('ws.id != :sessionId', { sessionId })
          .orderBy('ws.endedAt', 'DESC')
          .addOrderBy('sets.setNumber', 'ASC')
          .getOne();
      }

      if (previousEx?.sets?.length) {
        result.push({
          exerciseId,
          sets: [...previousEx.sets]
            .sort((a, b) => a.setNumber - b.setNumber)
            .map((s) => ({
              setNumber: s.setNumber,
              weight: s.weight !== undefined ? Number(s.weight) : null,
              reps: s.reps ?? null,
            })),
        });
      }
    }

    return result;
  }

  async createSession(
    workoutId: number,
    userId: number,
    scheduledSessionId?: number,
  ): Promise<WorkoutSession> {
    const workout = await this.workoutRepo.findOne({
      where: { id: workoutId },
      relations: ['exercises', 'exercises.exercise'],
    });

    if (!workout) throw new NotFoundException('Workout not found');

    // Sort workout exercises by order
    const sortedExercises = [...(workout.exercises || [])].sort(
      (a, b) => a.order - b.order,
    );

    // Pre-populate session exercises from workout exercises
    const sessionExercises = sortedExercises.map((we) =>
      this.sessionExerciseRepo.create({
        exercise: we.exercise,
        order: we.order,
        sets: [],
      }),
    );

    const session = this.sessionRepo.create({
      user: { id: userId },
      workout,
      exercises: sessionExercises,
      startedAt: new Date(),
      scheduledSession: scheduledSessionId
        ? ({ id: scheduledSessionId } as any)
        : null,
    });

    return this.sessionRepo.save(session);
  }

  async createEmptySession(
    userId: number,
    scheduledSessionId?: number,
  ): Promise<WorkoutSession> {
    const session = this.sessionRepo.create({
      user: { id: userId },
      workout: null,
      exercises: [],
      startedAt: new Date(),
      scheduledSession: scheduledSessionId
        ? ({ id: scheduledSessionId } as any)
        : null,
    });

    return this.sessionRepo.save(session);
  }

  async logPastSession(
    userId: number,
    dto: {
      workoutId?: number;
      startedAt: string;
      endedAt: string;
      notes?: string;
      scheduledSessionId?: number;
      completedExercises?: {
        exerciseId: number;
        sets: { setNumber: number; weight: number; reps: number }[];
      }[];
    },
  ): Promise<WorkoutSession> {
    return this.dataSource.transaction(async (manager) => {
      let workout: Workout | null = null;
      if (dto.workoutId) {
        workout = await manager.findOne(Workout, {
          where: { id: dto.workoutId },
          withDeleted: true,
        });
      }

      const session = manager.create(WorkoutSession, {
        user: { id: userId },
        workout: workout || null,
        exercises: [],
        startedAt: new Date(dto.startedAt),
        endedAt: new Date(dto.endedAt),
        status: 'finished' as const,
        totalWeight: 0,
        exerciseStats: [],
        notes: dto.notes || null,
        scheduledSession: dto.scheduledSessionId
          ? ({ id: dto.scheduledSessionId } as any)
          : undefined,
      } as any);

      const saved = await manager.save(WorkoutSession, session);

      // Save completed exercises & sets if provided
      if (dto.completedExercises?.length) {
        const sessionExercises: WorkoutSessionExercise[] = [];
        const allSets: WorkoutSessionSet[] = [];

        for (const ce of dto.completedExercises) {
          const exercise = await manager.findOne(Exercise, {
            where: { id: ce.exerciseId },
            withDeleted: true,
          });
          if (!exercise)
            throw new NotFoundException(`Exercise ${ce.exerciseId} not found`);

          const sessionExercise = manager.create(WorkoutSessionExercise, {
            session: saved,
            exercise,
            order: sessionExercises.length + 1,
          });
          sessionExercises.push(sessionExercise);
        }

        await manager.save(WorkoutSessionExercise, sessionExercises);

        for (let i = 0; i < dto.completedExercises.length; i++) {
          const ce = dto.completedExercises[i];
          const sessionExercise = sessionExercises[i];
          const sets = (ce.sets ?? []).map((s) =>
            manager.create(WorkoutSessionSet, {
              setNumber: s.setNumber,
              weight: s.weight,
              reps: s.reps,
              sessionExercise,
            }),
          );
          allSets.push(...sets);
        }

        if (allSets.length) {
          await manager.save(WorkoutSessionSet, allSets);
        }

        // Compute totalWeight & exerciseStats
        let totalWeight = 0;
        const stats: { exerciseId: number; totalWeight: number }[] = [];
        for (let i = 0; i < dto.completedExercises.length; i++) {
          const ce = dto.completedExercises[i];
          let exTotal = 0;
          for (const s of ce.sets ?? []) {
            exTotal += s.weight * s.reps;
          }
          exTotal = this.roundToTwoDecimals(exTotal);
          stats.push({ exerciseId: ce.exerciseId, totalWeight: exTotal });
          totalWeight += exTotal;
        }

        saved.totalWeight = this.roundToTwoDecimals(totalWeight);
        saved.exerciseStats = stats;
        await manager.save(WorkoutSession, saved);
      }

      // Update streak
      await this.userService.updateStreakOnWorkoutCompletion(userId);

      // Compute and upsert personal records for logged past sessions
      if (dto.completedExercises?.length) {
        const completedForRecords = dto.completedExercises
          .filter((ce) => ce.sets?.length)
          .map((ce) => ({
            exerciseId: ce.exerciseId,
            sets: (ce.sets ?? []).map((s) => ({
              weight: s.weight ?? 0,
              reps: s.reps ?? 0,
            })),
          }));

        if (completedForRecords.length) {
          await this.statisticsService.computeAndUpsertRecords(
            userId,
            saved.id,
            completedForRecords,
            manager,
          );
        }
      }

      return manager.findOneOrFail(WorkoutSession, {
        where: { id: saved.id },
        relations: [
          'exercises',
          'exercises.sets',
          'exercises.exercise',
          'exercises.exercise.muscleGroups',
        ],
        withDeleted: true,
      });
    });
  }

  async addExerciseToSession(
    sessionId: number,
    exerciseId: number,
    userId: number,
    sets: {
      setNumber: number;
      weight: number;
      reps: number;
      rpe?: number;
      notes?: string;
    }[],
  ): Promise<WorkoutSession> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, user: { id: userId } },
      relations: ['exercises', 'exercises.sets'],
    });

    if (!session) throw new NotFoundException('Session not found');

    const exercise = await this.exerciseRepo.findOne({
      where: { id: exerciseId },
      relations: ['muscleGroups'],
      withDeleted: true,
    });

    if (!exercise) throw new NotFoundException('Exercise not found');

    // Assign order as next after current max
    const maxOrder = session.exercises.reduce(
      (max, e) => Math.max(max, e.order ?? 0),
      0,
    );

    const sessionExercise = this.sessionExerciseRepo.create({
      session,
      exercise,
      order: maxOrder + 1,
      sets: sets.map((s) => this.setRepo.create(s)),
    });

    await this.sessionExerciseRepo.save(sessionExercise);

    // Reload session to return full updated entity
    return this.getOneSession(sessionId, userId);
  }

  async completeSession(
    sessionId: number,
    userId: number,
    payload?: {
      completedExercises?: {
        exerciseId: number;
        notes?: string;
        sets: {
          setNumber: number;
          weight: number;
          reps: number;
          rpe?: number;
          notes?: string;
        }[];
      }[];
      notes?: string;
    },
  ): Promise<WorkoutSession> {
    return this.dataSource.transaction(async (manager) => {
      const session = await manager.findOne(WorkoutSession, {
        where: { id: sessionId, user: { id: userId } },
        relations: ['exercises', 'exercises.sets', 'exercises.exercise'],
      });
      if (!session) throw new NotFoundException('Session not found');

      const newlyCreatedExercises: WorkoutSessionExercise[] = [];
      const setsToSave: WorkoutSessionSet[] = [];
      const setsToRemove: WorkoutSessionSet[] = [];
      const exercisesToUpdateNotes: WorkoutSessionExercise[] = [];

      if (payload?.completedExercises?.length) {
        const existingByExerciseId = new Map<number, WorkoutSessionExercise>();
        for (const ex of session.exercises ?? []) {
          if (ex.exercise?.id) existingByExerciseId.set(ex.exercise.id, ex);
        }

        for (const ce of payload.completedExercises) {
          let sessionExercise = existingByExerciseId.get(ce.exerciseId);

          if (!sessionExercise) {
            const exercise = await manager.findOne(Exercise, {
              where: { id: ce.exerciseId },
              withDeleted: true,
            });
            if (!exercise) throw new NotFoundException('Exercise not found');

            // Assign order as next after current max
            const currentMax = (session.exercises ?? []).reduce(
              (max, e) => Math.max(max, e.order ?? 0),
              0,
            );

            sessionExercise = manager.create(WorkoutSessionExercise, {
              session,
              exercise,
              order: currentMax + 1,
              notes: ce.notes,
            });

            newlyCreatedExercises.push(sessionExercise);
            session.exercises.push(sessionExercise);
          } else if (
            ce.notes !== undefined &&
            ce.notes !== sessionExercise.notes
          ) {
            sessionExercise.notes = ce.notes;
            exercisesToUpdateNotes.push(sessionExercise);
          }

          if (sessionExercise.sets?.length) {
            setsToRemove.push(...sessionExercise.sets);
          }

          const newSets = (ce.sets ?? []).map((s) =>
            manager.create(WorkoutSessionSet, {
              setNumber: s.setNumber,
              weight: s.weight,
              reps: s.reps,
              rpe: s.rpe,
              notes: s.notes,
            }),
          );

          sessionExercise.sets = newSets;
          if (newSets.length) setsToSave.push(...newSets);
        }
      }

      if (newlyCreatedExercises.length) {
        await manager.save(WorkoutSessionExercise, newlyCreatedExercises);
      }

      if (setsToRemove.length) {
        await manager.remove(WorkoutSessionSet, setsToRemove);
      }

      // Remove exercises that have no sets (user didn't complete them)
      const exercisesToRemove: WorkoutSessionExercise[] = [];
      for (const ex of session.exercises ?? []) {
        if (!ex.sets?.length) {
          exercisesToRemove.push(ex);
        } else {
          for (const s of ex.sets) s.sessionExercise = ex;
        }
      }

      if (exercisesToRemove.length) {
        await manager.remove(WorkoutSessionExercise, exercisesToRemove);
        session.exercises = (session.exercises ?? []).filter(
          (ex) => !exercisesToRemove.find((r) => r.id === ex.id),
        );
      }

      if (setsToSave.length) {
        await manager.save(WorkoutSessionSet, setsToSave);
      }

      for (const ex of exercisesToUpdateNotes) {
        await manager.update(
          WorkoutSessionExercise,
          { id: ex.id },
          { notes: ex.notes ?? '' },
        );
      }

      if (payload?.notes !== undefined) {
        session.notes = payload.notes;
      }

      let totalWeight = 0;
      const stats: { exerciseId: number; totalWeight: number }[] = [];
      for (const ex of session.exercises ?? []) {
        let exTotal = 0;
        for (const set of ex.sets ?? []) {
          exTotal += set.weight * set.reps;
        }
        exTotal = this.roundToTwoDecimals(exTotal);
        stats.push({ exerciseId: ex.exercise?.id ?? 0, totalWeight: exTotal });
        totalWeight += exTotal;
      }

      session.status = 'finished';
      session.endedAt = new Date();
      session.totalWeight = this.roundToTwoDecimals(totalWeight);
      session.exerciseStats = stats;

      await manager.save(WorkoutSession, session);

      // Update user's streak after finishing workout
      await this.userService.updateStreakOnWorkoutCompletion(userId);

      // Compute and upsert personal records
      const completedForRecords = (session.exercises ?? [])
        .filter((ex) => ex.exercise?.id && ex.sets?.length)
        .map((ex) => ({
          exerciseId: ex.exercise.id,
          sets: (ex.sets ?? []).map((s) => ({
            weight: s.weight ?? 0,
            reps: s.reps ?? 0,
            rpe: s.rpe,
          })),
        }));

      let newRecords: any[] = [];
      if (completedForRecords.length) {
        newRecords = await this.statisticsService.computeAndUpsertRecords(
          userId,
          session.id,
          completedForRecords,
          manager,
        );
      }

      const result = await manager.findOneOrFail(WorkoutSession, {
        where: { id: session.id },
        relations: [
          'workout',
          'exercises',
          'exercises.sets',
          'exercises.exercise',
          'exercises.exercise.muscleGroups',
        ],
        withDeleted: true,
      });

      return { ...result, newRecords } as any;
    });
  }

  async updateSession(
    sessionId: number,
    userId: number,
    data: UpdateWorkoutSessionDto,
  ): Promise<WorkoutSession> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, user: { id: userId } },
    });

    if (!session) throw new NotFoundException('Session not found');

    if (session.status === WorkoutStatus.FINISHED) {
      if (data.status !== undefined || data.endedAt !== undefined) {
        throw new BadRequestException(
          'Finished workout sessions can only be updated through notes, calories, or duration corrections.',
        );
      }

      if (data.durationMinutes !== undefined) {
        session.endedAt = this.getEndedAtFromDuration(
          session.startedAt,
          data.durationMinutes,
        );
      }
    } else {
      if (data.durationMinutes !== undefined) {
        throw new BadRequestException(
          'Duration corrections are only supported for finished workout sessions.',
        );
      }

      if (data.status !== undefined) {
        session.status = data.status;
      }

      if (data.endedAt !== undefined) {
        session.endedAt = this.validateEndedAt(session.startedAt, data.endedAt);
      }
    }

    if (data.notes !== undefined) {
      session.notes = data.notes;
    }

    if (data.caloriesBurned !== undefined) {
      session.caloriesBurned = data.caloriesBurned;
    }

    return this.sessionRepo.save(session);
  }

  private getEndedAtFromDuration(
    startedAt: Date,
    durationMinutes: number,
  ): Date {
    const endedAt = new Date(startedAt.getTime() + durationMinutes * 60_000);
    return this.validateEndedAt(startedAt, endedAt);
  }

  private validateEndedAt(startedAt: Date, endedAt: Date): Date {
    if (endedAt.getTime() <= startedAt.getTime()) {
      throw new BadRequestException(
        'Workout session end time must be after the start time.',
      );
    }

    return endedAt;
  }

  async deleteSession(
    sessionId: number,
    userId: number,
  ): Promise<{ message: string }> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, user: { id: userId } },
    });

    if (!session) throw new NotFoundException('Session not found');

    await this.sessionRepo.remove(session);
    return { message: 'Workout session deleted' };
  }

  async updateSessionExerciseSets(
    sessionId: number,
    sessionExerciseId: number,
    userId: number,
    sets: {
      setNumber: number;
      weight?: number;
      reps?: number;
      rpe?: number;
      notes?: string;
    }[],
  ): Promise<WorkoutSession> {
    return this.dataSource.transaction(async (manager) => {
      const session = await manager.findOne(WorkoutSession, {
        where: { id: sessionId, user: { id: userId } },
        relations: ['exercises', 'exercises.sets', 'exercises.exercise'],
      });

      if (!session) throw new NotFoundException('Session not found');

      if (session.status !== WorkoutStatus.FINISHED) {
        throw new BadRequestException(
          'Sets can only be edited on finished workout sessions.',
        );
      }

      const sessionExercise = session.exercises.find(
        (e) => e.id === sessionExerciseId,
      );
      if (!sessionExercise)
        throw new NotFoundException('Exercise not found in session');

      // Replace sets
      if (sessionExercise.sets?.length) {
        await manager.remove(WorkoutSessionSet, sessionExercise.sets);
      }

      const newSets = sets.map((s) =>
        manager.create(WorkoutSessionSet, {
          setNumber: s.setNumber,
          weight: s.weight,
          reps: s.reps,
          rpe: s.rpe,
          notes: s.notes,
          sessionExercise,
        }),
      );

      if (newSets.length) {
        await manager.save(WorkoutSessionSet, newSets);
      }

      sessionExercise.sets = newSets;

      // Recalculate totalWeight & exerciseStats
      let totalWeight = 0;
      const stats: { exerciseId: number; totalWeight: number }[] = [];
      for (const ex of session.exercises) {
        let exTotal = 0;
        for (const set of ex.sets ?? []) {
          exTotal += (Number(set.weight) || 0) * (set.reps ?? 0);
        }
        exTotal = this.roundToTwoDecimals(exTotal);
        stats.push({
          exerciseId: ex.exercise?.id ?? 0,
          totalWeight: exTotal,
        });
        totalWeight += exTotal;
      }

      session.totalWeight = this.roundToTwoDecimals(totalWeight);
      session.exerciseStats = stats;
      await manager.save(WorkoutSession, session);

      // Re-run personal records
      const exercisesForRecords = session.exercises
        .filter((ex) => ex.exercise?.id && ex.sets?.length)
        .map((ex) => ({
          exerciseId: ex.exercise.id,
          sets: ex.sets.map((s) => ({
            weight: Number(s.weight) || 0,
            reps: s.reps ?? 0,
            rpe: s.rpe,
          })),
        }));

      if (exercisesForRecords.length) {
        await this.statisticsService.computeAndUpsertRecords(
          userId,
          sessionId,
          exercisesForRecords,
          manager,
        );
      }

      return manager.findOneOrFail(WorkoutSession, {
        where: { id: session.id },
        relations: [
          'workout',
          'exercises',
          'exercises.sets',
          'exercises.exercise',
          'exercises.exercise.muscleGroups',
        ],
        withDeleted: true,
      });
    });
  }

  async abandonSession(
    sessionId: number,
    userId: number,
  ): Promise<WorkoutSession> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, user: { id: userId } },
    });

    if (!session) {
      throw new NotFoundException('Workout session not found');
    }

    if (
      session.status === WorkoutStatus.FINISHED ||
      session.status === WorkoutStatus.ABANDONED
    ) {
      throw new BadRequestException(
        `Session is already ${session.status} and cannot be abandoned.`,
      );
    }

    session.status = WorkoutStatus.ABANDONED;
    session.endedAt = new Date();

    return this.sessionRepo.save(session);
  }
}
