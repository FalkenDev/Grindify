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
  Logger,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MuscleGroup } from './muscleGroup.entity';
import { CreateMuscleGroupDto } from './dto/createMuscleGroup.dto';
import { UpdateMuscleGroupDto } from './dto/updateMuscleGroup.dto';
import { muscleGroupsToSeed } from '../seed/data/muscleGroups.data';
import { I18nString } from '../common/types/i18n.types';

/**
 * Input accepted by create/update. The public superadmin endpoint sends plain
 * `name` / `description`, the admin panel sends the i18n objects directly.
 */
export interface MuscleGroupInput {
  name?: string;
  description?: string;
  nameI18n?: Partial<I18nString>;
  descriptionI18n?: Partial<I18nString>;
}

@Injectable()
export class MuscleGroupService implements OnModuleInit {
  private readonly logger = new Logger(MuscleGroupService.name);

  constructor(
    @InjectRepository(MuscleGroup)
    private readonly muscleGroupRepo: Repository<MuscleGroup>,
  ) {}

  /**
   * Automatically seed the default muscle groups when the application starts
   * if the table is empty. This ensures muscle groups are always available
   * without requiring a manual seed step.
   */
  async onModuleInit(): Promise<void> {
    const count = await this.muscleGroupRepo.count();
    if (count === 0) {
      this.logger.log('No muscle groups found – seeding defaults…');
      await this.muscleGroupRepo.save(muscleGroupsToSeed);
      this.logger.log(`Seeded ${muscleGroupsToSeed.length} muscle group(s)`);
      return;
    }
    // Backfill nameI18n for muscle groups that don't have it yet (migration may have added the column)
    const missing = await this.muscleGroupRepo
      .createQueryBuilder('mg')
      .where('mg.nameI18n IS NULL')
      .getMany();
    if (missing.length > 0) {
      for (const mg of missing) {
        mg.nameI18n = { default: mg.name };
      }
      await this.muscleGroupRepo.save(missing);
      this.logger.log(`Backfilled nameI18n for ${missing.length} muscle group(s)`);
    }
  }

  async findAll(): Promise<MuscleGroup[]> {
    return this.muscleGroupRepo.find();
  }

  async findOne(id: number): Promise<MuscleGroup> {
    const muscleGroup = await this.muscleGroupRepo.findOne({ where: { id } });

    if (!muscleGroup) {
      throw new NotFoundException('Muscle group not found');
    }

    return muscleGroup;
  }

  /**
   * Finds multiple MuscleGroup entities by their IDs.
   * @param ids - An array of muscle group IDs.
   * @returns A promise that resolves to an array of MuscleGroup entities.
   */
  async findByIds(ids: number[]): Promise<MuscleGroup[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    return this.muscleGroupRepo.findBy({
      id: In(ids),
    });
  }

  async create(
    dto: CreateMuscleGroupDto | (MuscleGroupInput & { name: string }),
  ): Promise<MuscleGroup> {
    const input = dto as MuscleGroupInput & { name: string };
    const existing = await this.muscleGroupRepo.findOne({
      where: { name: input.name },
    });

    if (existing) {
      throw new BadRequestException(
        'Muscle group with that name already exists',
      );
    }

    // Map onto the real columns: `nameI18n` is NOT NULL and `description`
    // only exists as `descriptionI18n`.
    const muscleGroup = this.muscleGroupRepo.create({
      name: input.name,
      nameI18n: {
        ...input.nameI18n,
        default: input.nameI18n?.default || input.name,
      },
      descriptionI18n:
        input.descriptionI18n !== undefined
          ? { default: null, ...input.descriptionI18n }
          : input.description !== undefined
            ? { default: input.description }
            : undefined,
    });
    return this.muscleGroupRepo.save(muscleGroup);
  }

  async update(
    id: number,
    dto: UpdateMuscleGroupDto | MuscleGroupInput,
  ): Promise<MuscleGroup> {
    const input = dto as MuscleGroupInput;
    const muscleGroup = await this.findOne(id);

    if (input.name !== undefined && input.name !== muscleGroup.name) {
      const existing = await this.muscleGroupRepo.findOne({
        where: { name: input.name },
      });
      if (existing) {
        throw new BadRequestException(
          'Muscle group with that name already exists',
        );
      }
      muscleGroup.name = input.name;
    }
    // i18n objects from the admin panel replace the stored ones
    if (input.nameI18n !== undefined) {
      muscleGroup.nameI18n = {
        ...input.nameI18n,
        default: input.nameI18n.default || muscleGroup.name,
      };
    }
    if (input.descriptionI18n !== undefined) {
      muscleGroup.descriptionI18n = { default: null, ...input.descriptionI18n };
    } else if (input.description !== undefined) {
      muscleGroup.descriptionI18n = {
        ...(muscleGroup.descriptionI18n ?? {}),
        default: input.description,
      };
    }
    return this.muscleGroupRepo.save(muscleGroup);
  }

  async remove(id: number): Promise<{ message: string }> {
    const muscleGroup = await this.findOne(id);

    await this.muscleGroupRepo.remove(muscleGroup);

    return { message: 'Muscle group deleted' };
  }
}
