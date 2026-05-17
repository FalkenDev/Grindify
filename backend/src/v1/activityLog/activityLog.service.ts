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
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from './activityLog.entity';
import { Activity } from '../activity/activity.entity';
import { CreateActivityLogDto } from './dto/createActivityLog.dto';
import { UpdateActivityLogDto } from './dto/updateActivityLog.dto';
import { ActivityLogResponseDto } from './dto/activityLogResponse.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepo: Repository<ActivityLog>,
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  /**
   * Calculate pace in "min:sec/km" format from duration and distance
   */
  private calculatePace(
    durationMinutes: number,
    distanceKm: number,
  ): string | null {
    if (!distanceKm || distanceKm <= 0) {
      return null;
    }

    const paceMinutes = durationMinutes / distanceKm;
    const minutes = Math.floor(paceMinutes);
    const seconds = Math.round((paceMinutes - minutes) * 60);

    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  }

  private toResponseDto(log: ActivityLog): ActivityLogResponseDto {
    const activity = log.activity!;
    return {
      id: log.id,
      activity: {
        id: activity.id,
        title: activity.title,
        description: activity.descriptionI18n ?? undefined,
        isGlobal: activity.isGlobal,
        personalizedFromGlobalId: activity.personalizedFromGlobalId ?? undefined,
        personalizedAt: activity.personalizedAt ?? undefined,
        icon: activity.icon,
        equipment: activity.equipment ?? undefined,
        trackDistance: activity.trackDistance,
        trackPace: activity.trackPace,
        trackElevation: activity.trackElevation,
        trackCalories: activity.trackCalories,
        createdAt: activity.createdAt,
        updatedAt: activity.updatedAt,
      },
      date: log.date,
      duration: log.duration,
      distance: log.distance,
      pace: log.pace,
      elevationGain: log.elevationGain,
      maxElevation: log.maxElevation,
      calories: log.calories,
      notes: log.notes,
      createdAt: log.createdAt,
    };
  }

  async findAll(userId: number): Promise<ActivityLogResponseDto[]> {
    const logs = await this.activityLogRepo.find({
      where: { user: { id: userId } },
      relations: ['activity'],
      order: { date: 'DESC', createdAt: 'DESC' },
    });

    return logs.map((log) => this.toResponseDto(log));
  }

  async findOne(id: number, userId: number): Promise<ActivityLogResponseDto> {
    const log = await this.activityLogRepo.findOne({
      where: { id, user: { id: userId } },
      relations: ['activity'],
    });

    if (!log) {
      throw new NotFoundException('Activity log not found');
    }

    return this.toResponseDto(log);
  }

  async create(
    dto: CreateActivityLogDto,
    userId: number,
  ): Promise<ActivityLogResponseDto> {
    // Verify activity exists and belongs to user
    const activity = await this.activityRepo.findOne({
      where: { id: dto.activityId, createdBy: { id: userId } },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    // Calculate pace if distance and duration are provided
    const pace =
      dto.distance && dto.duration
        ? this.calculatePace(dto.duration, dto.distance)
        : undefined;

    const log = this.activityLogRepo.create({
      user: { id: userId } as any,
      activity: { id: dto.activityId } as any,
      date: new Date(dto.date),
      duration: dto.duration,
      distance: dto.distance,
      pace: pace || undefined,
      elevationGain: dto.elevationGain,
      maxElevation: dto.maxElevation,
      calories: dto.calories,
      notes: dto.notes,
      scheduledSession: dto.scheduledSessionId
        ? ({ id: dto.scheduledSessionId } as any)
        : null,
    });

    const saved = await this.activityLogRepo.save(log);

    // Update user's streak and weekly workout count
    await this.userService.updateStreakOnActivityLog(userId);

    // Fetch with relations for response
    const withRelations = await this.activityLogRepo.findOne({
      where: { id: saved.id },
      relations: ['activity'],
    });

    if (!withRelations) {
      throw new Error('Failed to fetch saved activity log');
    }

    return this.toResponseDto(withRelations);
  }

  async delete(id: number, userId: number): Promise<void> {
    const log = await this.activityLogRepo.findOne({
      where: { id, user: { id: userId } },
    });

    if (!log) {
      throw new NotFoundException('Activity log not found');
    }

    await this.activityLogRepo.remove(log);
  }

  async update(
    id: number,
    dto: UpdateActivityLogDto,
    userId: number,
  ): Promise<ActivityLogResponseDto> {
    const log = await this.activityLogRepo.findOne({
      where: { id, user: { id: userId } },
      relations: ['activity'],
    });

    if (!log) {
      throw new NotFoundException('Activity log not found');
    }

    if (dto.date !== undefined) log.date = new Date(dto.date);
    if (dto.duration !== undefined) log.duration = dto.duration;
    if (dto.distance !== undefined) log.distance = dto.distance;
    if (dto.elevationGain !== undefined) log.elevationGain = dto.elevationGain;
    if (dto.maxElevation !== undefined) log.maxElevation = dto.maxElevation;
    if (dto.calories !== undefined) log.calories = dto.calories;
    if (dto.notes !== undefined) log.notes = dto.notes;

    // Recalculate pace if distance or duration changed
    if (log.distance && log.duration) {
      log.pace = this.calculatePace(log.duration, log.distance) ?? undefined;
    }

    const saved = await this.activityLogRepo.save(log);

    const withRelations = await this.activityLogRepo.findOne({
      where: { id: saved.id },
      relations: ['activity'],
    });

    if (!withRelations) throw new Error('Failed to fetch updated activity log');
    return this.toResponseDto(withRelations);
  }

  /**
   * Get count of activity logs per day for a user within a date range
   * Used for streak calculation
   */
  async getActivityLogCountsByDay(
    userId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<Map<string, number>> {
    const logs = await this.activityLogRepo
      .createQueryBuilder('log')
      .select('DATE(log.date)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('log.userId = :userId', { userId })
      .andWhere('log.date >= :startDate', { startDate })
      .andWhere('log.date <= :endDate', { endDate })
      .groupBy('DATE(log.date)')
      .getRawMany();

    const countMap = new Map<string, number>();
    logs.forEach((log) => {
      countMap.set(log.date, parseInt(log.count, 10));
    });

    return countMap;
  }
}
