import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Una línea con cantidad 0 guardó unitaryPrice NaN (división por cero).
 * Ese NaN subió al total del pedido y al totalSales de la caja, y el SUM
 * anual devolvía NaN. Se recomputan solo las filas que quedaron en NaN.
 */
export class ReplaceNumericNaNInSales1783300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "order_details"
      SET "unitaryPrice" = 0
      WHERE "unitaryPrice" = 'NaN'::numeric
    `);
    await queryRunner.query(`
      UPDATE "order_details"
      SET subtotal = 0
      WHERE subtotal = 'NaN'::numeric
    `);
    await queryRunner.query(`
      UPDATE "orders" o
      SET total = COALESCE((
        SELECT SUM(d.subtotal)
        FROM "order_details" d
        WHERE d."orderId" = o.id
          AND d."isActive" = true
          AND d.subtotal IS DISTINCT FROM 'NaN'::numeric
      ), 0)
      WHERE o.total = 'NaN'::numeric
    `);
    await queryRunner.query(`
      UPDATE "orders"
      SET tip = 0
      WHERE tip = 'NaN'::numeric
    `);
    await queryRunner.query(`
      UPDATE "daily_cash" c
      SET "totalSales" = COALESCE((
        SELECT SUM(o.total)
        FROM "orders" o
        WHERE o."dailyCashId" = c.id
          AND o.total IS DISTINCT FROM 'NaN'::numeric
      ), 0)
      WHERE c."totalSales" = 'NaN'::numeric
    `);
    await queryRunner.query(`
      UPDATE "daily_cash" c
      SET "totalNetSales" = c."totalSales" - COALESCE(c."totalDiscounts", 0)
      WHERE c."totalNetSales" = 'NaN'::numeric
    `);
    await queryRunner.query(`
      UPDATE "daily_cash" c
      SET "totalTips" = COALESCE((
        SELECT SUM(o.tip)
        FROM "orders" o
        WHERE o."dailyCashId" = c.id
          AND o.tip IS DISTINCT FROM 'NaN'::numeric
      ), 0)
      WHERE c."totalTips" = 'NaN'::numeric
    `);
  }

  public async down(): Promise<void> {
    // Los NaN no se restauran: no representan un monto.
  }
}
