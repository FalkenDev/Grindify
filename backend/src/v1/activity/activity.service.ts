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
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Activity } from './activity.entity';
import { CreateActivityDto } from './dto/createActivity.dto';
import { UpdateActivityDto } from './dto/updateActivity.dto';
import { ActivityResponseDto } from './dto/activityResponse.dto';
import { CreateGlobalActivityDto, UpdateGlobalActivityDto } from './dto/createGlobalActivity.dto';

export type ActivityFilter = 'all' | 'global' | 'mine';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    private readonly dataSource: DataSource,
  ) {}

  private toResponseDto(activity: Activity): ActivityResponseDto {
    return {
      id: activity.id,
      title: activity.title,
      description: activity.descriptionI18n,
      isGlobal: activity.isGlobal,
      personalizedFromGlobalId: activity.personalizedFromGlobalId,
      personalizedAt: activity.personalizedAt,
      icon: activity.icon,
      equipment: activity.equipment,
      trackDistance: activity.trackDistance,
      trackPace: activity.trackPace,
      trackElevation: activity.trackElevation,
      trackCalories: activity.trackCalories,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
    };
  }

  async findAll(userId: number, filter: ActivityFilter = 'all'): Promise<ActivityResponseDto[]> {
    if (filter === 'mine') {
      const activities = await this.activityRepo.find({
        where: { createdBy: { id: userId }, isGlobal: false },
      });
      return activities.map((a) => this.toResponseDto(a));
    }

    if (filter === 'global') {
      const activities = await this.activityRepo.find({
        where: { isGlobal: true },
        order: { id: 'ASC' },
      });
      return activities.map((a) => this.toResponseDto(a));
    }

    // 'all': user's own first, then globals
    const [userActivities, globalActivities] = await Promise.all([
      this.activityRepo.find({ where: { createdBy: { id: userId }, isGlobal: false } }),
      this.activityRepo.find({ where: { isGlobal: true }, order: { id: 'ASC' } }),
    ]);
    return [...userActivities, ...globalActivities].map((a) => this.toResponseDto(a));
  }

  async findOne(id: number, userId: number): Promise<ActivityResponseDto> {
    const activity = await this.activityRepo.findOne({
      where: [
        { id, createdBy: { id: userId } },
        { id, isGlobal: true },
      ],
    });
    if (!activity) throw new NotFoundException('Activity not found');
    return this.toResponseDto(activity);
  }

  async create(dto: CreateActivityDto, userId: number): Promise<ActivityResponseDto> {
    const { name, description, ...rest } = dto;

    const activity = this.activityRepo.create({
      ...rest,
      title: { default: name },
      descriptionI18n: description ? { default: description } : undefined,
      isGlobal: false,
      createdBy: { id: userId } as any,
    });

    const saved = await this.activityRepo.save(activity);
    return this.toResponseDto(saved);
  }

  async createGlobal(dto: CreateGlobalActivityDto): Promise<ActivityResponseDto> {
    const activity = this.activityRepo.create({
      ...dto,
      isGlobal: true,
      createdBy: null,
    });
    const saved = await this.activityRepo.save(activity);
    return this.toResponseDto(saved);
  }

  async updateGlobal(id: number, dto: UpdateGlobalActivityDto): Promise<ActivityResponseDto> {
    const activity = await this.activityRepo.findOne({ where: { id, isGlobal: true } });
    if (!activity) throw new NotFoundException('Global activity not found');
    Object.assign(activity, dto);
    const saved = await this.activityRepo.save(activity);
    return this.toResponseDto(saved);
  }

  async deleteGlobal(id: number): Promise<{ message: string }> {
    const activity = await this.activityRepo.findOne({ where: { id, isGlobal: true } });
    if (!activity) throw new NotFoundException('Global activity not found');

    await this.dataSource.transaction(async (manager) => {
      // Find all users with activity logs referencing this activity
      const affectedUsers: { userId: number }[] = await manager.query(`
        SELECT DISTINCT user_id AS "userId"
        FROM activity_log
        WHERE "activityId" = $1
      `, [id]);

      for (const { userId } of affectedUsers) {
        const copy = manager.create(Activity, {
          title: activity.title,
          descriptionI18n: activity.descriptionI18n,
          isGlobal: false,
          createdBy: { id: userId } as any,
          personalizedFromGlobalId: activity.id,
          personalizedAt: new Date(),
          icon: activity.icon,
          equipment: activity.equipment,
          trackDistance: activity.trackDistance,
          trackPace: activity.trackPace,
          trackElevation: activity.trackElevation,
          trackCalories: activity.trackCalories,
        });
        const saved = await manager.save(Activity, copy);

        await manager.query(
          `UPDATE activity_log SET "activityId" = $1 WHERE "activityId" = $2 AND user_id = $3`,
          [saved.id, id, userId],
        );
      }

      await manager.softRemove(Activity, activity);
    });

    return { message: 'Global activity deleted and user data preserved' };
  }

  async update(id: number, dto: UpdateActivityDto, userId: number): Promise<ActivityResponseDto> {
    const activity = await this.activityRepo.findOne({
      where: { id, createdBy: { id: userId }, isGlobal: false },
    });
    if (!activity) throw new NotFoundException('Activity not found');

    const { name, description, ...rest } = dto as CreateActivityDto;
    Object.assign(activity, rest);

    if (name !== undefined) {
      activity.title = { ...activity.title, default: name };
    }
    if (description !== undefined) {
      activity.descriptionI18n = { ...(activity.descriptionI18n ?? {}), default: description };
    }

    const saved = await this.activityRepo.save(activity);
    return this.toResponseDto(saved);
  }

  async delete(id: number, userId: number): Promise<void> {
    const activity = await this.activityRepo.findOne({
      where: { id, createdBy: { id: userId }, isGlobal: false },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    await this.activityRepo.softRemove(activity);
  }

  async duplicateGlobalActivity(
    activityId: number,
    userId: number,
    transferStats: boolean = false,
  ): Promise<ActivityResponseDto> {
    const source = await this.activityRepo.findOne({ where: { id: activityId, isGlobal: true } });
    if (!source) throw new NotFoundException('Global activity not found');

    return this.dataSource.transaction(async (manager) => {
      const copy = manager.create(Activity, {
        title: source.title,
        descriptionI18n: source.descriptionI18n,
        isGlobal: false,
        createdBy: { id: userId } as any,
        personalizedFromGlobalId: source.id,
        personalizedAt: new Date(),
        icon: source.icon,
        equipment: source.equipment,
        trackDistance: source.trackDistance,
        trackPace: source.trackPace,
        trackElevation: source.trackElevation,
        trackCalories: source.trackCalories,
      });
      const saved = await manager.save(Activity, copy);

      if (transferStats) {
        await manager.query(
          `UPDATE activity_log SET "activityId" = $1 WHERE "activityId" = $2 AND user_id = $3`,
          [saved.id, activityId, userId],
        );
      }

      const full = await manager.findOne(Activity, { where: { id: saved.id } });
      return this.toResponseDto(full!);
    });
  }
}
