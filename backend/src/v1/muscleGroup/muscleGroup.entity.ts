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
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import { Exercise } from '../exercise/exercise.entity';
import { I18nString } from '../common/types/i18n.types';

@Entity()
export class MuscleGroup {
  @PrimaryGeneratedColumn()
  id: number;

  // Internal identifier key, e.g. 'chest', 'muscleGroups.back' — not shown directly to users
  @Column({ unique: true })
  name: string;

  @Column({ name: 'nameI18n', type: 'jsonb' })
  nameI18n: I18nString;

  @Column({ name: 'descriptionI18n', type: 'jsonb', nullable: true })
  descriptionI18n?: I18nString;

  @ManyToMany(() => Exercise, (exercise) => exercise.muscleGroups)
  exercises: Exercise[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
