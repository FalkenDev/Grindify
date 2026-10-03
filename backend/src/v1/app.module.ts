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
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
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
import { AuditModule } from './audit/audit.module';
import { ClientIpThrottlerGuard } from './guards/clientIpThrottler.guard';
import { getDbLogging } from './common/dbLogging.util';

const positiveInt = (raw: string | undefined, fallback: number): number => {
  const n = parseInt(raw ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

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
        synchronize: false,
        migrations: [__dirname + '/migrations/*.{ts,js}'],
        migrationsRun: true,
        logging: getDbLogging(configService.get<string>('DB_LOGGING')),
      }),
      inject: [ConfigService],
    }),
    // Global default rate limit; auth endpoints set stricter limits.
    // THROTTLE_TTL is in seconds, THROTTLE_LIMIT = requests per TTL window.
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: positiveInt(process.env.THROTTLE_TTL, 60) * 1000,
        limit: positiveInt(process.env.THROTTLE_LIMIT, 300),
      },
    ]),
    AuditModule,
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
  providers: [
    AppService,
    JwtStrategy,
    { provide: APP_GUARD, useClass: ClientIpThrottlerGuard },
  ],
})
export class AppModule {}
