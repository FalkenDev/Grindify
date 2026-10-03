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
  IsString,
  IsOptional,
  IsNotEmpty,
  IsArray,
  IsInt,
  IsEnum,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ExerciseType } from '../exercise.entity';

export class CreateExerciseDto {
  @ApiProperty({ example: 'Bench Press' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'Push movement for chest', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({
    example: 'compound',
    enum: ExerciseType,
    required: false,
  })
  @IsOptional()
  @IsEnum(ExerciseType)
  exerciseType?: ExerciseType;

  @ApiProperty({
    example: [1, 2],
    description: 'Array of muscle group IDs',
    required: false,
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @Type(() => Number)
  @IsInt({ each: true })
  muscleGroupIds?: number[];

  @ApiProperty({
    example: [1, 2],
    description: 'Primary muscle group IDs',
    required: false,
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @Type(() => Number)
  @IsInt({ each: true })
  primaryMuscleGroupIds?: number[];

  @ApiProperty({
    example: ['Barbell', 'Bench'],
    description: 'Equipment needed',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(2000, { each: true })
  equipment?: string[];

  @ApiProperty({
    example: ['Lie flat on bench', 'Grip the bar'],
    description: 'Step-by-step instructions',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(2000, { each: true })
  instructions?: string[];

  @ApiProperty({
    example: ['Keep shoulder blades retracted'],
    description: 'Pro tips',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(2000, { each: true })
  proTips?: string[];

  @ApiProperty({
    example: ['Do not bounce the bar off chest'],
    description: 'Common mistakes to avoid',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(2000, { each: true })
  mistakes?: string[];
}
