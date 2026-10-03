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

import { User } from '../user/user.entity';
import { Exercise } from '../exercise/exercise.entity';
import { ExerciseMedia } from '../exercise/exerciseMedia.entity';
import { Workout } from '../workout/workout.entity';
import { WorkoutExercise } from '../workout/workoutExercise.entity';
import { WorkoutSession } from '../workoutSession/workoutSession.entity';
import { WorkoutSessionExercise } from '../workoutSession/workoutSessionExercise.entity';
import { WorkoutSessionSet } from '../workoutSession/workoutSessionSet.entity';
import { MuscleGroup } from '../muscleGroup/muscleGroup.entity';
import { ScheduledSession } from '../scheduledSession/scheduledSession.entity';
import { Activity } from '../activity/activity.entity';
import { ActivityLog } from '../activityLog/activityLog.entity';

// Seeders
import { seedUsers } from './seeders/users.seeder';
import { seedMuscleGroups } from './seeders/muscleGroups.seeder';
import { seedUserExercises } from './seeders/exercises.seeder';
import { seedActivities } from './seeders/activities.seeder';
import { getDbLogging } from '../common/dbLogging.util';

// The seed script truncates tables and uses synchronize — never in production
if (process.env.NODE_ENV === 'production') {
  console.error('❌ Refusing to run the seed script with NODE_ENV=production');
  process.exit(1);
}

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'postgres',
  port: +(process.env.DATABASE_PORT || 5432),
  // No default credentials — must come from the environment
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || 'grindifydb',
  entities: [
    User,
    Exercise,
    ExerciseMedia,
    Workout,
    WorkoutExercise,
    WorkoutSession,
    WorkoutSessionExercise,
    WorkoutSessionSet,
    MuscleGroup,
    ScheduledSession,
    Activity,
    ActivityLog,
  ],
  // Keep in sync with app.module.ts (synchronize: true). This makes the seed script
  // resilient when we add new entities.
  synchronize: true,
  logging: getDbLogging(),
});

async function seed() {
  await AppDataSource.initialize();
  console.log(
    '✅ Database connected:',
    AppDataSource.options.type,
    AppDataSource.options.database,
  );

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.startTransaction();

  try {
    // Clear tables respecting FKs
    await AppDataSource.query(
      `
      TRUNCATE TABLE
        "workout_session_set",
        "workout_session_exercise",
        "workout_session",
        "workout_exercise",
        "workout",
        "exercise_muscle_groups_muscle_group",
        "activity_log" RESTART IDENTITY CASCADE;
    `,
    ).catch(() => {});

    await AppDataSource.query(`
      TRUNCATE TABLE
        "exercise",
        "muscle_group",
        "activity",
        "user" RESTART IDENTITY CASCADE;
    `);

    console.log('🧹 Cleared existing data');

    // Seed users
    const createdUsers = await seedUsers(AppDataSource);
    const mainUser = createdUsers[0];

    // Seed muscle groups
    const mgMap = await seedMuscleGroups(AppDataSource);

    // Seed default exercises for the test user
    await seedUserExercises(AppDataSource, mgMap, mainUser);

    // Seed default activities for test user
    await seedActivities(AppDataSource, mainUser);

    await queryRunner.commitTransaction();
    console.log('✅ Database successfully seeded!');
    process.exit(0);
  } catch (err) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

seed().catch((e) => {
  console.error('❌ Unhandled seeding error:', e);
  process.exit(1);
});
