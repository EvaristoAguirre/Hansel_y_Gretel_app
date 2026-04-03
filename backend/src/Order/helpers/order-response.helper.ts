import { ProductLineDto, ToppingSummaryDto } from 'src/DTOs/productSummary.dto';
import { OrderDetails } from '../entities/order_details.entity';

/**
 * Reconstruye las líneas de producto de un OrderDetails con precios correctos por unidad.
 *
 * Para pedidos nuevos (con extraCost por topping): agrupa las unidades según
 * su combinación exacta de toppings y calcula el precio unitario real (precio base
 * + costo extra de esa unidad). Esto evita mostrar un precio promediado cuando
 * algunas unidades tienen toppings con cargo y otras no.
 *
 * Para pedidos antiguos (sin extraCost almacenado): usa el unitaryPrice promediado
 * existente en la DB para mantener compatibilidad hacia atrás.
 */
export function buildProductLines(detail: OrderDetails): ProductLineDto[] {
  const allToppings = detail.orderDetailToppings || [];

  const hasChargedToppings = allToppings.some((t) => Number(t.extraCost) > 0);

  if (!hasChargedToppings) {
    const toppings: ToppingSummaryDto[] = allToppings
      .filter((t) => t.topping?.id)
      .map((t) => ({ id: t.topping.id, name: t.topping.name }));

    return [
      {
        detailId: detail.id,
        productId: detail.product.id,
        productName: detail.product.name,
        quantity: detail.quantity,
        unitaryPrice: Number(detail.unitaryPrice),
        subtotal: Number(detail.subtotal),
        allowsToppings: detail.product.allowsToppings,
        commentOfProduct: detail.commentOfProduct || null,
        toppings,
      },
    ];
  }

  // Precio base = unitaryPrice - (toppingsExtraCost / quantity)
  // unitaryPrice almacenado es el promedio: basePrice + totalExtra/qty
  const basePrice =
    Number(detail.unitaryPrice) -
    Number(detail.toppingsExtraCost) / detail.quantity;

  // Agrupar toppings por unidad
  const toppingsByUnit = new Map<number, typeof allToppings>();
  for (let i = 0; i < detail.quantity; i++) {
    toppingsByUnit.set(i, []);
  }
  for (const t of allToppings) {
    const arr = toppingsByUnit.get(t.unitIndex) ?? [];
    arr.push(t);
    toppingsByUnit.set(t.unitIndex, arr);
  }

  // Agrupar unidades por combinación exacta de toppings (IDs ordenados)
  const groups = new Map<
    string,
    { count: number; extraCost: number; toppings: ToppingSummaryDto[] }
  >();

  for (let i = 0; i < detail.quantity; i++) {
    const unitToppings = toppingsByUnit.get(i) ?? [];
    const key = unitToppings
      .map((t) => t.topping?.id ?? '')
      .sort()
      .join(',');
    const unitExtraCost = unitToppings.reduce(
      (sum, t) => sum + Number(t.extraCost),
      0,
    );

    if (!groups.has(key)) {
      groups.set(key, {
        count: 0,
        extraCost: unitExtraCost,
        toppings: unitToppings
          .filter((t) => t.topping?.id)
          .map((t) => ({ id: t.topping.id, name: t.topping.name })),
      });
    }
    groups.get(key)!.count++;
  }

  return Array.from(groups.values()).map((group) => {
    const unitaryPrice = Math.round(basePrice + group.extraCost);
    return {
      detailId: detail.id,
      productId: detail.product.id,
      productName: detail.product.name,
      quantity: group.count,
      unitaryPrice,
      subtotal: unitaryPrice * group.count,
      allowsToppings: detail.product.allowsToppings,
      commentOfProduct: detail.commentOfProduct || null,
      toppings: group.toppings,
    };
  });
}
