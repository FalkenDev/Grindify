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
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Exercise } from './exercise.entity';
import { ExerciseMedia } from './exerciseMedia.entity';
import { CreateExerciseDto } from './dto/createExercise.dto';
import { UpdateExerciseDto } from './dto/updateExercise.dto';
import { ExerciseResponseDto } from './dto/exerciseResponse.dto';
import { CreateGlobalExerciseDto, UpdateGlobalExerciseDto } from './dto/createGlobalExercise.dto';
import { MuscleGroupService } from '../muscleGroup/muscleGroup.service';
import { UploadService } from '../upload/upload.service';
import { MuscleGroupResponseDto } from '../muscleGroup/dto/muscleGroupResponse.dto';
import { MuscleGroup } from '../muscleGroup/muscleGroup.entity';

export type ExerciseFilter = 'all' | 'global' | 'mine';

@Injectable()
export class ExerciseService {
  constructor(
    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,
    @InjectRepository(ExerciseMedia)
    private readonly mediaRepo: Repository<ExerciseMedia>,
    private readonly muscleGroupService: MuscleGroupService,
    private readonly uploadService: UploadService,
    private readonly dataSource: DataSource,
  ) {}

  private toMuscleGroupDto(mg: MuscleGroup): MuscleGroupResponseDto {
    return {
      id: mg.id,
      name: mg.name,
      nameI18n: mg.nameI18n,
      descriptionI18n: mg.descriptionI18n,
      createdAt: mg.createdAt,
      updatedAt: mg.updatedAt,
    };
  }

  private toResponseDto(exercise: Exercise): ExerciseResponseDto {
    return {
      id: exercise.id,
      title: exercise.title,
      description: exercise.descriptionI18n,
      isGlobal: exercise.isGlobal,
      personalizedFromGlobalId: exercise.personalizedFromGlobalId,
      personalizedAt: exercise.personalizedAt,
      image: exercise.image,
      exerciseType: exercise.exerciseType,
      createdAt: exercise.createdAt,
      deletedAt: exercise.deletedAt,
      equipment: exercise.equipmentI18n?.default ?? [],
      equipmentI18n: exercise.equipmentI18n,
      instructions: exercise.instructionsI18n,
      proTips: exercise.proTipsI18n,
      mistakes: exercise.mistakesI18n,
      primaryMuscleGroups: exercise.primaryMuscleGroups?.map((mg) => this.toMuscleGroupDto(mg)) || [],
      muscleGroups: exercise.muscleGroups?.map((mg) => this.toMuscleGroupDto(mg)) || [],
      media: exercise.media
        ?.sort((a, b) => a.order - b.order)
        .map((m) => ({ id: m.id, type: m.type, url: m.url, order: m.order })) || [],
    };
  }

  private toResponseList(exercises: Exercise[]): ExerciseResponseDto[] {
    return exercises.map((e) => this.toResponseDto(e));
  }

  async findAll(userId: number, filter: ExerciseFilter = 'all'): Promise<ExerciseResponseDto[]> {
    const relations = ['muscleGroups', 'primaryMuscleGroups', 'media'];

    if (filter === 'mine') {
      const exercises = await this.exerciseRepo.find({
        where: { createdBy: { id: userId }, isGlobal: false },
        relations,
      });
      return this.toResponseList(exercises);
    }

    if (filter === 'global') {
      const exercises = await this.exerciseRepo.find({
        where: { isGlobal: true },
        relations,
        order: { id: 'ASC' },
      });
      return this.toResponseList(exercises);
    }

    // 'all': user's own exercises first, then globals
    const [userExercises, globalExercises] = await Promise.all([
      this.exerciseRepo.find({
        where: { createdBy: { id: userId }, isGlobal: false },
        relations,
      }),
      this.exerciseRepo.find({
        where: { isGlobal: true },
        relations,
        order: { id: 'ASC' },
      }),
    ]);

    return this.toResponseList([...userExercises, ...globalExercises]);
  }

