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

import { Injectable, NotFoundException } from '@nestjs/common';
import { In, Like, Repository } from 'typeorm';
import { Workout, WorkoutType } from './workout.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { WorkoutResponseDto } from './dto/workoutResponse.dto';
import { CreateWorkoutDto } from './dto/createWorkout.dto';
import { UpdateWorkoutDto } from './dto/updateWorkout.dto';
import { WorkoutSession } from '../workoutSession/workoutSession.entity';
import { AddRemoveExercisesDto } from './dto/addRemoveExercises.dto';
import { WorkoutExercise } from './workoutExercise.entity';
import { Exercise } from '../exercise/exercise.entity';
import { MuscleGroup } from '../muscleGroup/muscleGroup.entity';
import { UpdateWorkoutExerciseDto } from './dto/updateWorkoutExercise.dto';
import { DataSource } from 'typeorm';

@Injectable()
export class WorkoutService {
  constructor(
    @InjectRepository(Workout)
    private workoutRepo: Repository<Workout>,
    @InjectRepository(WorkoutExercise)
    private workoutExerciseRepo: Repository<WorkoutExercise>,
    @InjectRepository(WorkoutSession)
    private readonly workoutSessionRepository: Repository<WorkoutSession>,
    @InjectRepository(MuscleGroup)
    private readonly muscleGroupRepo: Repository<MuscleGroup>,
    private readonly dataSource: DataSource,
  ) {}

  private async findWorkoutForUser(
    workoutId: number,
    userId: number,
  ): Promise<Workout> {
    const workout = await this.workoutRepo.findOne({
      where: { id: workoutId, createdBy: { id: userId } },
      relations: ['exercises'],
    });
    if (!workout) {
      throw new NotFoundException('Workout not found');
    }
    return workout;
  }

  async addExercisesToWorkout(
    workoutId: number,
    dto: AddRemoveExercisesDto,
    userId: number,
  ): Promise<WorkoutResponseDto> {
    const workout = await this.findWorkoutForUser(workoutId, userId);
    const newExercises = (dto.exerciseIds ?? []).map((exerciseId, index) =>
      this.workoutExerciseRepo.create({
        workout,
        exercise: { id: exerciseId } as Exercise,
        order: workout.exercises.length + index + 1,
        sets: 3,
        reps: 10,
        weight: 10,
        pauseSeconds: 60,
      }),
    );
    await this.workoutExerciseRepo.save(newExercises);
    // Reload the workout to get the full updated entity
    const updatedWorkout = await this.getWorkout(workoutId, userId);
    return updatedWorkout;
  }

  async removeExercisesFromWorkout(
    workoutId: number,
    dto: AddRemoveExercisesDto,
    userId: number,
  ): Promise<{ message: string }> {
    const workout = await this.findWorkoutForUser(workoutId, userId);

    const workoutExercisesToRemove = await this.workoutExerciseRepo.find({
      where: {
        workout: { id: workout.id },
        exercise: { id: In(dto.exerciseIds ?? []) },
      },
    });

    if (workoutExercisesToRemove.length === 0) {
      throw new NotFoundException(
        'None of the specified exercises were found in this workout.',
      );
    }

    const idsToRemove = workoutExercisesToRemove.map((we) => we.id);
    await this.workoutExerciseRepo.delete(idsToRemove);
    return { message: 'Exercises removed successfully' };
  }

  async reorderExercises(
    workoutId: number,
    exercises: Array<{ workoutExerciseId: number; order: number }>,
    userId: number,
  ): Promise<WorkoutResponseDto> {
    const workout = await this.findWorkoutForUser(workoutId, userId);

    // Update each exercise's order
    for (const exerciseOrder of exercises) {
      await this.workoutExerciseRepo.update(
        {
          id: exerciseOrder.workoutExerciseId,
          workout: { id: workout.id },
        },
        { order: exerciseOrder.order },
      );
    }

    return this.getWorkout(workoutId, userId);
  }

