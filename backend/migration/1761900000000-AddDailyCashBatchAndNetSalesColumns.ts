import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDailyCashBatchAndNetSalesColumns1761900000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const cols = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'daily_cash' AND table_schema = 'public'
    `);
    const colNames = cols.map((c: { column_name: string }) => c.column_name);

    if (!colNames.includes('totalNetSales')) {
      await queryRunner.query(
        `ALTER TABLE "daily_cash" ADD "totalNetSales" DECIMAL(10,2) NULL DEFAULT NULL`,
      );
    }

    if (!colNames.includes('totalDiscounts')) {
      await queryRunner.query(
        `ALTER TABLE "daily_cash" ADD "totalDiscounts" DECIMAL(10,2) NULL DEFAULT NULL`,
      );
    }

    if (!colNames.includes('totalBatchClose')) {
      await queryRunner.query(
        `ALTER TABLE "daily_cash" ADD "totalBatchClose" DECIMAL(10,2) NULL DEFAULT NULL`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "daily_cash" DROP COLUMN IF EXISTS "totalBatchClose"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_cash" DROP COLUMN IF EXISTS "totalDiscounts"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_cash" DROP COLUMN IF EXISTS "totalNetSales"`,
    );
  }
}
