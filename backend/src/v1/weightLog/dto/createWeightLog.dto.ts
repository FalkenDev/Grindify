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
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWeightLogDto {
  @ApiProperty({ example: '2026-02-08' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: 82.5, description: 'Weight in kg' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  weight: number;

  @ApiProperty({ example: 'Feeling good today', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
