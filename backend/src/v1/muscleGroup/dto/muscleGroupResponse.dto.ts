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
import { I18nString } from '../../common/types/i18n.types';

export class MuscleGroupResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ description: 'Internal key identifier, e.g. muscleGroups.chest' })
  name: string;

  @ApiProperty()
  nameI18n: I18nString;

  @ApiProperty({ required: false })
  descriptionI18n?: I18nString;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
