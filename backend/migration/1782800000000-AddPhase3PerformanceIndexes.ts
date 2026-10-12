import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Índices de Fase 3 (P-01). CREATE INDEX sin CONCURRENTLY porque TypeORM
 * envuelve cada migración en una transacción.
 */
export class AddPhase3PerformanceIndexes1782800000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_orders_state_isActive"
      ON "orders" ("state", "isActive")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_orders_dailyCashId"
      ON "orders" ("dailyCashId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_orders_date"
      ON "orders" ("date")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_order_details_orderId_active"
      ON "order_details" ("orderId")
      WHERE "isActive" = true
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_order_payments_orderId"
      ON "order_payments" ("orderId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_cash_movements_dailyCashId_type"
      ON "cash_movements" ("dailyCashId", "type")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_cash_movements_createdAt"
      ON "cash_movements" ("createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_daily_cash_date"
      ON "daily_cash" ("date")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_daily_cash_state"
      ON "daily_cash" ("state")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_tables_roomId_isActive"
      ON "tables" ("roomId", "isActive")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_product_categories_categoryId"
      ON "product_categories" ("categoryId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_promotion_slot_assignments_promotionId"
      ON "promotion_slot_assignments" ("promotionId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_promotion_slot_assignments_promotionId"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_product_categories_categoryId"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_tables_roomId_isActive"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_daily_cash_state"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_daily_cash_date"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_cash_movements_createdAt"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_cash_movements_dailyCashId_type"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_order_payments_orderId"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_order_details_orderId_active"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_dailyCashId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_state_isActive"`);
  }
}
