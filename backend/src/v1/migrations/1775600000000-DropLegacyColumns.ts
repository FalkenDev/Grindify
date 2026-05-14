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

/**
 * Phase 11 cleanup: drops legacy string columns that were superseded by JSONB
 * i18n columns in 1775500000000-GlobalExercisesAndTranslations.
 *
 * Safe to run once the new JSONB columns have been in production and confirmed
 * stable. The down() migration cannot recover the string data once dropped, so
 * run a DB backup before applying.
 */
export class DropLegacyColumns1775600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── EXERCISE TABLE ────────────────────────────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "exercise" DROP COLUMN IF EXISTS "name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise" DROP COLUMN IF EXISTS "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise" DROP COLUMN IF EXISTS "instructions"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise" DROP COLUMN IF EXISTS "proTips"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise" DROP COLUMN IF EXISTS "mistakes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise" DROP COLUMN IF EXISTS "i18nKey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise" DROP COLUMN IF EXISTS "isNameCustom"`,
    );

    // ── ACTIVITY TABLE ────────────────────────────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "activity" DROP COLUMN IF EXISTS "name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity" DROP COLUMN IF EXISTS "description"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore exercise legacy columns (data is lost — columns will be empty)
    await queryRunner.query(
      `ALTER TABLE "exercise" ADD COLUMN IF NOT EXISTS "name" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise" ADD COLUMN IF NOT EXISTS "description" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise" ADD COLUMN IF NOT EXISTS "instructions" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise" ADD COLUMN IF NOT EXISTS "proTips" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise" ADD COLUMN IF NOT EXISTS "mistakes" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise" ADD COLUMN IF NOT EXISTS "i18nKey" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise" ADD COLUMN IF NOT EXISTS "isNameCustom" boolean NOT NULL DEFAULT false`,
    );

    // Restore activity legacy columns (data is lost)
    await queryRunner.query(
      `ALTER TABLE "activity" ADD COLUMN IF NOT EXISTS "name" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity" ADD COLUMN IF NOT EXISTS "description" text`,
    );
  }
}
