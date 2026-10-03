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

const newValues = [
  'weight-lifter',
  'golf',
  'rugby',
  'hockey-sticks',
  'dance-ballroom',
];

export class AddNewActivityIcons1774400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "activity" ALTER COLUMN "icon" DROP DEFAULT, ALTER COLUMN "icon" TYPE TEXT`,
    );

    await queryRunner.query(`DROP TYPE IF EXISTS "activity_icon_enum"`);

    await queryRunner.query(
      `CREATE TYPE "activity_icon_enum" AS ENUM (` +
        `'run', 'walk', 'bike', 'soccer', 'swim', 'kayaking', 'hiking', ` +
        `'yoga', 'boxing-glove', 'tennis', 'basketball', 'volleyball', ` +
        `'ski', 'skate', 'rowing', ` +
        `'weight-lifter', 'golf', 'rugby', 'hockey-sticks', 'dance-ballroom', ` +
        `'dots-horizontal')`,
    );

    await queryRunner.query(
      `ALTER TABLE "activity" ALTER COLUMN "icon" TYPE "activity_icon_enum" USING "icon"::"activity_icon_enum"`,
    );

    await queryRunner.query(
      `ALTER TABLE "activity" ALTER COLUMN "icon" SET DEFAULT 'dots-horizontal'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reassign any rows using new icons to 'dots-horizontal' before removing them
    for (const value of newValues) {
      await queryRunner.query(
        `UPDATE "activity" SET "icon" = 'dots-horizontal' WHERE "icon" = $1`,
        [value],
      );
    }

    await queryRunner.query(
      `ALTER TABLE "activity" ALTER COLUMN "icon" DROP DEFAULT, ALTER COLUMN "icon" TYPE TEXT`,
    );

    await queryRunner.query(`DROP TYPE IF EXISTS "activity_icon_enum"`);

    await queryRunner.query(
      `CREATE TYPE "activity_icon_enum" AS ENUM (` +
        `'run', 'walk', 'bike', 'soccer', 'swim', 'kayaking', 'hiking', ` +
        `'yoga', 'boxing-glove', 'tennis', 'basketball', 'volleyball', ` +
        `'ski', 'skate', 'rowing', 'dots-horizontal')`,
    );

    await queryRunner.query(
      `ALTER TABLE "activity" ALTER COLUMN "icon" TYPE "activity_icon_enum" USING "icon"::"activity_icon_enum"`,
    );

    await queryRunner.query(
      `ALTER TABLE "activity" ALTER COLUMN "icon" SET DEFAULT 'dots-horizontal'`,
    );
  }
}
