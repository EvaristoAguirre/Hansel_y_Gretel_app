import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración 1/2 del fix de archivado:
 * Agrega la columna "isActive" a la tabla archived_order_details para
 * distinguir ítems activos de ítems cancelados (soft-delete) dentro de
 * una orden archivada. Nullable con default true para no romper datos existentes.
 */
export class AddIsActiveToArchivedOrderDetails1761900003000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const cols = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'archived_order_details' AND table_schema = 'public'
    `);
    const colNames = cols.map((c: { column_name: string }) => c.column_name);

    if (!colNames.includes('isActive')) {
      await queryRunner.query(`
        ALTER TABLE "archived_order_details"
        ADD "isActive" BOOLEAN NULL DEFAULT TRUE
      `);

      // Los registros históricos existentes se asumen como activos (isActive = true)
      await queryRunner.query(`
        UPDATE "archived_order_details" SET "isActive" = TRUE WHERE "isActive" IS NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "archived_order_details" DROP COLUMN IF EXISTS "isActive"`,
    );
  }
}
