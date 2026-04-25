import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración 2/2 del fix de archivado:
 * Elimina los registros huérfanos de la tabla order_details (aquellos sin
 * FK a ninguna orden, "orderId IS NULL") generados por el bug en updateOrder
 * que creaba un OrderDetails extra sin asignar la relación con la orden.
 *
 * ANTES de correr: verificar con
 *   SELECT COUNT(*) FROM order_details WHERE "orderId" IS NULL;
 *
 * Estos registros:
 *   - No pertenecen a ninguna orden (ningún usuario los ve)
 *   - No se archivan jamás (el archive service los ignora)
 *   - No son eliminados por CASCADE al borrar órdenes
 *   - Acumulan basura en la tabla y en order_promotion_selections
 *
 * La migración primero elimina las OrderPromotionSelection vinculadas a
 * esos detalles huérfanos (integridad referencial), luego los detalles.
 */
export class CleanupOrphanOrderDetails1761900004000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Contar huérfanos para el log
    const countResult = await queryRunner.query(`
      SELECT COUNT(*) AS total FROM order_details WHERE "orderId" IS NULL
    `);
    const orphanCount = Number(countResult[0]?.total ?? 0);

    if (orphanCount === 0) {
      console.log(
        '[CleanupOrphanOrderDetails] No se encontraron OrderDetails huérfanos. Nada que limpiar.',
      );
      return;
    }

    console.log(
      `[CleanupOrphanOrderDetails] Se encontraron ${orphanCount} OrderDetails huérfanos. Iniciando limpieza...`,
    );

    // 2. Verificar si existe la tabla de selecciones de promoción
    const tablesResult = await queryRunner.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'order_promotion_selections'
    `);
    const promotionSelectionsTableExists = tablesResult.length > 0;

    // 3. Eliminar OrderPromotionSelection vinculadas a los detalles huérfanos
    //    (la FK en order_promotion_selections tiene onDelete CASCADE, pero por
    //     seguridad lo hacemos explícitamente antes de eliminar los detalles)
    if (promotionSelectionsTableExists) {
      const deletedSelectionsResult = await queryRunner.query(`
        DELETE FROM order_promotion_selections
        WHERE "orderDetailId" IN (
          SELECT id FROM order_details WHERE "orderId" IS NULL
        )
      `);
      const deletedSelections =
        deletedSelectionsResult[1] ?? deletedSelectionsResult?.rowCount ?? 0;
      console.log(
        `[CleanupOrphanOrderDetails] Eliminadas OrderPromotionSelection vinculadas: ${deletedSelections}`,
      );
    }

    // 4. Verificar si existe la tabla de toppings de detalle
    const toppingsTableResult = await queryRunner.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'order_detail_toppings'
    `);
    const toppingsTableExists = toppingsTableResult.length > 0;

    // 5. Eliminar OrderDetailToppings vinculados a los detalles huérfanos
    if (toppingsTableExists) {
      await queryRunner.query(`
        DELETE FROM order_detail_toppings
        WHERE "orderDetailsId" IN (
          SELECT id FROM order_details WHERE "orderId" IS NULL
        )
      `);
    }

    // 6. Eliminar los OrderDetails huérfanos
    const deleteResult = await queryRunner.query(`
      DELETE FROM order_details WHERE "orderId" IS NULL
    `);
    const deletedDetails =
      deleteResult[1] ?? deleteResult?.rowCount ?? orphanCount;
    console.log(
      `[CleanupOrphanOrderDetails] Eliminados ${deletedDetails} OrderDetails huérfanos.`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No se puede revertir una limpieza de datos.
    // Si se necesita restaurar, usar el backup de la base de datos.
    console.warn(
      '[CleanupOrphanOrderDetails] DOWN: Esta migración no puede revertirse automáticamente.',
    );
  }
}
