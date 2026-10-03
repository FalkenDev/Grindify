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
import { ArrayMaxSize, IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class AddRemoveExercisesDto {
  @ApiProperty({
    description: 'An array of exercise IDs to add or remove from the workout',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray()
  @ArrayMaxSize(100)
  @Type(() => Number)
  @IsNumber({}, { each: true })
  exerciseIds!: number[];
}
