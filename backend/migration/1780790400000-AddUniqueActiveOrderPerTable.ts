import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Agrega un índice único parcial sobre orders("tableId") restringido a las
 * filas con state IN ('open', 'pending_payment') y tableId NOT NULL.
 *
 * Esto garantiza a nivel de base de datos que nunca existan dos órdenes
 * activas para la misma mesa, complementando la validación de la capa de
 * aplicación y protegiéndose ante race conditions o manipulación directa.
 *
 * REQUISITO PREVIO: no debe existir ninguna orden con state 'open' o
 * 'pending_payment' duplicada para el mismo tableId. Verificar con:
 *   SELECT "tableId", COUNT(*) FROM orders
 *   WHERE state IN ('open', 'pending_payment') AND "tableId" IS NOT NULL
 *   GROUP BY "tableId" HAVING COUNT(*) > 1;
 */
export class AddUniqueActiveOrderPerTable1780790400000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar que no haya duplicados antes de crear el índice
    const duplicates = await queryRunner.query(`
      SELECT "tableId", COUNT(*) AS total
      FROM orders
      WHERE state IN ('open', 'pending_payment')
        AND "tableId" IS NOT NULL
      GROUP BY "tableId"
      HAVING COUNT(*) > 1
    `);

    if (duplicates.length > 0) {
      throw new Error(
        `[AddUniqueActiveOrderPerTable] No se puede crear el índice único: ` +
          `existen ${duplicates.length} mesa(s) con más de una orden activa. ` +
          `Ejecutar primero la limpieza de órdenes zombie antes de correr esta migración.`,
      );
    }

    // CONCURRENTLY permite crear el índice sin bloquear lecturas ni escrituras
    await queryRunner.query(`
      CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "UQ_active_order_per_table"
      ON "orders" ("tableId")
      WHERE state IN ('open', 'pending_payment') AND "tableId" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_active_order_per_table"
    `);
  }
}
