import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Bases que ya corrieron 1782900000000 antes de que la tabla
 * incluyera legacyImported. El alta nueva ya trae la columna.
 */
export class AddPrintCounterLegacyImported1783100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "print_counter"
      ADD COLUMN IF NOT EXISTS "legacyImported" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "print_counter" DROP COLUMN IF EXISTS "legacyImported"
    `);
  }
}
