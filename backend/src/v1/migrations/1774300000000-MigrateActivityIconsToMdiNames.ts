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

const iconMapping: [string, string][] = [
  ['running', 'run'],
  ['walking', 'walk'],
  ['cycling', 'bike'],
  ['football', 'soccer'],
  ['swimming', 'swim'],
  ['boxing', 'boxing-glove'],
  ['skiing', 'ski'],
  ['skating', 'skate'],
  ['other', 'dots-horizontal'],
];

export class MigrateActivityIconsToMdiNames1774300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Change column to text so we can update values freely
    await queryRunner.query(
      `ALTER TABLE "activity" ALTER COLUMN "icon" DROP DEFAULT, ALTER COLUMN "icon" TYPE TEXT`,
    );

    // Drop old enum type
    await queryRunner.query(`DROP TYPE IF EXISTS "activity_icon_enum"`);

    // Rename old icon values to correct MDI icon names
    for (const [oldValue, newValue] of iconMapping) {
      await queryRunner.query(
        `UPDATE "activity" SET "icon" = $1 WHERE "icon" = $2`,
        [newValue, oldValue],
      );
    }

    // Create new enum type with MDI icon names
    await queryRunner.query(
      `CREATE TYPE "activity_icon_enum" AS ENUM (` +
        `'run', 'walk', 'bike', 'soccer', 'swim', 'kayaking', 'hiking', ` +
        `'yoga', 'boxing-glove', 'tennis', 'basketball', 'volleyball', ` +
        `'ski', 'skate', 'rowing', 'dots-horizontal')`,
    );

    // Restore enum column
    await queryRunner.query(
      `ALTER TABLE "activity" ALTER COLUMN "icon" TYPE "activity_icon_enum" USING "icon"::"activity_icon_enum"`,
    );

    // Restore default
    await queryRunner.query(
      `ALTER TABLE "activity" ALTER COLUMN "icon" SET DEFAULT 'dots-horizontal'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Change column to text
    await queryRunner.query(
      `ALTER TABLE "activity" ALTER COLUMN "icon" DROP DEFAULT, ALTER COLUMN "icon" TYPE TEXT`,
    );

    // Drop new enum type
    await queryRunner.query(`DROP TYPE IF EXISTS "activity_icon_enum"`);

    // Revert MDI icon names back to old values
    for (const [oldValue, newValue] of iconMapping) {
      await queryRunner.query(
        `UPDATE "activity" SET "icon" = $1 WHERE "icon" = $2`,
        [oldValue, newValue],
      );
    }

    // Recreate old enum type
    await queryRunner.query(
      `CREATE TYPE "activity_icon_enum" AS ENUM (` +
        `'running', 'walking', 'cycling', 'football', 'swimming', 'kayaking', ` +
        `'hiking', 'yoga', 'boxing', 'tennis', 'basketball', 'volleyball', ` +
        `'skiing', 'skating', 'rowing', 'other')`,
    );

    // Restore enum column
    await queryRunner.query(
      `ALTER TABLE "activity" ALTER COLUMN "icon" TYPE "activity_icon_enum" USING "icon"::"activity_icon_enum"`,
    );

    // Restore default
    await queryRunner.query(
      `ALTER TABLE "activity" ALTER COLUMN "icon" SET DEFAULT 'other'`,
    );
  }
}