  async findOne(id: number, userId: number): Promise<ExerciseResponseDto> {
    const relations = ['muscleGroups', 'primaryMuscleGroups', 'media'];

    // Finds if the exercise belongs to user OR is global
    const exercise = await this.exerciseRepo.findOne({
      where: [
        { id, createdBy: { id: userId } },
        { id, isGlobal: true },
      ],
      relations,
      withDeleted: true,
    });

    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }

    return this.toResponseDto(exercise);
  }

  async create(dto: CreateExerciseDto, userId: number): Promise<ExerciseResponseDto> {
    const { muscleGroupIds, primaryMuscleGroupIds, name, description, instructions, proTips, mistakes, equipment, ...rest } = dto;

    const exercise = this.exerciseRepo.create({
      ...rest,
      title: { default: name },
      descriptionI18n: description ? { default: description } : undefined,
      equipmentI18n: equipment?.length ? { default: equipment } : undefined,
      instructionsI18n: instructions?.length ? { default: instructions } : undefined,
      proTipsI18n: proTips?.length ? { default: proTips } : undefined,
      mistakesI18n: mistakes?.length ? { default: mistakes } : undefined,
      isGlobal: false,
      createdBy: { id: userId } as any,
    });

    if (muscleGroupIds?.length) {
      exercise.muscleGroups = await this.muscleGroupService.findByIds(muscleGroupIds);
    }
    exercise.primaryMuscleGroups = primaryMuscleGroupIds?.length
      ? await this.muscleGroupService.findByIds(primaryMuscleGroupIds)
      : [];

    const saved = await this.exerciseRepo.save(exercise);
    return this.findOne(saved.id, userId);
  }

  async createGlobal(dto: CreateGlobalExerciseDto): Promise<ExerciseResponseDto> {
    const { muscleGroupIds, primaryMuscleGroupIds, imageUrl, description, ...rest } = dto;

    const exercise = this.exerciseRepo.create({
      ...rest,
      descriptionI18n: description,
      image: imageUrl ?? undefined,
      isGlobal: true,
      createdBy: null,
    });

    if (muscleGroupIds?.length) {
      exercise.muscleGroups = await this.muscleGroupService.findByIds(muscleGroupIds);
    }
    exercise.primaryMuscleGroups = primaryMuscleGroupIds?.length
      ? await this.muscleGroupService.findByIds(primaryMuscleGroupIds)
      : [];

    const saved = await this.exerciseRepo.save(exercise);
    const full = await this.exerciseRepo.findOne({
      where: { id: saved.id },
      relations: ['muscleGroups', 'primaryMuscleGroups', 'media'],
    });
    return this.toResponseDto(full!);
  }

  async updateGlobal(id: number, dto: UpdateGlobalExerciseDto): Promise<ExerciseResponseDto> {
    const existing = await this.exerciseRepo.findOne({
      where: { id, isGlobal: true },
      relations: ['muscleGroups', 'primaryMuscleGroups', 'media'],
    });
    if (!existing) throw new NotFoundException('Global exercise not found');

    const { muscleGroupIds, primaryMuscleGroupIds, imageUrl, description, ...rest } = dto;
    Object.assign(existing, rest);
    if (description !== undefined) existing.descriptionI18n = description;
    if (imageUrl !== undefined) existing.image = imageUrl;

    if (muscleGroupIds !== undefined) {
      existing.muscleGroups = await this.muscleGroupService.findByIds(muscleGroupIds);
    }
    if (primaryMuscleGroupIds !== undefined) {
      existing.primaryMuscleGroups = primaryMuscleGroupIds.length
        ? await this.muscleGroupService.findByIds(primaryMuscleGroupIds)
        : [];
    }

    const updated = await this.exerciseRepo.save(existing);
    return this.toResponseDto(updated);
  }

  async deleteGlobal(id: number): Promise<{ message: string }> {
    const exercise = await this.exerciseRepo.findOne({
      where: { id, isGlobal: true },
      relations: ['muscleGroups', 'primaryMuscleGroups', 'media'],
    });
    if (!exercise) throw new NotFoundException('Global exercise not found');

    await this.dataSource.transaction(async (manager) => {
      // Find all users with workout data referencing this exercise
      const affectedUsers: { userId: number }[] = await manager.query(`
        SELECT DISTINCT ws."userId" AS "userId"
        FROM workout_session_exercise wse
        JOIN workout_session ws ON wse."sessionId" = ws.id
        WHERE wse."exerciseId" = $1
        UNION
        SELECT DISTINCT "userId" AS "userId"
        FROM exercise_record
        WHERE "exerciseId" = $1
        UNION
        SELECT DISTINCT w."createdById" AS "userId"
        FROM workout_exercise we
        JOIN workout w ON we."workoutId" = w.id
        WHERE we."exerciseId" = $1
      `, [id]);

      for (const { userId } of affectedUsers) {
        // Create a personal copy for this user
        const copy = manager.create(Exercise, {
          title: exercise.title,
          descriptionI18n: exercise.descriptionI18n,
          isGlobal: false,
          createdBy: { id: userId } as any,
          personalizedFromGlobalId: exercise.id,
          personalizedAt: new Date(),
          image: exercise.image,
          exerciseType: exercise.exerciseType,
          equipmentI18n: exercise.equipmentI18n,
          instructionsI18n: exercise.instructionsI18n,
          proTipsI18n: exercise.proTipsI18n,
          mistakesI18n: exercise.mistakesI18n,
          muscleGroups: exercise.muscleGroups,
          primaryMuscleGroups: exercise.primaryMuscleGroups,
        });
        const saved = await manager.save(Exercise, copy);

        // Redirect all FK references from global → user copy
        await manager.query(
          `UPDATE workout_session_exercise wse
           SET "exerciseId" = $1
           FROM workout_session ws
           WHERE wse."sessionId" = ws.id AND wse."exerciseId" = $2 AND ws."userId" = $3`,
          [saved.id, id, userId],
        );
        await manager.query(
          `UPDATE exercise_record
           SET "exerciseId" = $1
           WHERE "exerciseId" = $2 AND "userId" = $3`,
          [saved.id, id, userId],
        );
        await manager.query(
          `UPDATE workout_exercise we
           SET "exerciseId" = $1
           FROM workout w
           WHERE we."workoutId" = w.id AND we."exerciseId" = $2 AND w."createdById" = $3`,
          [saved.id, id, userId],
        );
      }

      // Soft-delete the global exercise — never hard-delete
      await manager.softRemove(Exercise, exercise);
    });

    return { message: 'Global exercise deleted and user data preserved' };
  }

  async update(id: number, dto: UpdateExerciseDto, userId: number): Promise<ExerciseResponseDto> {
    const { muscleGroupIds, primaryMuscleGroupIds, name, description, instructions, proTips, mistakes, equipment, ...rest } = dto;

    const existing = await this.exerciseRepo.findOne({
      where: { id, createdBy: { id: userId }, isGlobal: false },
      relations: ['muscleGroups', 'primaryMuscleGroups', 'media'],
    });
    if (!existing) throw new NotFoundException('Exercise not found');

    Object.assign(existing, rest);

    if (name !== undefined) {
      existing.title = { ...existing.title, default: name };
    }
    if (description !== undefined) {
      existing.descriptionI18n = { ...(existing.descriptionI18n ?? {}), default: description };
    }
    if (instructions !== undefined) {
      existing.instructionsI18n = { ...(existing.instructionsI18n ?? {}), default: instructions };
    }
    if (proTips !== undefined) {
      existing.proTipsI18n = { ...(existing.proTipsI18n ?? {}), default: proTips };
    }
    if (mistakes !== undefined) {
      existing.mistakesI18n = { ...(existing.mistakesI18n ?? {}), default: mistakes };
    }
    if (equipment !== undefined) {
      existing.equipmentI18n = { ...(existing.equipmentI18n ?? {}), default: equipment };
    }

    if (muscleGroupIds !== undefined) {
      existing.muscleGroups = await this.muscleGroupService.findByIds(muscleGroupIds);
    }
    if (primaryMuscleGroupIds !== undefined) {
      existing.primaryMuscleGroups = primaryMuscleGroupIds.length
        ? await this.muscleGroupService.findByIds(primaryMuscleGroupIds)
        : [];
    }

    const updated = await this.exerciseRepo.save(existing);
    return this.toResponseDto(updated);
  }

  async remove(id: number, userId: number): Promise<{ message: string }> {
    const exercise = await this.exerciseRepo.findOne({
      where: { id, createdBy: { id: userId }, isGlobal: false },
    });
    if (!exercise) throw new NotFoundException('Exercise not found');

    await this.exerciseRepo.softRemove(exercise);
    return { message: 'Exercise deleted' };
  }

  async duplicateGlobalExercise(
    exerciseId: number,
    userId: number,
    transferStats: boolean = false,
  ): Promise<ExerciseResponseDto> {
    const source = await this.exerciseRepo.findOne({
      where: { id: exerciseId, isGlobal: true },
      relations: ['muscleGroups', 'primaryMuscleGroups', 'media'],
    });
    if (!source) throw new NotFoundException('Global exercise not found');

    return this.dataSource.transaction(async (manager) => {
      const copy = manager.create(Exercise, {
        title: source.title,
        descriptionI18n: source.descriptionI18n,
        isGlobal: false,
        createdBy: { id: userId } as any,
        personalizedFromGlobalId: source.id,
        personalizedAt: new Date(),
        image: source.image,
        exerciseType: source.exerciseType,
        equipmentI18n: source.equipmentI18n,
        instructionsI18n: source.instructionsI18n,
        proTipsI18n: source.proTipsI18n,
        mistakesI18n: source.mistakesI18n,
        muscleGroups: source.muscleGroups,
        primaryMuscleGroups: source.primaryMuscleGroups,
      });
      const saved = await manager.save(Exercise, copy);

      if (transferStats) {
        await manager.query(
          `UPDATE workout_session_exercise wse
           SET "exerciseId" = $1
           FROM workout_session ws
           WHERE wse."sessionId" = ws.id AND wse."exerciseId" = $2 AND ws."userId" = $3`,
          [saved.id, exerciseId, userId],
        );
        await manager.query(
          `UPDATE exercise_record
           SET "exerciseId" = $1
           WHERE "exerciseId" = $2 AND "userId" = $3`,
          [saved.id, exerciseId, userId],
        );
        await manager.query(
          `UPDATE workout_exercise we
           SET "exerciseId" = $1
           FROM workout w
           WHERE we."workoutId" = w.id AND we."exerciseId" = $2 AND w."createdById" = $3`,
          [saved.id, exerciseId, userId],
        );
      }

      const full = await manager.findOne(Exercise, {
        where: { id: saved.id },
        relations: ['muscleGroups', 'primaryMuscleGroups', 'media'],
      });
      return this.toResponseDto(full!);
    });
  }

  async updateImage(id: number, imageUrl: string, userId: number): Promise<ExerciseResponseDto> {
    const exercise = await this.exerciseRepo.findOne({
      where: { id, createdBy: { id: userId } },
      relations: ['muscleGroups', 'primaryMuscleGroups', 'media'],
    });
    if (!exercise) throw new NotFoundException('Exercise not found');

    if (exercise.image) {
      await this.uploadService.deleteImage(exercise.image);
    }
    exercise.image = imageUrl;
    const updated = await this.exerciseRepo.save(exercise);
    return this.toResponseDto(updated);
  }

  async addMedia(exerciseId: number, userId: number, mediaUrl: string, mediaType: string): Promise<ExerciseResponseDto> {
    const exercise = await this.exerciseRepo.findOne({
      where: { id: exerciseId, createdBy: { id: userId } },
      relations: ['muscleGroups', 'primaryMuscleGroups', 'media'],
    });
    if (!exercise) throw new NotFoundException('Exercise not found');

    const maxOrder = exercise.media?.length ? Math.max(...exercise.media.map((m) => m.order)) : -1;
    const media = this.mediaRepo.create({ type: mediaType as any, url: mediaUrl, order: maxOrder + 1, exercise });
    await this.mediaRepo.save(media);

    return this.findOne(exerciseId, userId);
  }

  async removeMedia(exerciseId: number, mediaId: number, userId: number): Promise<ExerciseResponseDto> {
    const exercise = await this.exerciseRepo.findOne({
      where: { id: exerciseId, createdBy: { id: userId } },
    });
    if (!exercise) throw new NotFoundException('Exercise not found');

    const media = await this.mediaRepo.findOne({
      where: { id: mediaId, exercise: { id: exerciseId } },
    });
    if (!media) throw new NotFoundException('Media not found');

    await this.uploadService.deleteImage(media.url);
    await this.mediaRepo.remove(media);

    return this.findOne(exerciseId, userId);
  }

  async reorderMedia(exerciseId: number, mediaIds: number[], userId: number): Promise<ExerciseResponseDto> {
    const exercise = await this.exerciseRepo.findOne({
      where: { id: exerciseId, createdBy: { id: userId } },
    });
    if (!exercise) throw new NotFoundException('Exercise not found');

    for (let i = 0; i < mediaIds.length; i++) {
      await this.mediaRepo.update({ id: mediaIds[i], exercise: { id: exerciseId } }, { order: i });
    }

    return this.findOne(exerciseId, userId);
  }

  // --- Admin-only: global exercise image/media methods ---

  async updateGlobalImage(id: number, imageUrl: string | null): Promise<ExerciseResponseDto> {
    const exercise = await this.exerciseRepo.findOne({
      where: { id, isGlobal: true },
      relations: ['muscleGroups', 'primaryMuscleGroups', 'media'],
    });
    if (!exercise) throw new NotFoundException('Global exercise not found');

    exercise.image = imageUrl;
    const updated = await this.exerciseRepo.save(exercise);
    return this.toResponseDto(updated);
  }

  async addGlobalMedia(exerciseId: number, mediaUrl: string, mediaType: string): Promise<ExerciseResponseDto> {
    const exercise = await this.exerciseRepo.findOne({
      where: { id: exerciseId, isGlobal: true },
      relations: ['muscleGroups', 'primaryMuscleGroups', 'media'],
    });
    if (!exercise) throw new NotFoundException('Global exercise not found');

    const maxOrder = exercise.media?.length ? Math.max(...exercise.media.map((m) => m.order)) : -1;
    const media = this.mediaRepo.create({ type: mediaType as any, url: mediaUrl, order: maxOrder + 1, exercise });
    await this.mediaRepo.save(media);

    const full = await this.exerciseRepo.findOne({
      where: { id: exerciseId },
      relations: ['muscleGroups', 'primaryMuscleGroups', 'media'],
    });
    return this.toResponseDto(full!);
  }

  async removeGlobalMedia(exerciseId: number, mediaId: number): Promise<ExerciseResponseDto> {
    const exercise = await this.exerciseRepo.findOne({
      where: { id: exerciseId, isGlobal: true },
    });
    if (!exercise) throw new NotFoundException('Global exercise not found');

    const media = await this.mediaRepo.findOne({
      where: { id: mediaId, exercise: { id: exerciseId } },
    });
    if (!media) throw new NotFoundException('Media not found');

    await this.uploadService.deleteImage(media.url);
    await this.mediaRepo.remove(media);

    const full = await this.exerciseRepo.findOne({
      where: { id: exerciseId },
      relations: ['muscleGroups', 'primaryMuscleGroups', 'media'],
    });
    return this.toResponseDto(full!);
  }

  async reorderGlobalMedia(exerciseId: number, mediaIds: number[]): Promise<ExerciseResponseDto> {
    const exercise = await this.exerciseRepo.findOne({
      where: { id: exerciseId, isGlobal: true },
    });
    if (!exercise) throw new NotFoundException('Global exercise not found');

    for (let i = 0; i < mediaIds.length; i++) {
      await this.mediaRepo.update({ id: mediaIds[i], exercise: { id: exerciseId } }, { order: i });
    }

    const full = await this.exerciseRepo.findOne({
      where: { id: exerciseId },
      relations: ['muscleGroups', 'primaryMuscleGroups', 'media'],
    });
    return this.toResponseDto(full!);
  }
}
