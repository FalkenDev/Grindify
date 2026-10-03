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

export class CreateAuditLog1777000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_log" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "actorId" integer NULL,
        "actorEmail" character varying(255) NULL,
        "action" character varying(64) NOT NULL,
        "targetType" character varying(64) NULL,
        "targetId" character varying(64) NULL,
        "ip" character varying(64) NULL,
        "userAgent" character varying(512) NULL,
        "metadata" jsonb NULL,
        CONSTRAINT "PK_audit_log_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_audit_log_createdAt" ON "audit_log" ("createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_audit_log_actorId" ON "audit_log" ("actorId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_audit_log_action" ON "audit_log" ("action")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_log_action"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_log_actorId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_log_createdAt"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_log"`);
  }
}