  async updateExerciseInWorkout(
    workoutId: number,
    workoutExerciseId: number,
    dto: UpdateWorkoutExerciseDto,
    userId: number,
  ): Promise<WorkoutResponseDto> {
    await this.findWorkoutForUser(workoutId, userId);

    const workoutExercise = await this.workoutExerciseRepo.findOne({
      where: {
        id: workoutExerciseId,
        workout: { id: workoutId },
      },
    });

    if (!workoutExercise) {
      throw new NotFoundException('Exercise not found in this workout');
    }

    Object.assign(workoutExercise, dto);

    // Keep `weight` in sync with the first set's weight when setWeights is provided
    if (dto.setWeights && dto.setWeights.length > 0) {
      workoutExercise.weight = dto.setWeights[0];
    }

    await this.workoutExerciseRepo.save(workoutExercise);

    return this.getWorkout(workoutId, userId);
  }

  async getWorkout(id: number, userId: number): Promise<WorkoutResponseDto> {
    const workout = await this.workoutRepo.findOne({
      where: { id, createdBy: { id: userId } },
      relations: [
        'exercises',
        'exercises.exercise',
        'exercises.exercise.muscleGroups',
        'exercises.exercise.primaryMuscleGroups',
        'targetMuscleGroups',
        'createdBy',
      ],
    });

    if (!workout) throw new NotFoundException('Workout not found');
    return this.toResponseDto(workout);
  }
  // ... rest of the service code
  async getWorkoutList(userId: number): Promise<WorkoutResponseDto[]> {
    const workouts = await this.workoutRepo.find({
      where: { createdBy: { id: userId } },
      relations: [
        'exercises',
        'exercises.exercise',
        'exercises.exercise.muscleGroups',
        'exercises.exercise.primaryMuscleGroups',
        'targetMuscleGroups',
        'createdBy',
      ],
    });

    return workouts.map((w) => this.toResponseDto(w));
  }

  async createWorkout(
    dto: CreateWorkoutDto,
    userId: number,
  ): Promise<WorkoutResponseDto> {
    const { targetMuscleGroupIds, type, ...workoutData } = dto;
    const workout = this.workoutRepo.create({
      ...workoutData,
      ...(type ? { type: type as WorkoutType } : {}),
      createdBy: { id: userId } as User,
    });

    if (targetMuscleGroupIds?.length) {
      workout.targetMuscleGroups = await this.muscleGroupRepo.findBy({
        id: In(targetMuscleGroupIds),
      });
    }

    const saved = (await this.workoutRepo.save(workout)) as Workout;
    return this.getWorkout(saved.id, userId);
  }
  async updateWorkout(
    id: number,
    dto: UpdateWorkoutDto,
    userId: number,
  ): Promise<WorkoutResponseDto> {
    const workout = await this.workoutRepo.findOne({
      where: { id, createdBy: { id: userId } },
      relations: ['targetMuscleGroups'],
    });
    if (!workout) throw new NotFoundException('Workout not found');

    const { targetMuscleGroupIds, type, ...workoutData } = dto;
    Object.assign(workout, workoutData);
    if (type !== undefined) {
      workout.type = type as WorkoutType;
    }

    if (targetMuscleGroupIds !== undefined) {
      if (targetMuscleGroupIds.length) {
        workout.targetMuscleGroups = await this.muscleGroupRepo.findBy({
          id: In(targetMuscleGroupIds),
        });
      } else {
        workout.targetMuscleGroups = [];
      }
    }

    await this.workoutRepo.save(workout);
    return this.getWorkout(id, userId);
  }

  async deleteWorkout(
    id: number,
    userId: number,
  ): Promise<{ message: string }> {
    const workout = await this.workoutRepo.findOne({
      where: { id, createdBy: { id: userId } },
    });
    if (!workout) throw new NotFoundException('Workout not found');

    await this.workoutRepo.softDelete(id);

    return { message: 'Workout deleted' };
  }

