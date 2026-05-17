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

import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveCardioFromExercises1768837747655
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove trackingMode and defaultDistance from exercise table (if they exist)
    await queryRunner.query(`ALTER TABLE "exercise" DROP COLUMN IF EXISTS "defaultDistance"`);
    await queryRunner.query(`ALTER TABLE "exercise" DROP COLUMN IF EXISTS "trackingMode"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add back trackingMode and defaultDistance to exercise table
    await queryRunner.query(`
      ALTER TABLE "exercise" 
      ADD "trackingMode" character varying NOT NULL DEFAULT 'strength'
    `);
    
    await queryRunner.query(`
      ALTER TABLE "exercise" 
      ADD "defaultDistance" numeric(6,2)
    `);

  }
}
