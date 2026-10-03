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
import { Repository } from 'typeorm';
import { WeightLog } from './weightLog.entity';
import { CreateWeightLogDto } from './dto/createWeightLog.dto';
import { UpdateWeightLogDto } from './dto/updateWeightLog.dto';
import {
  WeightLogResponseDto,
  WeightLogStatsDto,
} from './dto/weightLogResponse.dto';
import { User } from '../user/user.entity';

@Injectable()
export class WeightLogService {
  constructor(
    @InjectRepository(WeightLog)
    private readonly weightLogRepo: Repository<WeightLog>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private toResponseDto(log: WeightLog): WeightLogResponseDto {
    return {
      id: log.id,
      date: log.date,
      weight: Number(log.weight),
      notes: log.notes,
      createdAt: log.createdAt,
    };
  }

  async findAll(userId: number): Promise<WeightLogResponseDto[]> {
    const logs = await this.weightLogRepo.find({
      where: { user: { id: userId } },
      order: { date: 'DESC', createdAt: 'DESC' },
    });
    return logs.map((log) => this.toResponseDto(log));
  }

  async create(
    dto: CreateWeightLogDto,
    userId: number,
  ): Promise<WeightLogResponseDto> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const log = this.weightLogRepo.create({
      user: { id: userId } as any,
      date: new Date(dto.date),
      weight: dto.weight,
      notes: dto.notes,
    });
    const saved = await this.weightLogRepo.save(log);

    // Update user's current weight to the latest entry
    user.weight = dto.weight;

    // If this is the first weight log, set startWeight
    if (!user.startWeight) {
      user.startWeight = dto.weight;
    }

    await this.userRepo.save(user);

    return this.toResponseDto(saved);
  }

  async update(
    id: number,
    userId: number,
    dto: UpdateWeightLogDto,
  ): Promise<WeightLogResponseDto> {
    const log = await this.weightLogRepo.findOne({
      where: { id, user: { id: userId } },
    });
    if (!log) throw new NotFoundException('Weight log not found');

    if (dto.weight !== undefined) log.weight = dto.weight;
    if (dto.notes !== undefined) log.notes = dto.notes;

    const updated = await this.weightLogRepo.save(log);

    // If this was the most recent log, update user.weight
    await this.syncUserCurrentWeight(userId);

    return this.toResponseDto(updated);
  }

  async delete(id: number, userId: number): Promise<void> {
    const log = await this.weightLogRepo.findOne({
      where: { id, user: { id: userId } },
    });
    if (!log) throw new NotFoundException('Weight log not found');

    await this.weightLogRepo.remove(log);

    // Recalculate user.weight from the latest remaining log
    await this.syncUserCurrentWeight(userId);
  }

  async getStats(userId: number): Promise<WeightLogStatsDto> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Get all logs ordered by date desc
    const logs = await this.weightLogRepo.find({
      where: { user: { id: userId } },
      order: { date: 'DESC', createdAt: 'DESC' },
    });

    const stats: WeightLogStatsDto = {
      currentWeight: user.weight ? Number(user.weight) : undefined,
      startWeight: user.startWeight ? Number(user.startWeight) : undefined,
      targetWeight: user.targetWeight ? Number(user.targetWeight) : undefined,
      weightGoalType: user.weightGoalType || undefined,
    };

    if (logs.length > 0) {
      const latestWeight = Number(logs[0].weight);
      stats.currentWeight = latestWeight;

      if (stats.startWeight !== undefined) {
        stats.changeFromStart = Number(
          (latestWeight - stats.startWeight).toFixed(2),
        );
      }

      if (logs.length > 1) {
        const previousWeight = Number(logs[1].weight);
        stats.lastLogWeight = previousWeight;
        stats.changeFromLastLog = Number(
          (latestWeight - previousWeight).toFixed(2),
        );
      }
    }

    return stats;
  }

  /**
   * After editing or deleting a log, sync user.weight to the latest remaining log.
   */
  private async syncUserCurrentWeight(userId: number): Promise<void> {
    const latestLog = await this.weightLogRepo.findOne({
      where: { user: { id: userId } },
      order: { date: 'DESC', createdAt: 'DESC' },
    });

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return;

    if (latestLog) {
      user.weight = Number(latestLog.weight);
    }
    // If no logs remain, we leave user.weight as-is (don't null it out)

    await this.userRepo.save(user);
  }
}