  async duplicateWorkout(
    id: number,
    userId: number,
  ): Promise<WorkoutResponseDto> {
    const original = await this.workoutRepo.findOne({
      where: { id, createdBy: { id: userId } },
      relations: [
        'exercises',
        'exercises.exercise',
        'exercises.exercise.primaryMuscleGroups',
        'createdBy',
      ],
    });

    if (!original) throw new NotFoundException('Workout not found');

    const baseTitle = original.title.replace(/\s\(\d+\)$/, '');
    const existingCopies = await this.workoutRepo.find({
      where: { createdBy: { id: userId }, title: Like(`${baseTitle}%`) },
    });

    let copyNumber = 1;
    existingCopies.forEach((w) => {
      const match = w.title.match(/\((\d+)\)$/);
      const number = match ? parseInt(match[1], 10) : 0;
      copyNumber = Math.max(copyNumber, number + 1);
    });

    return await this.dataSource.transaction(async (manager) => {
      const newWorkout = manager.create(Workout, {
        title: `${baseTitle} (${copyNumber})`,
        description: original.description,
        time: original.time,
        defaultWeightAndReps: original.defaultWeightAndReps,
        createdBy: original.createdBy,
      });

      const savedWorkout = await manager.save(Workout, newWorkout);

      const newWorkoutExercises = (original.exercises ?? [])
        .sort((a, b) => a.order - b.order)
        .map((we, idx) =>
          manager.create(WorkoutExercise, {
            workout: savedWorkout,
            exercise: we.exercise,
            order: we.order ?? idx + 1,
            sets: we.sets,
            reps: we.reps,
            weight: we.weight,
            setWeights: we.setWeights ?? null,
            pauseSeconds: we.pauseSeconds,
          }),
        );

      if (newWorkoutExercises.length) {
        await manager.save(WorkoutExercise, newWorkoutExercises);
      }

      const reloaded = await manager.findOneOrFail(Workout, {
        where: { id: savedWorkout.id },
        relations: [
          'exercises',
          'exercises.exercise',
          'exercises.exercise.muscleGroups',
          'exercises.exercise.primaryMuscleGroups',
          'targetMuscleGroups',
          'createdBy',
        ],
      });

      return this.toResponseDto(reloaded);
    });
  }

  private toResponseDto(workout: Workout): WorkoutResponseDto {
    return {
      id: workout.id,
      title: workout.title,
      description: workout.description,
      time: workout.time,
      type: workout.type ?? undefined,
      defaultWeightAndReps: workout.defaultWeightAndReps,
      targetMuscleGroups:
        workout.targetMuscleGroups?.map((mg) => ({
          id: mg.id,
          name: mg.name,
          nameI18n: mg.nameI18n,
          descriptionI18n: mg.descriptionI18n,
          createdAt: mg.createdAt,
          updatedAt: mg.updatedAt,
        })) ?? [],
      exercises:
        workout.exercises
          ?.map((e) => ({
            id: e.id,
            order: e.order,
            sets: e.sets,
            reps: e.reps,
            weight: e.weight,
            setWeights: e.setWeights ?? null,
            pauseSeconds: e.pauseSeconds,
            exercise: {
              id: e.exercise.id,
              title: e.exercise.title,
              description: e.exercise.descriptionI18n ?? null,
              isGlobal: e.exercise.isGlobal,
              personalizedFromGlobalId: e.exercise.personalizedFromGlobalId ?? null,
              primaryMuscleGroups:
                e.exercise.primaryMuscleGroups?.map((mg) => ({
                  id: mg.id,
                  name: mg.name,
                })) ?? [],
              deletedAt: e.exercise.deletedAt,
              muscleGroups:
                e.exercise.muscleGroups?.map((mg) => ({
                  id: mg.id,
                  name: mg.name,
                  nameI18n: mg.nameI18n,
                  descriptionI18n: mg.descriptionI18n,
                  createdAt: mg.createdAt,
                  updatedAt: mg.updatedAt,
                })) ?? [],
            },
          }))
          .sort((a, b) => a.order - b.order) || [],
      createdAt: workout.createdAt,
    };
  }
}
