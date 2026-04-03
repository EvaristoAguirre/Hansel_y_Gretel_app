import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderDiscountColumns1742100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const ordersCols = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'orders' AND table_schema = 'public'
    `);
    const ordersNames = ordersCols.map((c: { column_name: string }) => c.column_name);

    if (!ordersNames.includes('discountPercent')) {
      await queryRunner.query(
        `ALTER TABLE "orders" ADD "discountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0`,
      );
    }
    if (!ordersNames.includes('discountAmount')) {
      await queryRunner.query(
        `ALTER TABLE "orders" ADD "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0`,
      );
    }

    const archivedCols = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'archived_orders' AND table_schema = 'public'
    `);
    const archivedNames = archivedCols.map(
      (c: { column_name: string }) => c.column_name,
    );

    if (!archivedNames.includes('discountPercent')) {
      await queryRunner.query(
        `ALTER TABLE "archived_orders" ADD "discountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0`,
      );
    }
    if (!archivedNames.includes('discountAmount')) {
      await queryRunner.query(
        `ALTER TABLE "archived_orders" ADD "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "archived_orders" DROP COLUMN IF EXISTS "discountAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "archived_orders" DROP COLUMN IF EXISTS "discountPercent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN IF EXISTS "discountAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN IF EXISTS "discountPercent"`,
    );
  }
}
