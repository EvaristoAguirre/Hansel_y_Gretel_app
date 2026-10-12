import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Foto de producto, mesa y caja al archivar, más las tablas de control
 * de cada corrida. Las columnas nuevas son nullable: las filas ya
 * archivadas quedan en null hasta un backfill posterior.
 * snapshotSource = 'archive' cuando el job toma la foto;
 * un backfill posterior debe escribir 'backfill' solo donde sigue null.
 */
export class AddArchiveSnapshotAndRunTables1783400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "archived_orders"
        ADD COLUMN IF NOT EXISTS "tableName" character varying,
        ADD COLUMN IF NOT EXISTS "roomName" character varying,
        ADD COLUMN IF NOT EXISTS "dailyCashDate" TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "snapshotSource" character varying(20)
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "archived_orders"."snapshotSource" IS
      'archive = foto al archivar; backfill = nombre rellenado después'
    `);

    await queryRunner.query(`
      ALTER TABLE "archived_order_details"
        ADD COLUMN IF NOT EXISTS "productName" character varying,
        ADD COLUMN IF NOT EXISTS "productCode" integer,
        ADD COLUMN IF NOT EXISTS "categoryNames" json,
        ADD COLUMN IF NOT EXISTS "commentOfProduct" character varying,
        ADD COLUMN IF NOT EXISTS "snapshotSource" character varying(20)
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "archived_order_details"."snapshotSource" IS
      'archive = foto al archivar; backfill = nombre rellenado después'
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "archive_runs" (
        "id" uuid NOT NULL,
        "startedAt" TIMESTAMP NOT NULL,
        "finishedAt" TIMESTAMP,
        "trigger" character varying(16) NOT NULL,
        "status" character varying(16) NOT NULL,
        "archivedCount" integer NOT NULL DEFAULT 0,
        "skippedCount" integer NOT NULL DEFAULT 0,
        "repairedCount" integer NOT NULL DEFAULT 0,
        "errorSummary" text,
        CONSTRAINT "PK_archive_runs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "archive_order_errors" (
        "id" uuid NOT NULL,
        "runId" uuid NOT NULL,
        "orderId" uuid NOT NULL,
        "attemptedAt" TIMESTAMP NOT NULL,
        "reason" character varying(32) NOT NULL,
        "pgCode" character varying(8),
        "message" text,
        CONSTRAINT "PK_archive_order_errors" PRIMARY KEY ("id"),
        CONSTRAINT "FK_archive_order_errors_run"
          FOREIGN KEY ("runId") REFERENCES "archive_runs"("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_archive_order_errors_runId"
        ON "archive_order_errors" ("runId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_archive_order_errors_orderId"
        ON "archive_order_errors" ("orderId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "archive_order_errors"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "archive_runs"`);
    await queryRunner.query(`
      ALTER TABLE "archived_order_details"
        DROP COLUMN IF EXISTS "snapshotSource",
        DROP COLUMN IF EXISTS "commentOfProduct",
        DROP COLUMN IF EXISTS "categoryNames",
        DROP COLUMN IF EXISTS "productCode",
        DROP COLUMN IF EXISTS "productName"
    `);
    await queryRunner.query(`
      ALTER TABLE "archived_orders"
        DROP COLUMN IF EXISTS "snapshotSource",
        DROP COLUMN IF EXISTS "archivedAt",
        DROP COLUMN IF EXISTS "dailyCashDate",
        DROP COLUMN IF EXISTS "roomName",
        DROP COLUMN IF EXISTS "tableName"
    `);
  }
}
