/**
 * DTO reducido para la búsqueda de productos en el contexto de toma de pedidos (cafe/mozo).
 * Excluye datos de costos, ingredientes y relaciones administrativas que el mozo no necesita,
 * reduciendo los JOINs de la query de ~17 a ~9 y el payload de respuesta significativamente.
 */

export class OrderingToppingDto {
  id: string;
  name: string;
}

export class OrderingToppingGroupDto {
  id: string;
  name: string;
  settings: {
    maxSelection?: number;
    chargeExtra?: boolean;
    extraCost?: number;
  };
  quantityOfTopping: number;
  unitOfMeasure?: { id: string; name: string; abbreviation: string } | null;
  toppings: OrderingToppingDto[];
}

export class OrderingSlotOptionDto {
  id: string;
  extraCost: number;
  isActive: boolean;
  product: {
    id: string;
    name: string;
    price: string;
    type: string;
  };
}

export class OrderingSlotDto {
  id: string;
  name: string;
  description?: string;
  options: OrderingSlotOptionDto[];
}

export class OrderingSlotAssignmentDto {
  slot: OrderingSlotDto;
  quantity: number;
  isOptional: boolean;
}

export class ProductOrderingResponseDto {
  id: string;
  code?: number;
  name: string;
  description?: string;
  price: string;
  type: 'product' | 'promotion' | 'simple';
  allowsToppings: boolean;
  categories: { id: string; name: string }[];
  stock: { quantityInStock: string; minimumStock: string } | null;
  availableToppingGroups: OrderingToppingGroupDto[];
  promotionSlotAssignments: OrderingSlotAssignmentDto[];
}
