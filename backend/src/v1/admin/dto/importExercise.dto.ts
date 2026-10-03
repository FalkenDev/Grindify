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
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExerciseType } from '../../exercise/exercise.entity';
import {
  I18nStringArrayDto,
  I18nStringDto,
} from '../../exercise/dto/createGlobalExercise.dto';

/** Relative path of a file inside an export folder, e.g. "images/cover.webp". */
const ARCHIVE_FILE_PATTERN = /^images\/[A-Za-z0-9_-]+\.(webp|jpe?g|png|mp4)$/;

export class ImportExerciseMediaDto {
  @IsInt()
  @Min(0)
  order: number;

  @IsIn(['image', 'video'])
  type: 'image' | 'video';

  @IsString()
  @Matches(ARCHIVE_FILE_PATTERN)
  file: string;
}

/** Shape of one `exercise.json` in an exercises export archive. */
export class ImportExerciseItemDto {
  @IsObject()
  @ValidateNested()
  @Type(() => I18nStringDto)
  title: I18nStringDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => I18nStringDto)
  description?: I18nStringDto | null;

  @IsOptional()
  @IsEnum(ExerciseType)
  exerciseType?: ExerciseType | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  muscleGroupNames?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  primaryMuscleGroupNames?: string[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => I18nStringArrayDto)
  equipmentI18n?: I18nStringArrayDto | null;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => I18nStringArrayDto)
  instructionsI18n?: I18nStringArrayDto | null;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => I18nStringArrayDto)
  proTipsI18n?: I18nStringArrayDto | null;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => I18nStringArrayDto)
  mistakesI18n?: I18nStringArrayDto | null;

  @IsOptional()
  @IsString()
  @Matches(ARCHIVE_FILE_PATTERN)
  coverImage?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ImportExerciseMediaDto)
  media?: ImportExerciseMediaDto[];
}
