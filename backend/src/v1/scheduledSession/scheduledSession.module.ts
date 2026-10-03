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
import { ScheduledSession } from './scheduledSession.entity';
import { ScheduledSessionService } from './scheduledSession.service';
import { ScheduledSessionController } from './scheduledSession.controller';
import { WorkoutSession } from '../workoutSession/workoutSession.entity';
import { ActivityLog } from '../activityLog/activityLog.entity';
import { Workout } from '../workout/workout.entity';
import { Activity } from '../activity/activity.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ScheduledSession,
      WorkoutSession,
      ActivityLog,
      Workout,
      Activity,
    ]),
  ],
  controllers: [ScheduledSessionController],
  providers: [ScheduledSessionService],
  exports: [ScheduledSessionService, TypeOrmModule],
})
export class ScheduledSessionModule {}
