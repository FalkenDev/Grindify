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

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

import { User } from './user/user.entity';
import { Exercise } from './exercise/exercise.entity';
import { ExerciseMedia } from './exercise/exerciseMedia.entity';
import { ExerciseImage } from './exercise/exerciseImage.entity';
import { Workout } from './workout/workout.entity';
import { WorkoutExercise } from './workout/workoutExercise.entity';
import { WorkoutSession } from './workoutSession/workoutSession.entity';
import { MuscleGroup } from './muscleGroup/muscleGroup.entity';
import { WorkoutSessionExercise } from './workoutSession/workoutSessionExercise.entity';
import { WorkoutSessionSet } from './workoutSession/workoutSessionSet.entity';
import { ScheduledSession } from './scheduledSession/scheduledSession.entity';
import { Activity } from './activity/activity.entity';
import { ActivityLog } from './activityLog/activityLog.entity';
import { ExerciseRecord } from './statistics/exerciseRecord.entity';
import { WeightLog } from './weightLog/weightLog.entity';
import { ProgressPhoto } from './progressPhoto/progressPhoto.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'postgres',
  port: +(process.env.DATABASE_PORT || 5432),
  username: process.env.DATABASE_USER || 'user',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'grindifydb',
  synchronize: false,
  logging: ['error', 'warn'],
  entities: [
    User,
    MuscleGroup,
    Exercise,
    ExerciseMedia,
    ExerciseImage,
    Workout,
    WorkoutExercise,
    WorkoutSession,
    WorkoutSessionExercise,
    WorkoutSessionSet,
    ScheduledSession,
    Activity,
    ActivityLog,
    ExerciseRecord,
    WeightLog,
    ProgressPhoto,
  ],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
});
