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
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exercise } from '../exercise/exercise.entity';
import { Workout } from '../workout/workout.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ select: false, nullable: true })
  password: string;

  @Column({ nullable: true, unique: true })
  githubId: string;

  @Column({ nullable: true, unique: true })
  googleId: string;

  @Column({ length: 50, nullable: true })
  firstName: string;

  @Column({ length: 50, nullable: true })
  lastName: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: true })
  showRpe: boolean;

  @Column({ default: 3 })
  weeklyWorkoutGoal: number;

  @Column({ default: 0 })
  currentStreak: number;

  @Column({ type: 'timestamp', nullable: true })
  lastStreakCheckDate: Date;

  @Column({ default: 0 })
  currentWeekWorkouts: number;

  @Column({ default: 1 })
  streakFreezes: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  streakFreezeUsedWeek: string | null;

  @Column({ default: 0 })
  completedGoalWeeksCount: number;

  // Onboarding & Preferences
  @Column({ type: 'varchar', length: 20, nullable: true })
  unitScale: string; // 'metric' or 'imperial'

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  height: number;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  gender: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  primaryGoal: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  targetWeight: number | null;

  @Column({ type: 'int', nullable: true })
  goalTimeframe: number | null;

  @Column({ default: false })
  showWeightTracking: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  weightGoalType: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  startWeight: number; // in weeks

  @Column({ default: false })
  onboardingCompleted: boolean;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ type: 'varchar', length: 20, default: 'user' })
  role: 'user' | 'superadmin';

  @Column({ type: 'varchar', length: 10, default: 'default' })
  language: 'default' | 'eng' | 'swe';

  @Column({ nullable: true, select: false })
  emailVerificationToken: string;

  @Column({ type: 'timestamp', nullable: true, select: false })
  emailVerificationExpires: Date;

  @Column({ nullable: true, select: false })
  passwordResetToken: string;

  @Column({ type: 'timestamp', nullable: true, select: false })
  passwordResetExpires: Date;

  @Column({ type: 'timestamp', nullable: true })
  termsAcceptedAt: Date;

  @Column({ type: 'varchar', length: 10, nullable: true })
  termsVersion: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Exercise, (exercise) => exercise.createdBy)
  exercises: Exercise[];

  @OneToMany(() => Workout, (workout) => workout.createdBy)
  workouts: Workout[];
}
