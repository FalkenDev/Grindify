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
  IsArray,
  IsEnum,
  IsBoolean,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ActivityIcon } from '../activity.entity';
import { I18nStringDto } from '../../exercise/dto/createGlobalExercise.dto';

export class CreateGlobalActivityDto {
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

  @ApiProperty({ enum: ActivityIcon })
  @IsEnum(ActivityIcon)
  icon: ActivityIcon;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  equipment?: string[];

  @ApiProperty()
  @IsBoolean()
  trackDistance: boolean;

  @ApiProperty()
  @IsBoolean()
  trackPace: boolean;

  @ApiProperty()
  @IsBoolean()
  trackElevation: boolean;

  @ApiProperty()
  @IsBoolean()
  trackCalories: boolean;
}

export class UpdateGlobalActivityDto extends CreateGlobalActivityDto {}
