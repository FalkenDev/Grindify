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
import { Repository, ILike } from 'typeorm';
import { User } from '../user/user.entity';
import { Workout } from '../workout/workout.entity';
import { WorkoutSession } from '../workoutSession/workoutSession.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Workout)
    private readonly workoutRepo: Repository<Workout>,

    @InjectRepository(WorkoutSession)
    private readonly sessionRepo: Repository<WorkoutSession>,
  ) {}

  async listUsers(page: number, limit: number, search?: string) {
    const where = search
      ? [
          { email: ILike(`%${search}%`) },
          { firstName: ILike(`%${search}%`) },
          { lastName: ILike(`%${search}%`) },
        ]
      : {};

    const [users, total] = await this.userRepo.findAndCount({
      where,
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'avatar',
        'role',
        'emailVerified',
        'currentStreak',
        'weeklyWorkoutGoal',
        'onboardingCompleted',
        'createdAt',
        'updatedAt',
      ],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { users, total, page, limit };
  }

  async getUserById(id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'avatar',
        'role',
        'emailVerified',
        'currentStreak',
        'weeklyWorkoutGoal',
        'currentWeekWorkouts',
        'streakFreezes',
        'completedGoalWeeksCount',
        'unitScale',
        'weight',
        'height',
        'dateOfBirth',
        'gender',
        'primaryGoal',
        'onboardingCompleted',
        'showRpe',
        'showWeightTracking',
        'termsAcceptedAt',
        'termsVersion',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getStats() {
    const [totalUsers, totalWorkouts, totalSessions] = await Promise.all([
      this.userRepo.count(),
      this.workoutRepo.count(),
      this.sessionRepo.count({ where: { status: 'finished' } }),
    ]);

    const recentUsers = await this.userRepo.find({
      select: ['id', 'email', 'firstName', 'lastName', 'avatar', 'createdAt'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsersLast30Days = await this.userRepo
      .createQueryBuilder('user')
      .where('user.createdAt >= :date', { date: thirtyDaysAgo })
      .getCount();

    return {
      totalUsers,
      totalWorkouts,
      totalSessions,
      newUsersLast30Days,
      recentUsers,
    };
  }

  async getMe(userId: number) {
    return this.getUserById(userId);
  }
}
