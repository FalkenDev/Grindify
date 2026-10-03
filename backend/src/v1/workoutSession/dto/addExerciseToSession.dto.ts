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
  IsNumber,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMaxSize,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

class SetDto {
  @Type(() => Number)
  @IsNumber()
  setNumber: number;

  @Type(() => Number)
  @IsNumber()
  weight: number;

  @Type(() => Number)
  @IsNumber()
  reps: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rpe?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class AddExerciseToSessionDto {
  @Type(() => Number)
  @IsNumber()
  exerciseId: number;

  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => SetDto)
  sets: SetDto[];
}
