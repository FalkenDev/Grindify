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
  DeleteDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../user/user.entity';
import { I18nString } from '../common/types/i18n.types';

export enum ActivityIcon {
  RUNNING = 'run',
  WALKING = 'walk',
  CYCLING = 'bike',
  FOOTBALL = 'soccer',
  SWIMMING = 'swim',
  KAYAKING = 'kayaking',
  HIKING = 'hiking',
  YOGA = 'yoga',
  BOXING = 'boxing-glove',
  TENNIS = 'tennis',
  BASKETBALL = 'basketball',
  VOLLEYBALL = 'volleyball',
  SKIING = 'ski',
  SKATING = 'skate',
  ROWING = 'rowing',
  WEIGHTLIFTING = 'weight-lifter',
  GOLF = 'golf',
  RUGBY = 'rugby',
  HOCKEY = 'hockey-sticks',
  DANCE = 'dance-ballroom',
  OTHER = 'dots-horizontal',
}

// Partial unique indexes (not decorator) handle uniqueness:
// - Global activities: UNIQUE (name) WHERE createdById IS NULL
// - User activities:   UNIQUE (name, createdById) WHERE createdById IS NOT NULL
@Entity()
export class Activity {
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

  @Column({
    type: 'enum',
    enum: ActivityIcon,
    default: ActivityIcon.OTHER,
  })
  icon: ActivityIcon;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  createdBy: User | null;

  @Column({ type: 'simple-array', nullable: true })
  equipment?: string[];

  @Column({ default: false })
  trackDistance: boolean;

  @Column({ default: false })
  trackPace: boolean;

  @Column({ default: false })
  trackElevation: boolean;

  @Column({ default: false })
  trackCalories: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
