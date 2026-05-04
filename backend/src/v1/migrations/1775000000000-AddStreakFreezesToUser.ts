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

export class AddStreakFreezesToUser1775000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add streakFreezes column — users start with 1 freeze
    await queryRunner.addColumn(
      'user',
      new TableColumn({
        name: 'streakFreezes',
        type: 'int',
        default: 1,
      }),
    );

    // Add streakFreezeUsedWeek column — ISO week key e.g. "2026-W18"
    await queryRunner.addColumn(
      'user',
      new TableColumn({
        name: 'streakFreezeUsedWeek',
        type: 'varchar',
        length: '10',
        isNullable: true,
      }),
    );

    // Add completedGoalWeeksCount — tracks how many goal-weeks have been completed
    await queryRunner.addColumn(
      'user',
      new TableColumn({
        name: 'completedGoalWeeksCount',
        type: 'int',
        default: 0,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('user', 'completedGoalWeeksCount');
    await queryRunner.dropColumn('user', 'streakFreezeUsedWeek');
    await queryRunner.dropColumn('user', 'streakFreezes');
  }
}
