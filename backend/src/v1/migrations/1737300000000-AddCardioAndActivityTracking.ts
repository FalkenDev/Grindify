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
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableUnique,
} from 'typeorm';

export class AddCardioAndActivityTracking1737300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add trackingMode and defaultDistance to exercise table
    await queryRunner.addColumn(
      'exercise',
      new TableColumn({
        name: 'trackingMode',
        type: 'enum',
        enum: ['strength', 'cardio'],
        default: "'strength'",
      }),
    );

    await queryRunner.addColumn(
      'exercise',
      new TableColumn({
        name: 'defaultDistance',
        type: 'decimal',
        precision: 6,
        scale: 2,
        isNullable: true,
      }),
    );

    // 3. Add distance to workout_exercise table
    await queryRunner.addColumn(
      'workout_exercise',
      new TableColumn({
        name: 'distance',
        type: 'decimal',
        precision: 6,
        scale: 2,
        isNullable: true,
      }),
    );

    // 4. Make weight and reps nullable, add distance, duration, calories to workout_session_set table
    await queryRunner.changeColumn(
      'workout_session_set',
      'weight',
      new TableColumn({
        name: 'weight',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.changeColumn(
      'workout_session_set',
      'reps',
      new TableColumn({
        name: 'reps',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'workout_session_set',
      new TableColumn({
        name: 'distance',
        type: 'decimal',
        precision: 6,
        scale: 2,
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'workout_session_set',
      new TableColumn({
        name: 'duration',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'workout_session_set',
      new TableColumn({
        name: 'calories',
        type: 'int',
        isNullable: true,
      }),
    );

    // 5. Create activity table
    await queryRunner.createTable(
      new Table({
        name: 'activity',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'icon',
            type: 'enum',
            enum: [
              'running',
              'walking',
              'cycling',
              'football',
              'swimming',
              'kayaking',
              'hiking',
              'yoga',
              'boxing',
              'tennis',
              'basketball',
              'volleyball',
              'skiing',
              'skating',
              'rowing',
              'other',
            ],
            default: "'other'",
          },
          {
            name: 'createdById',
            type: 'int',
          },
          {
            name: 'trackDistance',
            type: 'boolean',
            default: false,
          },
          {
            name: 'trackPace',
            type: 'boolean',
            default: false,
          },
          {
            name: 'trackElevation',
            type: 'boolean',
            default: false,
          },
          {
            name: 'trackCalories',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign key for activity.createdBy
    await queryRunner.createForeignKey(
      'activity',
      new TableForeignKey({
        columnNames: ['createdById'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    );

    // Add unique constraint for activity name per user
    await queryRunner.createUniqueConstraint(
      'activity',
      new TableUnique({
        name: 'UQ_activity_name_user',
        columnNames: ['name', 'createdById'],
      }),
    );

    // 6. Create activity_log table
    await queryRunner.createTable(
      new Table({
        name: 'activity_log',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'userId',
            type: 'int',
          },
          {
            name: 'activityId',
            type: 'int',
          },
          {
            name: 'date',
            type: 'date',
          },
          {
            name: 'duration',
            type: 'int',
          },
          {
            name: 'distance',
            type: 'decimal',
            precision: 6,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'pace',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'elevationGain',
            type: 'decimal',
            precision: 6,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'maxElevation',
            type: 'decimal',
            precision: 6,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'calories',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign keys for activity_log
    await queryRunner.createForeignKey(
      'activity_log',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'activity_log',
      new TableForeignKey({
        columnNames: ['activityId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'activity',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop activity_log table
    await queryRunner.dropTable('activity_log');

    // Drop activity table
    await queryRunner.dropTable('activity');

    // Remove columns from workout_session_set
    await queryRunner.dropColumn('workout_session_set', 'calories');
    await queryRunner.dropColumn('workout_session_set', 'duration');
    await queryRunner.dropColumn('workout_session_set', 'distance');

    await queryRunner.changeColumn(
      'workout_session_set',
      'reps',
      new TableColumn({
        name: 'reps',
        type: 'int',
        isNullable: false,
      }),
    );

    await queryRunner.changeColumn(
      'workout_session_set',
      'weight',
      new TableColumn({
        name: 'weight',
        type: 'int',
        isNullable: false,
      }),
    );

    // Remove distance from workout_exercise
    await queryRunner.dropColumn('workout_exercise', 'distance');

    // Remove columns from exercise
    await queryRunner.dropColumn('exercise', 'defaultDistance');
    await queryRunner.dropColumn('exercise', 'trackingMode');
  }
}
