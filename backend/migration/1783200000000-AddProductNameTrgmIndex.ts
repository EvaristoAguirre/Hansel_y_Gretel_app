import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * P-02. pg_trgm acelera ILIKE '%...%' sobre el nombre y el código de producto.
 * La búsqueda de mesas es ILIKE exacto sobre un catálogo chico: no usa trigram.
 * No se baja la extensión: puede quedar en uso fuera de estos índices.
 */
export class AddProductNameTrgmIndex1783200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_name_trgm"
      ON "products" USING gin ("name" gin_trgm_ops)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_code_trgm"
      ON "products" USING gin ((CAST("code" AS text)) gin_trgm_ops)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_code_trgm"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_name_trgm"`);
  }
}
