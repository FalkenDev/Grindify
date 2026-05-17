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
import { ActivityIcon } from '../activity.entity';
import { I18nString } from '../../common/types/i18n.types';

export class ActivityResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: I18nString;

  @ApiProperty({ required: false })
  description?: I18nString;

  @ApiProperty()
  isGlobal: boolean;

  @ApiProperty({ required: false })
  personalizedFromGlobalId?: number;

  @ApiProperty({ required: false })
  personalizedAt?: Date;

  @ApiProperty({ enum: ActivityIcon })
  icon: ActivityIcon;

  @ApiProperty({ required: false, type: [String] })
  equipment?: string[];

  @ApiProperty()
  trackDistance: boolean;

  @ApiProperty()
  trackPace: boolean;

  @ApiProperty()
  trackElevation: boolean;

  @ApiProperty()
  trackCalories: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
