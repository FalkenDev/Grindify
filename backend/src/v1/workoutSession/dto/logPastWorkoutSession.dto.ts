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
  IsNumber,
  IsString,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class LogPastSetDto {
  @Type(() => Number)
  @IsNumber()
  setNumber: number;

  @Type(() => Number)
  @IsNumber()
  weight: number;

  @Type(() => Number)
  @IsNumber()
  reps: number;
}

export class LogPastExerciseDto {
  @Type(() => Number)
  @IsNumber()
  exerciseId: number;

  @ValidateNested({ each: true })
  @Type(() => LogPastSetDto)
  @IsArray()
  sets: LogPastSetDto[];
}

export class LogPastWorkoutSessionDto {
  @ApiProperty({ example: 1, description: 'Workout ID', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  workoutId?: number;

  @ApiProperty({
    example: '2026-01-10T10:00:00.000Z',
    description: 'Start time of the past session',
  })
  @IsDateString()
  startedAt: string;

  @ApiProperty({
    example: '2026-01-10T11:00:00.000Z',
    description: 'End time of the past session',
  })
  @IsDateString()
  endedAt: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, description: 'Linked scheduled session ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  scheduledSessionId?: number;

  @ApiProperty({
    required: false,
    description: 'Completed exercises with sets',
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LogPastExerciseDto)
  @IsArray()
  completedExercises?: LogPastExerciseDto[];
}
