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

export class GlobalExercisesAndTranslations1775500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── EXERCISE TABLE ────────────────────────────────────────────────────────

    // Allow global exercises (no owner)
    await queryRunner.query(
      `ALTER TABLE "exercise" ALTER COLUMN "createdById" DROP NOT NULL`,
    );

    // Global flag — all existing exercises stay false (user-owned)
    await queryRunner.query(
      `ALTER TABLE "exercise" ADD COLUMN IF NOT EXISTS "isGlobal" boolean NOT NULL DEFAULT false`,
    );

    // Personalization tracking — set when user duplicates or inherits a deleted global
    await queryRunner.query(
      `ALTER TABLE "exercise" ADD COLUMN IF NOT EXISTS "personalizedFromGlobalId" integer NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise" ADD COLUMN IF NOT EXISTS "personalizedAt" timestamptz NULL`,
    );

    // title: JSONB translation object — migrated from existing name string
    await queryRunner.query(
      `ALTER TABLE "exercise" ADD COLUMN IF NOT EXISTS "title" jsonb`,
    );
    await queryRunner.query(
      `UPDATE "exercise" SET "title" = jsonb_build_object('default', "name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise" ALTER COLUMN "title" SET NOT NULL`,
    );

    // descriptionI18n: JSONB — migrated from existing description string
    await queryRunner.query(
      `ALTER TABLE "exercise" ADD COLUMN IF NOT EXISTS "descriptionI18n" jsonb`,
    );
    await queryRunner.query(
      `UPDATE "exercise" SET "descriptionI18n" = jsonb_build_object('default', "description")
       WHERE "description" IS NOT NULL AND "description" != ''`,
    );

    // instructionsI18n: JSONB — migrated from existing jsonb array
    await queryRunner.query(
      `ALTER TABLE "exercise" ADD COLUMN IF NOT EXISTS "instructionsI18n" jsonb`,
    );
    await queryRunner.query(
      `UPDATE "exercise" SET "instructionsI18n" = jsonb_build_object('default', "instructions")
       WHERE "instructions" IS NOT NULL`,
    );

    // proTipsI18n: JSONB — migrated from existing jsonb array
    await queryRunner.query(
      `ALTER TABLE "exercise" ADD COLUMN IF NOT EXISTS "proTipsI18n" jsonb`,
    );
    await queryRunner.query(
      `UPDATE "exercise" SET "proTipsI18n" = jsonb_build_object('default', "proTips")
       WHERE "proTips" IS NOT NULL`,
    );

    // mistakesI18n: JSONB — migrated from existing jsonb array
    await queryRunner.query(
      `ALTER TABLE "exercise" ADD COLUMN IF NOT EXISTS "mistakesI18n" jsonb`,
    );
    await queryRunner.query(
      `UPDATE "exercise" SET "mistakesI18n" = jsonb_build_object('default', "mistakes")
       WHERE "mistakes" IS NOT NULL`,
    );

    // ── ACTIVITY TABLE ────────────────────────────────────────────────────────

    // Drop the composite unique constraint (name, createdById) — replaced by partial indexes below
    await queryRunner.query(`
      DO $$
      DECLARE
        cname text;
      BEGIN
        SELECT c.conname INTO cname
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        WHERE t.relname = 'activity'
          AND c.contype = 'u'
          AND EXISTS (
            SELECT 1 FROM pg_attribute a
            WHERE a.attrelid = t.oid AND a.attname = 'name' AND a.attnum = ANY(c.conkey)
          )
          AND EXISTS (
            SELECT 1 FROM pg_attribute a
            WHERE a.attrelid = t.oid AND a.attname = 'createdById' AND a.attnum = ANY(c.conkey)
          );
        IF cname IS NOT NULL THEN
          EXECUTE 'ALTER TABLE activity DROP CONSTRAINT "' || cname || '"';
        END IF;
      END $$;
    `);

    // Allow global activities (no owner)
    await queryRunner.query(
      `ALTER TABLE "activity" ALTER COLUMN "createdById" DROP NOT NULL`,
    );

    // Global flag + personalization tracking
    await queryRunner.query(
      `ALTER TABLE "activity" ADD COLUMN IF NOT EXISTS "isGlobal" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity" ADD COLUMN IF NOT EXISTS "personalizedFromGlobalId" integer NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity" ADD COLUMN IF NOT EXISTS "personalizedAt" timestamptz NULL`,
    );

    // title: JSONB — migrated from existing name string
    await queryRunner.query(
      `ALTER TABLE "activity" ADD COLUMN IF NOT EXISTS "title" jsonb`,
    );
    await queryRunner.query(
      `UPDATE "activity" SET "title" = jsonb_build_object('default', "name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity" ALTER COLUMN "title" SET NOT NULL`,
    );

    // descriptionI18n: JSONB — migrated from existing description string
    await queryRunner.query(
      `ALTER TABLE "activity" ADD COLUMN IF NOT EXISTS "descriptionI18n" jsonb`,
    );
    await queryRunner.query(
      `UPDATE "activity" SET "descriptionI18n" = jsonb_build_object('default', "description")
       WHERE "description" IS NOT NULL AND "description" != ''`,
    );

    // Partial unique indexes replacing the old composite constraint
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_activity_name_user"
        ON "activity" ("name", "createdById")
        WHERE "createdById" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_activity_name_global"
        ON "activity" ("name")
        WHERE "createdById" IS NULL
    `);

    // ── USER TABLE ────────────────────────────────────────────────────────────

    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "language" varchar(10) NOT NULL DEFAULT 'default'`,
    );

    // ── MUSCLE_GROUP TABLE ────────────────────────────────────────────────────

    // nameI18n: JSONB display name — migrated from existing name string (name stays as internal key)
    await queryRunner.query(
      `ALTER TABLE "muscle_group" ADD COLUMN IF NOT EXISTS "nameI18n" jsonb`,
    );
    await queryRunner.query(
      `UPDATE "muscle_group" SET "nameI18n" = jsonb_build_object('default', "name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "muscle_group" ALTER COLUMN "nameI18n" SET NOT NULL`,
    );

    // descriptionI18n: JSONB — migrated from existing description string
    await queryRunner.query(
      `ALTER TABLE "muscle_group" ADD COLUMN IF NOT EXISTS "descriptionI18n" jsonb`,
    );
    await queryRunner.query(
      `UPDATE "muscle_group" SET "descriptionI18n" = jsonb_build_object('default', "description")
       WHERE "description" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ── MUSCLE_GROUP ──────────────────────────────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "muscle_group" DROP COLUMN IF EXISTS "descriptionI18n"`,
    );
    await queryRunner.query(
      `ALTER TABLE "muscle_group" DROP COLUMN IF EXISTS "nameI18n"`,
    );

    // ── USER ──────────────────────────────────────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN IF EXISTS "language"`,
    );

    // ── ACTIVITY ──────────────────────────────────────────────────────────────
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_activity_name_global"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_activity_name_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity" DROP COLUMN IF EXISTS "descriptionI18n"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity" DROP COLUMN IF EXISTS "title"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity" DROP COLUMN IF EXISTS "personalizedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity" DROP COLUMN IF EXISTS "personalizedFromGlobalId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity" DROP COLUMN IF EXISTS "isGlobal"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity" ALTER COLUMN "createdById" SET NOT NULL`,
    );
    // Restore original unique constraint
    await queryRunner.query(
      `ALTER TABLE "activity" ADD CONSTRAINT "UQ_activity_name_createdBy"
       UNIQUE ("name", "createdById")`,
    );

    // ── EXERCISE ──────────────────────────────────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "exercise" DROP COLUMN IF EXISTS "mistakesI18n"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise" DROP COLUMN IF EXISTS "proTipsI18n"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise" DROP COLUMN IF EXISTS "instructionsI18n"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise" DROP COLUMN IF EXISTS "descriptionI18n"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise" DROP COLUMN IF EXISTS "title"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise" DROP COLUMN IF EXISTS "personalizedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise" DROP COLUMN IF EXISTS "personalizedFromGlobalId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise" DROP COLUMN IF EXISTS "isGlobal"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise" ALTER COLUMN "createdById" SET NOT NULL`,
    );
  }
}
