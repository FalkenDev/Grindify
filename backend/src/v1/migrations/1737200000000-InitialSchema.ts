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
 * Baseline schema.
 *
 * Before migrations were introduced the schema was created by TypeORM
 * `synchronize`, so the first real migration (1737300000000) assumes the
 * base tables already exist. This migration recreates that base schema on an
 * empty database so a fresh install can run every migration in order.
 *
 * DDL generated with TypeORM's schema builder from the entities at the parent
 * of commit ebfb76b (the commit that added 1737300000000), using the same
 * entity set the app loaded then (autoLoadEntities / forFeature; the unused
 * legacy src/v1/workout/exercise.entity.ts was not part of it).
 * The user streak columns are intentionally omitted: they are added by
 * 1768754686000-AddStreakToUser.
 *
 * Existing databases (schema already created by synchronize) are left
 * untouched: if the base tables exist this migration is a no-op.
 */
export class InitialSchema1737200000000 implements MigrationInterface {
  name = 'InitialSchema1737200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ exists }] = await queryRunner.query(
      `SELECT (to_regclass('public."user"') IS NOT NULL OR to_regclass('public."exercise"') IS NOT NULL) AS "exists"`,
    );
    if (exists) {
      // Schema was created by synchronize before migrations existed — nothing to do.
      return;
    }

    await queryRunner.query(
      `CREATE TABLE "muscle_group" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e691d7f6d6ed57b622ac43737c7" UNIQUE ("name"), CONSTRAINT "PK_be821e8e246d694ce78e4bd61f9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "global_exercise" ("id" SERIAL NOT NULL, "i18nKey" character varying NOT NULL, "defaultName" character varying NOT NULL, "defaultDescription" character varying, "image" character varying, "defaultSets" integer, "defaultReps" integer, "defaultPauseSeconds" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7cefea60fc34542d6242265fdd7" UNIQUE ("i18nKey"), CONSTRAINT "PK_b752cec0dfb7ce02c10adf00b55" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "exercise" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "i18nKey" character varying, "isNameCustom" boolean NOT NULL DEFAULT false, "isCustomized" boolean NOT NULL DEFAULT false, "description" character varying, "image" character varying, "defaultSets" integer NOT NULL, "defaultReps" integer NOT NULL, "defaultPauseSeconds" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "createdById" integer, "globalExerciseId" integer, CONSTRAINT "PK_a0f107e3a2ef2742c1e91d97c14" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "workout_exercise" ("id" SERIAL NOT NULL, "order" integer NOT NULL, "sets" integer NOT NULL, "reps" integer NOT NULL, "weight" integer NOT NULL, "pauseSeconds" integer NOT NULL, "workoutId" integer, "exerciseId" integer, CONSTRAINT "PK_9598996a913c5f5114f9e6403b6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workout_defaultweightandreps_enum" AS ENUM('default', 'latest', 'exercise')`,
    );
    await queryRunner.query(
      `CREATE TABLE "workout" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" character varying, "time" integer NOT NULL, "defaultWeightAndReps" "public"."workout_defaultweightandreps_enum" NOT NULL DEFAULT 'default', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdById" integer, CONSTRAINT "PK_ea37ec052825688082b19f0d939" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "firstName" character varying(50), "lastName" character varying(50), "avatar" character varying, "showRpe" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "workout_session_set" ("id" SERIAL NOT NULL, "setNumber" integer NOT NULL, "weight" integer NOT NULL, "reps" integer NOT NULL, "rpe" integer, "notes" character varying, "sessionExerciseId" integer, CONSTRAINT "PK_68417d9f09acc60b7ea663e93f9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "workout_session_exercise" ("id" SERIAL NOT NULL, "exerciseSnapshot" jsonb, "notes" character varying, "sessionId" integer, "exerciseId" integer, CONSTRAINT "PK_b1ee0132818df1bdd505bfc1fe8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workout_session_status_enum" AS ENUM('in_progress', 'finished', 'abandoned')`,
    );
    await queryRunner.query(
      `CREATE TABLE "workout_session" ("id" SERIAL NOT NULL, "workoutSnapshot" jsonb, "startedAt" TIMESTAMP NOT NULL DEFAULT now(), "status" "public"."workout_session_status_enum" NOT NULL DEFAULT 'in_progress', "endedAt" TIMESTAMP, "totalWeight" integer NOT NULL DEFAULT '0', "exerciseStats" jsonb, "notes" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, "workoutId" integer, CONSTRAINT "PK_9afb74a335d8e9fd266763779af" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "global_exercise_muscle_groups_muscle_group" ("globalExerciseId" integer NOT NULL, "muscleGroupId" integer NOT NULL, CONSTRAINT "PK_207f1c4606ce63f97c0191f4e3b" PRIMARY KEY ("globalExerciseId", "muscleGroupId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_30f3509a7ef5b5ceca43ea4042" ON "global_exercise_muscle_groups_muscle_group" ("globalExerciseId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_41ad6cdd4e02cbdacd28edbad4" ON "global_exercise_muscle_groups_muscle_group" ("muscleGroupId")`,
    );
    await queryRunner.query(
      `CREATE TABLE "exercise_muscle_groups_muscle_group" ("exerciseId" integer NOT NULL, "muscleGroupId" integer NOT NULL, CONSTRAINT "PK_e6b1f52ff1727e4c7bcee32e4c1" PRIMARY KEY ("exerciseId", "muscleGroupId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4113f3d737c4990a04c585f755" ON "exercise_muscle_groups_muscle_group" ("exerciseId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8ca9efa5b98ada9b5843b757b1" ON "exercise_muscle_groups_muscle_group" ("muscleGroupId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise" ADD CONSTRAINT "FK_6a3fcb35ca9190cea7a0cebc177" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise" ADD CONSTRAINT "FK_ba19df35dfccaf0a1a45c0de9ca" FOREIGN KEY ("globalExerciseId") REFERENCES "global_exercise"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_exercise" ADD CONSTRAINT "FK_35fe273716366d768fba9964813" FOREIGN KEY ("workoutId") REFERENCES "workout"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_exercise" ADD CONSTRAINT "FK_a2ac7d92eeb9bd5fc2bb9896611" FOREIGN KEY ("exerciseId") REFERENCES "exercise"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout" ADD CONSTRAINT "FK_4ec7e933db934c73f0920ebddb2" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_session_set" ADD CONSTRAINT "FK_7fb372a21106f6687d3e01965bd" FOREIGN KEY ("sessionExerciseId") REFERENCES "workout_session_exercise"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_session_exercise" ADD CONSTRAINT "FK_ca709bb623c02e4a0403a26b6cf" FOREIGN KEY ("sessionId") REFERENCES "workout_session"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_session_exercise" ADD CONSTRAINT "FK_fb6b5555a0994fa111f8ea4797d" FOREIGN KEY ("exerciseId") REFERENCES "exercise"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_session" ADD CONSTRAINT "FK_bf8e14b67cc83a8ae13fa3b1e49" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_session" ADD CONSTRAINT "FK_4233e722a30320ee5747a1f9fc5" FOREIGN KEY ("workoutId") REFERENCES "workout"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "global_exercise_muscle_groups_muscle_group" ADD CONSTRAINT "FK_30f3509a7ef5b5ceca43ea40426" FOREIGN KEY ("globalExerciseId") REFERENCES "global_exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "global_exercise_muscle_groups_muscle_group" ADD CONSTRAINT "FK_41ad6cdd4e02cbdacd28edbad46" FOREIGN KEY ("muscleGroupId") REFERENCES "muscle_group"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise_muscle_groups_muscle_group" ADD CONSTRAINT "FK_4113f3d737c4990a04c585f755a" FOREIGN KEY ("exerciseId") REFERENCES "exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise_muscle_groups_muscle_group" ADD CONSTRAINT "FK_8ca9efa5b98ada9b5843b757b1c" FOREIGN KEY ("muscleGroupId") REFERENCES "muscle_group"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Columns that were added later by `synchronize` (never by a migration)
    // but that later migrations read or rename. They must exist before those
    // migrations run on a fresh database:
    //   exercise.equipment                 -> renamed by 1769000000000-MigrateEquipmentToI18n
    //   exercise.instructions/proTips/...  -> read by 1775500000000-GlobalExercisesAndTranslations
    //   user.emailVerification*/passwordReset* -> updated by 1777000000000-AddSecurityColumnsToUser
    await queryRunner.query(
      `ALTER TABLE "exercise" ADD "equipment" jsonb, ADD "instructions" jsonb, ADD "proTips" jsonb, ADD "mistakes" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "emailVerificationToken" character varying, ADD "emailVerificationExpires" TIMESTAMP, ADD "passwordResetToken" character varying, ADD "passwordResetExpires" TIMESTAMP`,
    );
  }

  // Intentionally a no-op: on existing databases up() created nothing, so
  // reverting this far must never drop the production tables.
  public async down(): Promise<void> {}
}
