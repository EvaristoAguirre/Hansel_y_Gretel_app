import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTimestampColumnsToOrders1761844619549
  implements MigrationInterface
{
  name = 'AddTimestampColumnsToOrders1761844619549';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columnas de timestamp a la tabla orders
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "orders" ADD "closedAt" TIMESTAMP`);

    // Agregar columnas de timestamp a la tabla archived_orders
    await queryRunner.query(
      `ALTER TABLE "archived_orders" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "archived_orders" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "archived_orders" ADD "closedAt" TIMESTAMP`,
    );

    // Actualizar registros existentes con timestamps basados en la columna 'date'
    await queryRunner.query(
      `UPDATE "orders" SET "createdAt" = "date", "updatedAt" = "date" WHERE "createdAt" IS NOT NULL`,
    );
    await queryRunner.query(
      `UPDATE "archived_orders" SET "createdAt" = "date", "updatedAt" = "date" WHERE "createdAt" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir cambios en archived_orders
    await queryRunner.query(
      `ALTER TABLE "archived_orders" DROP COLUMN "closedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "archived_orders" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "archived_orders" DROP COLUMN "createdAt"`,
    );

    // Revertir cambios en orders
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "closedAt"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "createdAt"`);
  }
}
