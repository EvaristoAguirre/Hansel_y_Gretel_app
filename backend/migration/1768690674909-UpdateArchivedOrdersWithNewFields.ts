import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateArchivedOrdersWithNewFields1768690674909
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar columnas existentes en archived_orders
    const archivedOrdersColumns = await queryRunner.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'archived_orders' AND table_schema = 'public'
        `);
    const archivedOrdersColumnNames = archivedOrdersColumns.map(
      (col: any) => col.column_name,
    );

    // Agregar campo tip a archived_orders si no existe
    if (!archivedOrdersColumnNames.includes('tip')) {
      await queryRunner.query(
        `ALTER TABLE "archived_orders" ADD "tip" DECIMAL(10,2) NOT NULL DEFAULT 0`,
      );
    }

    // Hacer nullable tableId y dailyCashId en archived_orders
    await queryRunner.query(
      `ALTER TABLE "archived_orders" ALTER COLUMN "tableId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "archived_orders" ALTER COLUMN "dailyCashId" DROP NOT NULL`,
    );

    // Verificar columnas existentes en archived_order_details
    const archivedOrderDetailsColumns = await queryRunner.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'archived_order_details' AND table_schema = 'public'
        `);
    const archivedOrderDetailsColumnNames = archivedOrderDetailsColumns.map(
      (col: any) => col.column_name,
    );

    // Agregar toppingsExtraCost a archived_order_details si no existe
    if (!archivedOrderDetailsColumnNames.includes('toppingsExtraCost')) {
      await queryRunner.query(
        `ALTER TABLE "archived_order_details" ADD "toppingsExtraCost" DECIMAL(10,2) NOT NULL DEFAULT 0`,
      );
    }

    // Agregar campos JSON a archived_order_details si no existen
    if (!archivedOrderDetailsColumnNames.includes('toppings')) {
      await queryRunner.query(
        `ALTER TABLE "archived_order_details" ADD "toppings" JSON`,
      );
    }
    if (!archivedOrderDetailsColumnNames.includes('promotionSelections')) {
      await queryRunner.query(
        `ALTER TABLE "archived_order_details" ADD "promotionSelections" JSON`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir cambios en archived_order_details
    await queryRunner.query(
      `ALTER TABLE "archived_order_details" DROP COLUMN "promotionSelections"`,
    );
    await queryRunner.query(
      `ALTER TABLE "archived_order_details" DROP COLUMN "toppings"`,
    );
    await queryRunner.query(
      `ALTER TABLE "archived_order_details" DROP COLUMN "toppingsExtraCost"`,
    );

    // Revertir cambios en archived_orders
    await queryRunner.query(
      `ALTER TABLE "archived_orders" ALTER COLUMN "dailyCashId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "archived_orders" ALTER COLUMN "tableId" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "archived_orders" DROP COLUMN "tip"`);
  }
}
