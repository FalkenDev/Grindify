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
  IsEnum,
  IsOptional,
  IsInt,
  IsBoolean,
  IsDateString,
  IsString,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ScheduledSessionType } from '../scheduledSession.entity';

export class CreateScheduledSessionDto {
  @ApiProperty({
    enum: ScheduledSessionType,
    description: 'Type of session to schedule',
  })
  @IsEnum(ScheduledSessionType)
  type: ScheduledSessionType;

  @ApiProperty({ example: 1, description: 'Workout ID', required: false })
  @ValidateIf((o) => o.type === ScheduledSessionType.WORKOUT)
  @Type(() => Number)
  @IsInt()
  workoutId?: number;

  @ApiProperty({ example: 1, description: 'Activity ID', required: false })
  @ValidateIf((o) => o.type === ScheduledSessionType.ACTIVITY)
  @Type(() => Number)
  @IsInt()
  activityId?: number;

  @ApiProperty({
    example: '2026-02-15',
    description: 'Scheduled date (YYYY-MM-DD) for one-time',
    required: false,
  })
  @ValidateIf((o) => !o.isRecurring)
  @IsDateString()
  scheduledDate?: string;

  @ApiProperty({
    example: 0,
    description: 'Day of week for recurring (0=Mon, 6=Sun)',
    required: false,
  })
  @ValidateIf((o) => o.isRecurring)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ApiProperty({
    example: '2026-12-31',
    description: 'Optional end date for recurring sessions (YYYY-MM-DD, inclusive)',
    required: false,
  })
  @ValidateIf((o) => o.isRecurring)
  @IsOptional()
  @IsDateString()
  recurringEndDate?: string;

  @ApiProperty({ example: false, description: 'Whether this is recurring' })
  @IsBoolean()
  isRecurring: boolean;

  @ApiProperty({ example: 'Leg day', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
