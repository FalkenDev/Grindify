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

import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ExerciseProgressQueryDto {
  @IsOptional()
  @IsEnum(['estimated_1rm', 'max_weight', 'total_volume', 'max_reps'])
  metric?: 'estimated_1rm' | 'max_weight' | 'total_volume' | 'max_reps' =
    'estimated_1rm';

  @IsOptional()
  @IsEnum(['1m', '3m', '6m', '1y', 'all'])
  period?: '1m' | '3m' | '6m' | '1y' | 'all' = 'all';
}

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class WeeksQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(260)
  weeks?: number = 12;
}
