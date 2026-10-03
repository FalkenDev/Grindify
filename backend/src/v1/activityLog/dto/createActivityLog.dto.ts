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
  IsInt,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateActivityLogDto {
  @ApiProperty({ example: 1, description: 'Activity ID' })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  activityId: number;

  @ApiProperty({
    example: '2026-01-19',
    description: 'Date of the activity (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: 45, description: 'Duration in minutes' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration: number;

  @ApiProperty({
    example: 8.5,
    description: 'Distance in kilometers',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  distance?: number;

  @ApiProperty({
    example: 150,
    description: 'Elevation gain in meters',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  elevationGain?: number;

  @ApiProperty({
    example: 320,
    description: 'Max elevation in meters',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxElevation?: number;

  @ApiProperty({
    example: 450,
    description: 'Calories burned',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  calories?: number;

  @ApiProperty({ example: 'Great morning run!', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, description: 'Linked scheduled session ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  scheduledSessionId?: number;
}
