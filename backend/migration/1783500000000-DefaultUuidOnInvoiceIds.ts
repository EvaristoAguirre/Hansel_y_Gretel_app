import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * La migración de facturas ya estaba aplicada sin DEFAULT en el id.
 * TypeORM inserta DEFAULT y Postgres rechazaba el nulo.
 */
export class DefaultUuidOnInvoiceIds1783500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
      ALTER TABLE "invoices"
      ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()
    `);
    await queryRunner.query(`
      ALTER TABLE "afip_tokens"
      ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "afip_tokens" ALTER COLUMN "id" DROP DEFAULT
    `);
    await queryRunner.query(`
      ALTER TABLE "invoices" ALTER COLUMN "id" DROP DEFAULT
    `);
  }
}
