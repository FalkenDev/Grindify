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

import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
  IsIn,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWorkoutDto {
  @ApiProperty({ example: 'Push Day A' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'Chest, shoulders, triceps', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 45,
    required: false,
    description: 'Planned workout time in minutes',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  time?: number;

  @ApiProperty({
    example: 'strength',
    required: false,
    enum: ['strength', 'cardio', 'hiit', 'flexibility', 'endurance'],
  })
  @IsOptional()
  @IsEnum(['strength', 'cardio', 'hiit', 'flexibility', 'endurance'])
  type?: 'strength' | 'cardio' | 'hiit' | 'flexibility' | 'endurance';

  @ApiProperty({ example: 'default', required: false })
  @IsOptional()
  @IsIn(['default', 'latest'])
  defaultWeightAndReps?: 'default' | 'latest';

  @ApiProperty({
    example: [1, 2],
    required: false,
    description: 'Array of muscle group IDs to set as workout target muscles',
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  targetMuscleGroupIds?: number[];
}
