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
 * Fresh-install catch-up for schema that was only ever created by TypeORM
 * `synchronize` (before migrations were introduced) and never by a migration:
 * scheduled_session, exercise_record, weight_log, progress_photo,
 * exercise_media, workout_target_muscle_groups,
 * exercise_primary_muscle_groups_muscle_group, several user/exercise/workout/
 * activity columns, and FK/nullability tweaks. It also removes leftovers from
 * the 1737200000000 baseline that the entities no longer have
 * (global_exercise*, exercise.globalExerciseId/isCustomized,
 * muscle_group.description, *Snapshot columns).
 *
 * DDL = TypeORM schema-builder diff between (baseline + all migrations) and
 * the current entities, so a fresh database ends up matching the entities.
 *
 * Existing databases (production) already have all of this from
 * `synchronize`, so the migration is a no-op when scheduled_session exists.
 */
export class CatchUpSynchronizeDrift1777000002000
  implements MigrationInterface
{
  name = 'CatchUpSynchronizeDrift1777000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ exists }] = await queryRunner.query(
      `SELECT to_regclass('public."scheduled_session"') IS NOT NULL AS "exists"`,
    );
    if (exists) {
      // Schema was created by synchronize — nothing to do.
      return;
    }

    await queryRunner.query(
      `ALTER TABLE "workout_exercise" DROP CONSTRAINT "FK_a2ac7d92eeb9bd5fc2bb9896611"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise" DROP CONSTRAINT "FK_ba19df35dfccaf0a1a45c0de9ca"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_log" DROP CONSTRAINT "FK_557203b3713859f55bb58f67228"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_session_exercise" DROP CONSTRAINT "FK_fb6b5555a0994fa111f8ea4797d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_session" DROP COLUMN "workoutSnapshot"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_session_exercise" DROP COLUMN "exerciseSnapshot"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."exercise_media_type_enum" AS ENUM('image', 'video')`,
    );
    await queryRunner.query(
      `CREATE TABLE "exercise_media" ("id" SERIAL NOT NULL, "type" "public"."exercise_media_type_enum" NOT NULL, "url" character varying NOT NULL, "order" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "exerciseId" integer, CONSTRAINT "PK_aef01b0816e026d9ab6321b50ad" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "weight_log" ("id" SERIAL NOT NULL, "date" date NOT NULL, "weight" numeric(5,2) NOT NULL, "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_b6375723a4ed22036d81402d7ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."scheduled_session_type_enum" AS ENUM('workout', 'activity')`,
    );
    await queryRunner.query(
      `CREATE TABLE "scheduled_session" ("id" SERIAL NOT NULL, "type" "public"."scheduled_session_type_enum" NOT NULL, "scheduledDate" date, "dayOfWeek" integer, "isRecurring" boolean NOT NULL DEFAULT false, "exceptionDates" jsonb NOT NULL DEFAULT '[]', "notes" text, "recurringStartDate" date, "recurringEndDate" date, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, "workoutId" integer, "activityId" integer, CONSTRAINT "PK_c1f168796dc2e6ec4f5d389eb0c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "progress_photo" ("id" SERIAL NOT NULL, "photoUrl" character varying NOT NULL, "date" date NOT NULL, "poseTag" character varying(20), "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_819c909af77b2a1c86462d7e445" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."exercise_record_recordtype_enum" AS ENUM('max_weight', 'max_volume_set', 'max_volume_session', 'max_reps', 'estimated_1rm')`,
    );
    await queryRunner.query(
      `CREATE TABLE "exercise_record" ("id" SERIAL NOT NULL, "recordType" "public"."exercise_record_recordtype_enum" NOT NULL, "value" numeric(10,2) NOT NULL, "achievedAt" TIMESTAMP NOT NULL, "setDetails" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, "exerciseId" integer, "workoutSessionId" integer, CONSTRAINT "UQ_e660fbc7bf8b51d360634b4a566" UNIQUE ("userId", "exerciseId", "recordType"), CONSTRAINT "PK_0349ac516a00728305a63c538e6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "workout_target_muscle_groups" ("workoutId" integer NOT NULL, "muscleGroupId" integer NOT NULL, CONSTRAINT "PK_83b522a5220eca3b2d0bd04e0a0" PRIMARY KEY ("workoutId", "muscleGroupId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_88ec851c402b0c7c7c875d05bb" ON "workout_target_muscle_groups" ("workoutId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2bdee2933e0d93c03131da0fb4" ON "workout_target_muscle_groups" ("muscleGroupId")`,
    );
    await queryRunner.query(
      `CREATE TABLE "exercise_primary_muscle_groups_muscle_group" ("exerciseId" integer NOT NULL, "muscleGroupId" integer NOT NULL, CONSTRAINT "PK_1d184dbc753459d7d6227a509ff" PRIMARY KEY ("exerciseId", "muscleGroupId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_261a625bd4a516ec97bb36e866" ON "exercise_primary_muscle_groups_muscle_group" ("exerciseId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_59a7d8d9d5ccd82ec1c90f2c4a" ON "exercise_primary_muscle_groups_muscle_group" ("muscleGroupId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "muscle_group" DROP COLUMN "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise" DROP COLUMN "isCustomized"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise" DROP COLUMN "globalExerciseId"`,
    );
    await queryRunner.query(
      `DROP TABLE "global_exercise_muscle_groups_muscle_group"`,
    );
    await queryRunner.query(`DROP TABLE "global_exercise"`);
    await queryRunner.query(
      `ALTER TABLE "workout_exercise" ADD "setWeights" jsonb`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workout_type_enum" AS ENUM('strength', 'cardio', 'hiit', 'flexibility', 'endurance')`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout" ADD "type" "public"."workout_type_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "workout" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "githubId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_0d84cc6a830f0e4ebbfcd6381dd" UNIQUE ("githubId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "unitScale" character varying(20)`,
    );
    await queryRunner.query(`ALTER TABLE "user" ADD "weight" numeric(5,2)`);
    await queryRunner.query(`ALTER TABLE "user" ADD "height" numeric(5,2)`);
    await queryRunner.query(`ALTER TABLE "user" ADD "dateOfBirth" date`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "gender" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "primaryGoal" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "targetWeight" numeric(5,2)`,
    );
    await queryRunner.query(`ALTER TABLE "user" ADD "goalTimeframe" integer`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "showWeightTracking" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "weightGoalType" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "startWeight" numeric(5,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "onboardingCompleted" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "emailVerified" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."exercise_exercisetype_enum" AS ENUM('compound', 'isolation', 'bodyweight')`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise" ADD "exerciseType" "public"."exercise_exercisetype_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "exercise" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "activity" ADD "equipment" text`);
    await queryRunner.query(`ALTER TABLE "activity" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "activity_log" ADD "scheduledSessionId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_exercise" ALTER COLUMN "weight" SET DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."workout_defaultweightandreps_enum" RENAME TO "workout_defaultweightandreps_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workout_defaultweightandreps_enum" AS ENUM('default', 'latest')`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout" ALTER COLUMN "defaultWeightAndReps" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout" ALTER COLUMN "defaultWeightAndReps" TYPE "public"."workout_defaultweightandreps_enum" USING "defaultWeightAndReps"::"text"::"public"."workout_defaultweightandreps_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout" ALTER COLUMN "defaultWeightAndReps" SET DEFAULT 'default'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."workout_defaultweightandreps_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "password" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity" ALTER COLUMN "createdAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity" ALTER COLUMN "updatedAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_log" DROP CONSTRAINT "FK_d19abacc8a508c0429478ad166b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_log" ALTER COLUMN "createdAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_log" ALTER COLUMN "userId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_log" ALTER COLUMN "activityId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_session" ADD "scheduledSessionId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_session_exercise" ADD "order" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise_image" ALTER COLUMN "createdAt" TYPE TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_exercise" ADD CONSTRAINT "FK_a2ac7d92eeb9bd5fc2bb9896611" FOREIGN KEY ("exerciseId") REFERENCES "exercise"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise_media" ADD CONSTRAINT "FK_44e50eb4f00c7cde3c28d1cf28c" FOREIGN KEY ("exerciseId") REFERENCES "exercise"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "weight_log" ADD CONSTRAINT "FK_609e041bb9e48c6789785f700b4" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scheduled_session" ADD CONSTRAINT "FK_50965730fb5e9f7c9e14e1bc131" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scheduled_session" ADD CONSTRAINT "FK_ff6b7e6455c26c346ba66e98276" FOREIGN KEY ("workoutId") REFERENCES "workout"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scheduled_session" ADD CONSTRAINT "FK_3fced9ac8dca514ec9d33c5ff02" FOREIGN KEY ("activityId") REFERENCES "activity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_log" ADD CONSTRAINT "FK_d19abacc8a508c0429478ad166b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_log" ADD CONSTRAINT "FK_557203b3713859f55bb58f67228" FOREIGN KEY ("activityId") REFERENCES "activity"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_log" ADD CONSTRAINT "FK_36d17f67a4d3951c310ff31d063" FOREIGN KEY ("scheduledSessionId") REFERENCES "scheduled_session"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_session" ADD CONSTRAINT "FK_6125f0ab42361a6cc29e5d95374" FOREIGN KEY ("scheduledSessionId") REFERENCES "scheduled_session"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_session_exercise" ADD CONSTRAINT "FK_fb6b5555a0994fa111f8ea4797d" FOREIGN KEY ("exerciseId") REFERENCES "exercise"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "progress_photo" ADD CONSTRAINT "FK_4c8d8215b95c97a64a741d6094f" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise_record" ADD CONSTRAINT "FK_5ce9c6578880f22480bcde1fa89" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise_record" ADD CONSTRAINT "FK_b5685c90110c2991a66c26c0216" FOREIGN KEY ("exerciseId") REFERENCES "exercise"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise_record" ADD CONSTRAINT "FK_943b0bc48933e7dcac899668e1d" FOREIGN KEY ("workoutSessionId") REFERENCES "workout_session"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_target_muscle_groups" ADD CONSTRAINT "FK_88ec851c402b0c7c7c875d05bb7" FOREIGN KEY ("workoutId") REFERENCES "workout"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_target_muscle_groups" ADD CONSTRAINT "FK_2bdee2933e0d93c03131da0fb4d" FOREIGN KEY ("muscleGroupId") REFERENCES "muscle_group"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise_primary_muscle_groups_muscle_group" ADD CONSTRAINT "FK_261a625bd4a516ec97bb36e8668" FOREIGN KEY ("exerciseId") REFERENCES "exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise_primary_muscle_groups_muscle_group" ADD CONSTRAINT "FK_59a7d8d9d5ccd82ec1c90f2c4a5" FOREIGN KEY ("muscleGroupId") REFERENCES "muscle_group"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(): Promise<void> {
    // Intentionally a no-op: on existing databases up() did nothing, so a
    // revert must not drop tables that synchronize created there.
  }
}
