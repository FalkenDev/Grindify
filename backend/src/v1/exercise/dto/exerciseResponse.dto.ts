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
import { MuscleGroupResponseDto } from 'src/v1/muscleGroup/dto/muscleGroupResponse.dto';
import { ExerciseType } from '../exercise.entity';
import { I18nString, I18nStringArray } from '../../common/types/i18n.types';

export class ExerciseMediaResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: ['image', 'video'] })
  type: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  order: number;
}

export class ExerciseResponseDto {
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

  @ApiProperty({ required: false, nullable: true })
  image?: string | null;

  @ApiProperty({ required: false, enum: ExerciseType })
  exerciseType?: ExerciseType;

  @ApiProperty({ required: false, type: [String] })
  equipment: string[];

  @ApiProperty({ required: false })
  equipmentI18n?: I18nStringArray;

  @ApiProperty({ required: false })
  instructions?: I18nStringArray;

  @ApiProperty({ required: false })
  proTips?: I18nStringArray;

  @ApiProperty({ required: false })
  mistakes?: I18nStringArray;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  deletedAt?: Date;

  @ApiProperty({ type: [MuscleGroupResponseDto] })
  primaryMuscleGroups: MuscleGroupResponseDto[];

  @ApiProperty({ type: [MuscleGroupResponseDto] })
  muscleGroups: MuscleGroupResponseDto[];

  @ApiProperty({ type: [ExerciseMediaResponseDto] })
  media: ExerciseMediaResponseDto[];
}
