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

import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UseStreakFreezeDto {
  @ApiProperty({
    description: 'ISO 8601 date string (YYYY-MM-DD) of a day in the current week to freeze',
    example: '2026-05-08',
  })
  @IsDateString()
  date: string;
}
