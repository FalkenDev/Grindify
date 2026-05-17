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
  IsString,
  IsArray,
  IsInt,
  IsEnum,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ExerciseType } from '../exercise.entity';
import { I18nString, I18nStringArray } from '../../common/types/i18n.types';

export class I18nStringDto implements I18nString {
  @ApiProperty()
  @IsOptional()
  @IsString()
  default: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  eng?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  swe?: string;
}

export class I18nStringArrayDto implements I18nStringArray {
  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  default?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  eng?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  swe?: string[];
}

export class CreateGlobalExerciseDto {
  @ApiProperty({ type: I18nStringDto })
  @IsObject()
  @ValidateNested()
  @Type(() => I18nStringDto)
  title: I18nStringDto;

  @ApiProperty({ type: I18nStringDto, required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => I18nStringDto)
  description?: I18nStringDto;

  @ApiProperty({ enum: ExerciseType, required: false })
  @IsOptional()
  @IsEnum(ExerciseType)
  exerciseType?: ExerciseType;

  @ApiProperty({ type: [Number], required: false })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  muscleGroupIds?: number[];

  @ApiProperty({ type: [Number], required: false })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  primaryMuscleGroupIds?: number[];

  @ApiProperty({ type: I18nStringArrayDto, required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => I18nStringArrayDto)
  equipmentI18n?: I18nStringArrayDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ type: I18nStringArrayDto, required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => I18nStringArrayDto)
  instructionsI18n?: I18nStringArrayDto;

  @ApiProperty({ type: I18nStringArrayDto, required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => I18nStringArrayDto)
  proTipsI18n?: I18nStringArrayDto;

  @ApiProperty({ type: I18nStringArrayDto, required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => I18nStringArrayDto)
  mistakesI18n?: I18nStringArrayDto;
}

export class UpdateGlobalExerciseDto extends CreateGlobalExerciseDto {}
