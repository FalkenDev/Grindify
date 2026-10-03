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
import { IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class ExerciseOrder {
  @ApiProperty({ description: 'The workout exercise ID', example: 1 })
  @Type(() => Number)
  @IsNumber()
  workoutExerciseId!: number;

  @ApiProperty({ description: 'The new order position', example: 1 })
  @Type(() => Number)
  @IsNumber()
  order!: number;
}

export class ReorderExercisesDto {
  @ApiProperty({
    description: 'Array of exercises with their new order positions',
    type: [ExerciseOrder],
    example: [
      { workoutExerciseId: 3, order: 1 },
      { workoutExerciseId: 1, order: 2 },
      { workoutExerciseId: 2, order: 3 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseOrder)
  exercises!: ExerciseOrder[];
}
