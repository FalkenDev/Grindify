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
import { IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class WorkoutExerciseDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  order!: number;

  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsNumber()
  sets!: number;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber()
  reps!: number;

  @ApiProperty({ example: 60 })
  @Type(() => Number)
  @IsNumber()
  pauseSeconds!: number;

  @ApiProperty({ example: 50 })
  @Type(() => Number)
  @IsNumber()
  weight!: number;

  @ApiProperty({ example: [40, 60, 60], nullable: true })
  setWeights!: number[] | null;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsNumber()
  exerciseId!: number;
}
