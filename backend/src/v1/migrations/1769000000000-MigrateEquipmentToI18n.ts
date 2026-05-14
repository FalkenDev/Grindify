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

export class MigrateEquipmentToI18n1769000000000 implements MigrationInterface {
  name = 'MigrateEquipmentToI18n1769000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "exercise" RENAME COLUMN "equipment" TO "equipment_i18n"`,
    );
    // Convert existing string[] to { default: string[] }
    await queryRunner.query(`
      UPDATE "exercise"
      SET "equipment_i18n" = jsonb_build_object('default', "equipment_i18n")
      WHERE "equipment_i18n" IS NOT NULL
        AND "equipment_i18n"::text != 'null'
        AND jsonb_typeof("equipment_i18n") = 'array'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Convert { default: string[] } back to string[]
    await queryRunner.query(`
      UPDATE "exercise"
      SET "equipment_i18n" = "equipment_i18n"->'default'
      WHERE "equipment_i18n" IS NOT NULL
        AND jsonb_typeof("equipment_i18n") = 'object'
        AND "equipment_i18n" ? 'default'
    `);
    await queryRunner.query(
      `ALTER TABLE "exercise" RENAME COLUMN "equipment_i18n" TO "equipment"`,
    );
  }
}
