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
  DeleteDateColumn,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../user/user.entity';
import { MuscleGroup } from '../muscleGroup/muscleGroup.entity';
import { ExerciseMedia } from './exerciseMedia.entity';
import { I18nString, I18nStringArray } from '../common/types/i18n.types';

export enum ExerciseType {
  COMPOUND = 'compound',
  ISOLATION = 'isolation',
  BODYWEIGHT = 'bodyweight',
}

@Entity()
export class Exercise {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'jsonb' })
  title: I18nString;

  @Column({ name: 'descriptionI18n', type: 'jsonb', nullable: true })
  descriptionI18n?: I18nString;

  @Column({ default: false })
  isGlobal: boolean;

  @Column({ nullable: true })
  personalizedFromGlobalId?: number;

  @Column({ type: 'timestamptz', nullable: true })
  personalizedAt?: Date;

  @Column({ type: 'varchar', nullable: true })
  image: string | null;

  @Column({ type: 'enum', enum: ExerciseType, nullable: true })
  exerciseType?: ExerciseType;

  @Column({ name: 'equipment_i18n', type: 'jsonb', nullable: true })
  equipmentI18n?: I18nStringArray;

  @Column({ name: 'instructionsI18n', type: 'jsonb', nullable: true })
  instructionsI18n?: I18nStringArray;

  @Column({ name: 'proTipsI18n', type: 'jsonb', nullable: true })
  proTipsI18n?: I18nStringArray;

  @Column({ name: 'mistakesI18n', type: 'jsonb', nullable: true })
  mistakesI18n?: I18nStringArray;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  createdBy: User | null;

  @ManyToMany(() => MuscleGroup)
  @JoinTable()
  primaryMuscleGroups: MuscleGroup[];

  @ManyToMany(() => MuscleGroup, (mg) => mg.exercises, { cascade: true })
  @JoinTable()
  muscleGroups: MuscleGroup[];

  @OneToMany(() => ExerciseMedia, (media) => media.exercise, {
    cascade: true,
    eager: true,
  })
  media: ExerciseMedia[];

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
