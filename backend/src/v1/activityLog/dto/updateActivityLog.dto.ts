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
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateActivityLogDto {
  @ApiProperty({ example: '2026-01-19', required: false })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ example: 45, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration?: number;

  @ApiProperty({ example: 8.5, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  distance?: number;

  @ApiProperty({ example: 150, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  elevationGain?: number;

  @ApiProperty({ example: 320, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxElevation?: number;

  @ApiProperty({ example: 350, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  calories?: number;

  @ApiProperty({ example: 'Good run today', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
