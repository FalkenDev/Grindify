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
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ExerciseModule } from './exercise/exercise.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { JwtStrategy } from './strategies/Jwt.strategy';
import { WorkoutModule } from './workout/workout.module';
import { WorkoutSessionModule } from './workoutSession/workoutSession.module';
import { MuscleGroupModule } from './muscleGroup/muscleGroup.module';
import { ActivityModule } from './activity/activity.module';
import { ActivityLogModule } from './activityLog/activityLog.module';
import { WeightLogModule } from './weightLog/weightLog.module';
import { ScheduledSessionModule } from './scheduledSession/scheduledSession.module';
import { StatisticsModule } from './statistics/statistics.module';
import { ProgressPhotoModule } from './progressPhoto/progressPhoto.module';
import { ReleasesModule } from './releases/releases.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        autoLoadEntities: true,
        synchronize: true,
        logging: ['error', 'warn', 'query'],
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    ExerciseModule,
    MuscleGroupModule,
    UserModule,
    WorkoutModule,
    WorkoutSessionModule,
    ActivityModule,
    ActivityLogModule,
    WeightLogModule,
    ScheduledSessionModule,
    StatisticsModule,
    ProgressPhotoModule,
    ReleasesModule,
    AdminModule,
  ],
  providers: [AppService, JwtStrategy],
})
export class AppModule {}
