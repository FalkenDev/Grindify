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
 * Security hardening for the user table:
 * - tokenVersion: bumped on logout / password change / reset to revoke JWTs
 * - healthDataConsentAt: explicit GDPR art. 9 consent for health data
 * - *Attempts: wrong-code counters for email verification / password reset
 */
export class AddSecurityColumnsToUser1777000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "tokenVersion" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "healthDataConsentAt" TIMESTAMP NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "emailVerificationAttempts" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "passwordResetAttempts" integer NOT NULL DEFAULT 0`,
    );
    // Existing unsalted SHA-256 codes can no longer be verified (codes are now
    // HMAC'd with JWT_SECRET) — invalidate any outstanding codes.
    await queryRunner.query(
      `UPDATE "user" SET "passwordResetToken" = NULL, "passwordResetExpires" = NULL WHERE "passwordResetToken" IS NOT NULL`,
    );
    await queryRunner.query(
      `UPDATE "user" SET "emailVerificationToken" = NULL, "emailVerificationExpires" = NULL WHERE "emailVerificationToken" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN IF EXISTS "passwordResetAttempts"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN IF EXISTS "emailVerificationAttempts"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN IF EXISTS "healthDataConsentAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN IF EXISTS "tokenVersion"`,
    );
  }
}
