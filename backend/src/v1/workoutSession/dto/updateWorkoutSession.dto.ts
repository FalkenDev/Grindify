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
  IsOptional,
  IsEnum,
  IsString,
  IsDate,
  IsInt,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { WorkoutStatus } from 'src/v1/types/WorkoutStatus.type';

export class UpdateWorkoutSessionDto {
  @ApiPropertyOptional({ enum: ['in_progress', 'finished', 'abandoned'] })
  @IsOptional()
  @IsEnum(WorkoutStatus)
  status?: WorkoutStatus;

  @ApiPropertyOptional({ example: 'Felt good today' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endedAt?: Date;

  @ApiPropertyOptional({
    example: 60,
    description:
      'Corrected total workout duration in minutes for finished sessions',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @ApiPropertyOptional({
    example: 450,
    description: 'Calories burned during the session',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  caloriesBurned?: number;
}
