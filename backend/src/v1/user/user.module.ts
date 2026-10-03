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
import { UserService } from './user.service';
import { Exercise } from '../exercise/exercise.entity';
import { User } from './user.entity';
import { UserController } from './user.controller';
import { Workout } from '../workout/workout.entity';
import { WorkoutSession } from '../workoutSession/workoutSession.entity';
import { ActivityLog } from '../activityLog/activityLog.entity';
import { WeightLog } from '../weightLog/weightLog.entity';
import { ProgressPhoto } from '../progressPhoto/progressPhoto.entity';
import { ExerciseRecord } from '../statistics/exerciseRecord.entity';
import { UploadModule } from '../upload/upload.module';
import { EmailModule } from '../email/email.module';
import { TokenModule } from '../auth/token.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Exercise,
      Workout,
      WorkoutSession,
      ActivityLog,
      WeightLog,
      ProgressPhoto,
      ExerciseRecord,
    ]),
    UploadModule,
    EmailModule,
    TokenModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService, TypeOrmModule],
})
export class UserModule {}
