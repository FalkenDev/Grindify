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

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../user/user.entity';
import { Workout } from '../workout/workout.entity';
import { WorkoutSession } from '../workoutSession/workoutSession.entity';
import { ExerciseModule } from '../exercise/exercise.module';
import { ActivityModule } from '../activity/activity.module';
import { MuscleGroupModule } from '../muscleGroup/muscleGroup.module';
import { ExerciseImage } from '../exercise/exerciseImage.entity';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Workout, WorkoutSession, ExerciseImage]),
    ExerciseModule,
    ActivityModule,
    MuscleGroupModule,
    UploadModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
