import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExtraCostToOrderDetailToppings1741900800000
  implements MigrationInterface
{
  name = 'AddExtraCostToOrderDetailToppings1741900800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const columns = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'order_detail_toppings' AND table_schema = 'public'
    `);
    const columnNames = columns.map((col: any) => col.column_name);

    if (!columnNames.includes('extraCost')) {
      await queryRunner.query(
        `ALTER TABLE "order_detail_toppings" ADD "extraCost" numeric(10,2) NOT NULL DEFAULT 0`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_detail_toppings" DROP COLUMN IF EXISTS "extraCost"`,
    );
  }
}
