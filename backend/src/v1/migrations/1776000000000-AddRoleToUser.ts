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

export class AddRoleToUser1776000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('user');
    if (!table?.findColumnByName('role')) {
      await queryRunner.addColumn(
        'user',
        new TableColumn({
          name: 'role',
          type: 'varchar',
          length: '20',
          default: "'user'",
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('user', 'role');
  }
}
