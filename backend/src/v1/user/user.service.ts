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
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Exercise } from '../exercise/exercise.entity';
import { UserWithoutPasswordDto } from '../auth/dto/UserWithoutPassword.dto';
import { UpdateUserDto } from './dto/UpdateUser.dto';
import { UpdateUserPreferencesDto } from './dto/UpdateUserPreferences.dto';
import { Workout } from '../workout/workout.entity';
import { WorkoutSession } from '../workoutSession/workoutSession.entity';
import { ActivityLog } from '../activityLog/activityLog.entity';
import { WeightLog } from '../weightLog/weightLog.entity';
import { ProgressPhoto } from '../progressPhoto/progressPhoto.entity';
import { ExerciseRecord } from '../statistics/exerciseRecord.entity';
import { UploadService } from '../upload/upload.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,

    @InjectRepository(Workout)
    private readonly workoutRepo: Repository<Workout>,

    @InjectRepository(WorkoutSession)
    private readonly sessionRepo: Repository<WorkoutSession>,

    @InjectRepository(ActivityLog)
    private readonly activityLogRepo: Repository<ActivityLog>,

    @InjectRepository(WeightLog)
    private readonly weightLogRepo: Repository<WeightLog>,

    @InjectRepository(ProgressPhoto)
    private readonly progressPhotoRepo: Repository<ProgressPhoto>,

    @InjectRepository(ExerciseRecord)
    private readonly exerciseRecordRepo: Repository<ExerciseRecord>,

    private readonly uploadService: UploadService,
  ) {}

  async findOneById(userId: number): Promise<UserWithoutPasswordDto> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return new UserWithoutPasswordDto(user);
  }

  async updateUser(
    userId: number,
    dto: UpdateUserDto,
  ): Promise<UserWithoutPasswordDto> {
    const needsPassword = !!dto.newPassword;

    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: needsPassword
        ? [
            'id',
            'email',
            'firstName',
            'lastName',
            'avatar',
            'showRpe',
            'password',
            'createdAt',
            'updatedAt',
          ]
        : [
            'id',
            'email',
            'firstName',
            'lastName',
            'avatar',
            'showRpe',
            'createdAt',
            'updatedAt',
          ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.userRepo.findOne({
        where: { email: dto.email },
      });
      if (existing && existing.id !== userId) {
        throw new BadRequestException('Email already in use');
      }
      user.email = dto.email;
    }

    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Current password is required');
      }
      if (!user.password) {
        throw new BadRequestException('Password not available for comparison');
      }
      const ok = await bcrypt.compare(dto.currentPassword, user.password);
      if (!ok) {
        throw new BadRequestException('Current password is incorrect');
      }
      user.password = await bcrypt.hash(dto.newPassword, 10);
    }

    // Destructure to exclude sensitive fields before saving
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { currentPassword, newPassword, email, dateOfBirth, ...safeDto } =
      dto;
    if (dateOfBirth !== undefined) {
      user.dateOfBirth = new Date(dateOfBirth);
    }
    Object.assign(user, safeDto);
    const updated = await this.userRepo.save(user);

    return new UserWithoutPasswordDto(updated);
  }

  async deleteUser(userId: number): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete related data (sessions first to avoid FK violations from workout_session_exercise)
    await this.sessionRepo.delete({ user: { id: userId } });
    await this.exerciseRepo.delete({ createdBy: { id: userId } });
    await this.workoutRepo.delete({ createdBy: { id: userId } });

    await this.userRepo.remove(user);

    return { message: 'User and all related data deleted' };
  }

  async updateAvatar(
    userId: number,
    avatarUrl: string,
  ): Promise<UserWithoutPasswordDto> {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete old avatar if exists
    if (user.avatar) {
      await this.uploadService.deleteImage(user.avatar);
    }

    user.avatar = avatarUrl;
    const updated = await this.userRepo.save(user);

    return new UserWithoutPasswordDto(updated);
  }

  /**
   * Update streak and weekly workout count when a workout is completed
   * Should be called after finishing a workout session
   */
  async updateStreakOnWorkoutCompletion(userId: number): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return;

    const now = new Date();

    // Check if we need to reset for a new week
    await this.checkAndResetWeeklyProgress(user, now);

    // Increment current week workouts
    user.currentWeekWorkouts += 1;

    // Increment streak by 1 for every workout
    user.currentStreak += 1;

    user.lastStreakCheckDate = now;
    await this.userRepo.save(user);
  }

  /**
   * Check if we're in a new week and reset/update streak accordingly
   * Counts both workout sessions and activity logs
   */
  private async checkAndResetWeeklyProgress(
    user: User,
    now: Date,
  ): Promise<void> {
    if (!user.lastStreakCheckDate) {
      // First time tracking - reset counters
      user.currentWeekWorkouts = 0;
      user.currentStreak = 0;
      return;
    }

    const lastCheck = new Date(user.lastStreakCheckDate);

    // Get the Monday of each week (ISO week starts on Monday)
    const getMondayOfWeek = (date: Date): Date => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day; // Adjust when day is Sunday
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const lastWeekMonday = getMondayOfWeek(lastCheck);
    const currentWeekMonday = getMondayOfWeek(now);

    // If we're in a new week
    if (currentWeekMonday > lastWeekMonday) {
      // Calculate how many weeks have passed
      const weeksPassed = Math.floor(
        (currentWeekMonday.getTime() - lastWeekMonday.getTime()) /
          (7 * 24 * 60 * 60 * 1000),
      );

      // Count total sessions with activities (sessions OR logs) in the previous week
      const lastWeekSunday = new Date(currentWeekMonday);
      lastWeekSunday.setDate(lastWeekSunday.getDate() - 1);
      lastWeekSunday.setHours(23, 59, 59, 999);

      const workoutDays = await this.countTotalSessionsWithActivity(
        user.id,
        lastWeekMonday,
        lastWeekSunday,
      );

      // Get the ISO week key of the previous week for freeze checking
      const prevWeekKey = this.getISOWeekKey(lastWeekMonday);

      // Check if user met their goal in the previous week
      if (workoutDays < user.weeklyWorkoutGoal) {
        // Didn't meet goal — check if a freeze protects this week
        if (user.streakFreezeUsedWeek === prevWeekKey) {
          // Freeze consumed — streak survives
          user.streakFreezeUsedWeek = null;
        } else {
          user.currentStreak = 0;
        }
      } else if (weeksPassed > 1) {
        // More than one week passed (means they didn't workout at all in between)
        // Even if they met the goal in the last tracked week, they missed weeks in between
        user.currentStreak = 0;
        // Clear any stale freeze
        user.streakFreezeUsedWeek = null;
      } else {
        // Goal met for exactly last week — award a freeze if earned
        user.completedGoalWeeksCount = (user.completedGoalWeeksCount || 0) + 1;
        if (
          user.completedGoalWeeksCount % 2 === 0 &&
          (user.streakFreezes || 0) < 2
        ) {
          user.streakFreezes = (user.streakFreezes || 0) + 1;
        }
      }
      // If they met the goal and it's been exactly 1 week, streak continues

      // Reset weekly workout count for the new week
      user.currentWeekWorkouts = 0;

      // Update lastStreakCheckDate to the start of the current week so that
      // repeated calls (e.g. from getStreakInfo) don't re-run the rollover
      // logic and incorrectly increment completedGoalWeeksCount again.
      user.lastStreakCheckDate = currentWeekMonday;
    }
  }

  /**
   * Returns the ISO week key for a given date, e.g. "2026-W18"
   */
  private getISOWeekKey(date: Date): string {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(
      ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
    );
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }

  /**
   * Count total sessions with either workout sessions or activity logs in a date range
   */
  private async countTotalSessionsWithActivity(
    userId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    // Get all workout sessions
    const sessions = await this.sessionRepo.find({
      where: {
        user: { id: userId },
        status: 'finished',
      },
      select: ['startedAt'],
    });

    // Get all activity logs
    const activityLogs = await this.activityLogRepo.find({
      where: {
        user: { id: userId },
      },
      select: ['date'],
    });

    let count = 0;

    sessions.forEach((session) => {
      const date = new Date(session.startedAt);
      if (date >= startDate && date <= endDate) {
        count++;
      }
    });

    activityLogs.forEach((log) => {
      const date = new Date(log.date);
      if (date >= startDate && date <= endDate) {
        count++;
      }
    });

    return count;
  }

  /**
   * Decrement streak when a finished session or activity log is deleted
   */
  async decrementStreakOnDeletion(userId: number): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return;
    if (user.currentStreak > 0) {
      user.currentStreak -= 1;
    }
    await this.userRepo.save(user);
  }

  /**
   * Update streak and weekly workout count when an activity log is created
   * Should be called after logging an activity
   */
  async updateStreakOnActivityLog(userId: number): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return;

    const now = new Date();

    // Check if we need to reset for a new week
    await this.checkAndResetWeeklyProgress(user, now);

    // Increment current week workouts
    user.currentWeekWorkouts += 1;

    // Increment streak by 1 for every activity
    user.currentStreak += 1;

    user.lastStreakCheckDate = now;
    await this.userRepo.save(user);
  }

  /**
   * Use a streak freeze to protect the current week from a streak reset
   */
  async useStreakFreeze(
    userId: number,
    date: string,
  ): Promise<{
    currentStreak: number;
    weeklyWorkoutGoal: number;
    currentWeekWorkouts: number;
    progressPercentage: number;
    streakFreezes: number;
    freezeUsedThisWeek: boolean;
    streakFreezeUsedWeek: string | null;
  }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if ((user.streakFreezes || 0) <= 0) {
      throw new BadRequestException('No streak freezes available');
    }

    const now = new Date();
    const currentWeekKey = this.getISOWeekKey(now);

    const targetDate = new Date(date + 'T12:00:00');
    if (Number.isNaN(targetDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }
    const targetWeekKey = this.getISOWeekKey(targetDate);

    if (targetWeekKey !== currentWeekKey) {
      throw new BadRequestException('Can only freeze the current week');
    }

    if (user.streakFreezeUsedWeek === currentWeekKey) {
      throw new BadRequestException('A freeze is already active this week');
    }

    user.streakFreezeUsedWeek = currentWeekKey;
    user.streakFreezes = (user.streakFreezes || 0) - 1;
    await this.userRepo.save(user);

    return this.getStreakInfo(userId);
  }

  /**
   * Get user's current streak information
   */
  async getStreakInfo(userId: number): Promise<{
    currentStreak: number;
    weeklyWorkoutGoal: number;
    currentWeekWorkouts: number;
    progressPercentage: number;
    streakFreezes: number;
    freezeUsedThisWeek: boolean;
    streakFreezeUsedWeek: string | null;
  }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if we need to update streak for new week
    const now = new Date();
    await this.checkAndResetWeeklyProgress(user, now);

    // Recalculate current week workouts based on actual activity
    const getMondayOfWeek = (date: Date): Date => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const currentWeekMonday = getMondayOfWeek(now);
    const currentWeekSunday = new Date(currentWeekMonday);
    currentWeekSunday.setDate(currentWeekSunday.getDate() + 6);
    currentWeekSunday.setHours(23, 59, 59, 999);

    user.currentWeekWorkouts = await this.countTotalSessionsWithActivity(
      userId,
      currentWeekMonday,
      currentWeekSunday,
    );

    await this.userRepo.save(user);

    const progressPercentage =
      user.weeklyWorkoutGoal > 0
        ? Math.min(
            (user.currentWeekWorkouts / user.weeklyWorkoutGoal) * 100,
            100,
          )
        : 0;

    const currentWeekKey = this.getISOWeekKey(now);

    return {
      currentStreak: user.currentStreak,
      weeklyWorkoutGoal: user.weeklyWorkoutGoal,
      currentWeekWorkouts: user.currentWeekWorkouts,
      progressPercentage: Math.round(progressPercentage),
      streakFreezes: user.streakFreezes ?? 1,
      freezeUsedThisWeek: user.streakFreezeUsedWeek === currentWeekKey,
      streakFreezeUsedWeek: user.streakFreezeUsedWeek ?? null,
    };
  }

  /**
   * Update user's weekly workout goal
   */
  async updateWeeklyWorkoutGoal(
    userId: number,
    weeklyWorkoutGoal: number,
  ): Promise<UserWithoutPasswordDto> {
    if (weeklyWorkoutGoal < 1 || weeklyWorkoutGoal > 7) {
      throw new BadRequestException(
        'Weekly workout goal must be between 1 and 7',
      );
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.weeklyWorkoutGoal = weeklyWorkoutGoal;
    const updated = await this.userRepo.save(user);

    return new UserWithoutPasswordDto(updated);
  }

  /**
   * Export all user data for GDPR Art. 20 data portability
   */
  async exportUserData(userId: number): Promise<object> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [
      exercises,
      workouts,
      sessions,
      activityLogs,
      weightLogs,
      progressPhotos,
      exerciseRecords,
    ] = await Promise.all([
      this.exerciseRepo.find({
        where: { createdBy: { id: userId } },
        relations: ['media'],
      }),
      this.workoutRepo.find({
        where: { createdBy: { id: userId } },
        relations: ['exercises'],
      }),
      this.sessionRepo.find({
        where: { user: { id: userId } },
        relations: ['exercises', 'exercises.sets'],
      }),
      this.activityLogRepo.find({ where: { user: { id: userId } } }),
      this.weightLogRepo.find({ where: { user: { id: userId } } }),
      this.progressPhotoRepo.find({ where: { user: { id: userId } } }),
      this.exerciseRecordRepo.find({
        where: { user: { id: userId } },
        relations: ['exercise'],
      }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      profile: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        weight: user.weight,
        height: user.height,
        unitScale: user.unitScale,
        primaryGoal: user.primaryGoal,
        weeklyWorkoutGoal: user.weeklyWorkoutGoal,
        currentStreak: user.currentStreak,
        termsAcceptedAt: user.termsAcceptedAt,
        termsVersion: user.termsVersion,
        createdAt: user.createdAt,
      },
      exercises,
      workouts,
      workoutSessions: sessions,
      activityLogs,
      weightLogs,
      progressPhotos,
      exerciseRecords,
    };
  }

  /**
   * Update user preferences (onboarding data)
   */
  async updateUserPreferences(
    userId: number,
    dto: UpdateUserPreferencesDto,
  ): Promise<UserWithoutPasswordDto> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update all provided fields
    if (dto.unitScale !== undefined) user.unitScale = dto.unitScale;
    if (dto.weight !== undefined) user.weight = dto.weight;
    if (dto.height !== undefined) user.height = dto.height;
    if (dto.dateOfBirth !== undefined)
      user.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.gender !== undefined) user.gender = dto.gender;
    if (dto.primaryGoal !== undefined) user.primaryGoal = dto.primaryGoal;
    if (dto.weeklyWorkoutGoal !== undefined) {
      if (dto.weeklyWorkoutGoal < 1 || dto.weeklyWorkoutGoal > 7) {
        throw new BadRequestException(
          'Weekly workout goal must be between 1 and 7',
        );
      }
      user.weeklyWorkoutGoal = dto.weeklyWorkoutGoal;
    }
    if (dto.targetWeight !== undefined) user.targetWeight = dto.targetWeight;
    if (dto.goalTimeframe !== undefined) user.goalTimeframe = dto.goalTimeframe;
    if (dto.showRpe !== undefined) user.showRpe = dto.showRpe;
    if (dto.onboardingCompleted !== undefined)
      user.onboardingCompleted = dto.onboardingCompleted;
    if (dto.showWeightTracking !== undefined)
      user.showWeightTracking = dto.showWeightTracking;
    if (dto.weightGoalType !== undefined)
      user.weightGoalType = dto.weightGoalType;
    if (dto.startWeight !== undefined) user.startWeight = dto.startWeight;
    if (dto.language !== undefined) user.language = dto.language;

    const updated = await this.userRepo.save(user);
    return new UserWithoutPasswordDto(updated);
  }
}
