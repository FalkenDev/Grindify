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

import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddStreakToUser1768754686000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add weeklyWorkoutGoal column
    await queryRunner.addColumn(
      'user',
      new TableColumn({
        name: 'weeklyWorkoutGoal',
        type: 'int',
        default: 3,
      }),
    );

    // Add currentStreak column
    await queryRunner.addColumn(
      'user',
      new TableColumn({
        name: 'currentStreak',
        type: 'int',
        default: 0,
      }),
    );

    // Add lastStreakCheckDate column
    await queryRunner.addColumn(
      'user',
      new TableColumn({
        name: 'lastStreakCheckDate',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    // Add currentWeekWorkouts column
    await queryRunner.addColumn(
      'user',
      new TableColumn({
        name: 'currentWeekWorkouts',
        type: 'int',
        default: 0,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('user', 'currentWeekWorkouts');
    await queryRunner.dropColumn('user', 'lastStreakCheckDate');
    await queryRunner.dropColumn('user', 'currentStreak');
    await queryRunner.dropColumn('user', 'weeklyWorkoutGoal');
  }
}
