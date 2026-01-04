# Análisis: Sistema de Promociones con Slots

## Resumen Ejecutivo

Este documento describe la implementación de un sistema de promociones flexibles donde cada promoción tiene "slots" (espacios) que pueden contener múltiples opciones de productos intercambiables, permitiendo al cliente elegir entre ellos al momento de ordenar.

---

## 1. Contexto del Problema

### Situación Actual

```
Promoción "Café + Torta" (estructura actual - PromotionProduct)
├── Café Americano (fijo, cantidad: 1)
└── Torta de Chocolate (fijo, cantidad: 1)  ← Sin alternativas
```

### Situación Deseada

```
Promoción "Café + Torta" (estructura con slots)
├── Slot "Bebida" (cantidad: 1)
│   └── Opciones: [Café Americano, Café con Leche, Té]
│
└── Slot "Torta" (cantidad: 1)
    └── Opciones: [Torta Chocolate, Torta Frutilla, Torta Limón]
```

---

## 2. Diseño de Entidades

### 2.1 Nueva Entidad: `PromotionSlot`

Representa un "espacio" dentro de una promoción que puede tener múltiples opciones.

```typescript
// src/Product/promotion-slot.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { PromotionSlotOption } from './promotion-slot-option.entity';

@Entity({ name: 'promotion_slots' })
export class PromotionSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string; // Ej: "Torta", "Bebida caliente", "Acompañamiento"

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string; // Descripción opcional del slot

  @Column({ type: 'int', default: 1 })
  quantity: number; // Cantidad de este slot en la promoción

  @Column({ type: 'int', default: 0 })
  displayOrder: number; // Orden de presentación en UI

  @Column({ default: false })
  isOptional: boolean; // Si el cliente puede omitir este slot

  @Column({ default: true })
  isActive: boolean;

  // -------- Relaciones --------

  @ManyToOne(() => Product, (product) => product.promotionSlots, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'promotionId' })
  promotion: Product;

  @Column({ name: 'promotionId' })
  promotionId: string;

  @OneToMany(() => PromotionSlotOption, (option) => option.slot, {
    cascade: true,
  })
  options: PromotionSlotOption[];
}
```

### 2.2 Nueva Entidad: `PromotionSlotOption`

Representa una opción de producto disponible dentro de un slot.

```typescript
// src/Product/promotion-slot-option.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PromotionSlot } from './promotion-slot.entity';
import { Product } from './product.entity';

@Entity({ name: 'promotion_slot_options' })
export class PromotionSlotOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  extraCost: number; // Costo adicional si aplica (ej: torta premium +$500)

  @Column({ default: true })
  isActive: boolean;

  // -------- Relaciones --------

  @ManyToOne(() => PromotionSlot, (slot) => slot.options, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'slotId' })
  slot: PromotionSlot;

  @Column({ name: 'slotId' })
  slotId: string;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ name: 'productId' })
  productId: string;
}
```

### 2.3 Nueva Entidad: `OrderPromotionSelection`

Guarda la selección del cliente para cada slot al crear una orden.

```typescript
// src/Order/order-promotion-selection.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrderDetails } from './order_details.entity';
import { PromotionSlot } from 'src/Product/promotion-slot.entity';
import { Product } from 'src/Product/product.entity';

@Entity({ name: 'order_promotion_selections' })
export class OrderPromotionSelection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  extraCostApplied: number; // Costo extra que se aplicó por esta selección

  // -------- Relaciones --------

  @ManyToOne(() => OrderDetails, (od) => od.promotionSelections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderDetailId' })
  orderDetail: OrderDetails;

  @Column({ name: 'orderDetailId' })
  orderDetailId: string;

  @ManyToOne(() => PromotionSlot)
  @JoinColumn({ name: 'slotId' })
  slot: PromotionSlot;

  @Column({ name: 'slotId' })
  slotId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'selectedProductId' })
  selectedProduct: Product;

  @Column({ name: 'selectedProductId' })
  selectedProductId: string;
}
```

### 2.4 Modificación: `Product` (agregar relación)

```typescript
// En product.entity.ts, agregar:

@OneToMany(() => PromotionSlot, (slot) => slot.promotion)
promotionSlots: PromotionSlot[];
```

### 2.5 Modificación: `OrderDetails` (agregar relación)

```typescript
// En order_details.entity.ts, agregar:

@OneToMany(() => OrderPromotionSelection, (selection) => selection.orderDetail, {
  cascade: true,
})
promotionSelections: OrderPromotionSelection[];
```

---

## 3. Diagrama de Relaciones

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DEFINICIÓN DE PROMOCIÓN                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐         ┌─────────────────┐                       │
│  │   Product    │ 1 ──── * │ PromotionSlot   │                       │
│  │ (promotion)  │         │                 │                       │
│  │              │         │ - name          │                       │
│  │ - name       │         │ - quantity      │                       │
│  │ - price      │         │                 │                       │
│  │ - type       │         │                 │                       │
│  └──────────────┘         └────────┬────────┘                       │
│                                    │                                 │
│                                    │ 1                               │
│                                    │                                 │
│                                    ▼ *                               │
│                           ┌─────────────────────┐                   │
│                           │ PromotionSlotOption │                   │
│                           │                     │                   │
│                           │ - extraCost         │                   │
│                           └──────────┬──────────┘                   │
│                                      │                               │
│                                      │ * ──── 1                      │
│                                      ▼                               │
│                              ┌──────────────┐                       │
│                              │   Product    │                       │
│                              │ (producto    │                       │
│                              │  seleccio-   │                       │
│                              │  nable)      │                       │
│                              └──────────────┘                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         ORDEN DEL CLIENTE                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐         ┌─────────────────┐                       │
│  │    Order     │ 1 ──── * │  OrderDetails   │                       │
│  └──────────────┘         │                 │                       │
│                           │ - quantity      │                       │
│                           │ - unitaryPrice  │                       │
│                           │ - subtotal      │                       │
│                           └────────┬────────┘                       │
│                                    │                                 │
│                                    │ 1 (si es promoción)             │
│                                    │                                 │
│                                    ▼ *                               │
│                     ┌──────────────────────────────┐                │
│                     │  OrderPromotionSelection     │                │
│                     │                              │                │
│                     │ - slotId                     │                │
│                     │ - selectedProductId          │                │
│                     │ - extraCostApplied           │                │
│                     └──────────────────────────────┘                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Manejo de Stock

### 4.1 Flujo Actual de Deducción (Problemático)

```typescript
// stock.service.ts - Método actual
private async deductPromotionStock(promotion: Product, quantity: number) {
  const promotionProducts = await this.productService
    .getPromotionProductsToAnotherService(promotion.id);

  for (const promotionProduct of promotionProducts) {
    await this.deductStock(
      promotionProduct.product.id,  // ← PROBLEMA: Producto fijo
      promotionProduct.quantity * quantity,
    );
  }
}
```

**Problema**: Asume que la promoción tiene productos fijos. Con slots, el cliente elige.

### 4.2 Nuevo Flujo de Deducción Propuesto

```typescript
// stock.service.ts - Método modificado
async deductStock(
  productId: string,
  quantity: number,
  toppingsPerUnit?: string[][],
  promotionSelections?: PromotionSelectionDto[], // ← NUEVO PARÁMETRO
) {
  const product = await this.productService.getProductByIdToAnotherService(productId);

  // ... validaciones existentes ...

  if (product.type === 'simple') {
    await this.deductSimpleStock(product, quantity, unidadId);
  } else if (product.type === 'product') {
    await this.deductCompositeStock(product, quantity);
  } else if (product.type === 'promotion') {
    // ← MODIFICADO: Ahora usa las selecciones del cliente
    await this.deductPromotionStockWithSelections(
      product,
      quantity,
      promotionSelections
    );
  }

  // ... resto del método ...
}

// Nuevo método privado
private async deductPromotionStockWithSelections(
  promotion: Product,
  quantity: number,
  selections: PromotionSelectionDto[],
) {
  // Cargar slots de la promoción
  const slots = await this.promotionSlotRepository.find({
    where: { promotionId: promotion.id, isActive: true },
    relations: ['options', 'options.product'],
  });

  for (const slot of slots) {
    // Buscar la selección del cliente para este slot
    const selection = selections?.find(s => s.slotId === slot.id);

    if (!selection && !slot.isOptional) {
      throw new BadRequestException(
        `Slot "${slot.name}" es obligatorio y no tiene selección`
      );
    }

    if (selection) {
      // Validar que el producto seleccionado es una opción válida del slot
      const validOption = slot.options.find(
        opt => opt.productId === selection.selectedProductId && opt.isActive
      );

      if (!validOption) {
        throw new BadRequestException(
          `Producto seleccionado no es válido para el slot "${slot.name}"`
        );
      }

      // Deducir stock del producto seleccionado
      await this.deductStock(
        selection.selectedProductId,
        slot.quantity * quantity,
        selection.toppingsPerUnit, // Si el producto tiene toppings
      );
    }
  }
}
```

### 4.3 DTO para Selecciones de Promoción

```typescript
// src/DTOs/promotion-selection.dto.ts
import { IsUUID, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PromotionSelectionDto {
  @IsUUID()
  slotId: string;

  @IsUUID()
  selectedProductId: string;

  @IsOptional()
  @IsArray()
  toppingsPerUnit?: string[][]; // Si el producto seleccionado tiene toppings
}

// Actualizar CreateOrderDetailDto
export class CreateOrderDetailDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromotionSelectionDto)
  promotionSelections?: PromotionSelectionDto[]; // ← NUEVO

  @IsOptional()
  @IsArray()
  toppingsPerUnit?: string[][];

  // ... otros campos existentes ...
}
```

### 4.4 Verificación de Stock Disponible

Antes de confirmar una orden, validar que hay stock suficiente:

```typescript
// stock.service.ts
async checkPromotionStockAvailability(
  promotionId: string,
  quantity: number,
  selections: PromotionSelectionDto[],
): Promise<{ available: boolean; insufficientItems: string[] }> {
  const insufficientItems: string[] = [];

  const slots = await this.promotionSlotRepository.find({
    where: { promotionId, isActive: true },
  });

  for (const slot of slots) {
    const selection = selections.find(s => s.slotId === slot.id);

    if (selection) {
      const product = await this.productService
        .getProductByIdToAnotherService(selection.selectedProductId);

      const requiredQuantity = slot.quantity * quantity;
      const hasStock = await this.checkProductStock(product, requiredQuantity);

      if (!hasStock) {
        insufficientItems.push(product.name);
      }
    }
  }

  return {
    available: insufficientItems.length === 0,
    insufficientItems,
  };
}

private async checkProductStock(
  product: Product,
  requiredQuantity: number
): Promise<boolean> {
  if (product.type === 'simple') {
    return product.stock?.quantityInStock >= requiredQuantity;
  } else if (product.type === 'product') {
    // Verificar ingredientes
    for (const pi of product.productIngredients) {
      const ingredientStock = pi.ingredient.stock;
      const required = pi.quantityOfIngredient * requiredQuantity;
      if (!ingredientStock || ingredientStock.quantityInStock < required) {
        return false;
      }
    }
    return true;
  }
  return true;
}
```

---

## 5. Modificaciones Necesarias en Order Service

### 5.1 Procesamiento de Orden con Promociones

```typescript
// order.service.ts - Modificar el procesamiento de OrderDetails

// En el loop de productos de la orden:
for (const pd of productDetails) {
  const product = await queryRunner.manager.findOne(Product, {
    where: { id: pd.productId, isActive: true },
  });

  if (!product) throw new NotFoundException('Product not found');

  // Si es promoción, calcular precio con extras y guardar selecciones
  let finalPrice = product.price;
  let extraCost = 0;

  if (product.type === 'promotion' && pd.promotionSelections?.length) {
    // Calcular costos extra por selecciones premium
    for (const selection of pd.promotionSelections) {
      const slot = await queryRunner.manager.findOne(PromotionSlot, {
        where: { id: selection.slotId },
        relations: ['options'],
      });

      const option = slot.options.find(
        (o) => o.productId === selection.selectedProductId,
      );

      if (option?.extraCost > 0) {
        extraCost += option.extraCost;
      }
    }
    finalPrice += extraCost;
  }

  // Crear OrderDetail
  const orderDetail = queryRunner.manager.create(OrderDetails, {
    product,
    quantity: pd.quantity,
    unitaryPrice: finalPrice,
    subtotal: finalPrice * pd.quantity,
    // ... otros campos
  });

  const savedOrderDetail = await queryRunner.manager.save(orderDetail);

  // Guardar selecciones de promoción
  if (product.type === 'promotion' && pd.promotionSelections?.length) {
    for (const selection of pd.promotionSelections) {
      const slot = await queryRunner.manager.findOne(PromotionSlot, {
        where: { id: selection.slotId },
      });

      const option = slot.options.find(
        (o) => o.productId === selection.selectedProductId,
      );

      const promotionSelection = queryRunner.manager.create(
        OrderPromotionSelection,
        {
          orderDetail: savedOrderDetail,
          slotId: selection.slotId,
          selectedProductId: selection.selectedProductId,
          extraCostApplied: option?.extraCost || 0,
        },
      );

      await queryRunner.manager.save(promotionSelection);
    }
  }

  // Deducir stock con las selecciones
  await this.stockService.deductStock(
    product.id,
    pd.quantity,
    pd.toppingsPerUnit,
    pd.promotionSelections, // ← Pasar selecciones
  );
}
```

---

## 6. Consideraciones Adicionales

### 6.1 Migración de Datos Existentes

Las promociones existentes usando `PromotionProduct` deben migrarse:

```sql
-- Script de migración conceptual
-- Por cada PromotionProduct existente, crear un Slot con una única opción

INSERT INTO promotion_slots (id, name, quantity, promotionId, displayOrder)
SELECT
  gen_random_uuid(),
  p.name,  -- Usar nombre del producto como nombre del slot
  pp.quantity,
  pp.promotionId,
  ROW_NUMBER() OVER (PARTITION BY pp.promotionId ORDER BY pp.id)
FROM promotion_products pp
JOIN products p ON p.id = pp.productId;

-- Luego crear las opciones correspondientes
INSERT INTO promotion_slot_options (id, slotId, productId)
SELECT
  gen_random_uuid(),
  ps.id,
  pp.productId,
  true  -- Todas son default ya que es única opción
FROM promotion_slots ps
JOIN promotion_products pp ON pp.promotionId = ps.promotionId
  AND pp.quantity = ps.quantity;
```

### 6.2 Compatibilidad con Sistema Actual

Mantener temporalmente `PromotionProduct` para:

- Promociones simples sin opciones
- Período de transición
- Fallback si el slot no tiene selecciones

```typescript
// En deductPromotionStock - compatibilidad
if (promotionSelections?.length) {
  await this.deductPromotionStockWithSelections(
    promotion,
    quantity,
    selections,
  );
} else {
  // Fallback al método anterior para promociones legacy
  await this.deductPromotionStockLegacy(promotion, quantity);
}
```

### 6.3 Toppings en Productos de Slots

Los productos seleccionados en un slot pueden tener toppings propios:

```typescript
// DTO extendido
export class PromotionSelectionDto {
  @IsUUID()
  slotId: string;

  @IsUUID()
  selectedProductId: string;

  @IsOptional()
  @IsArray()
  toppingsPerUnit?: string[][]; // Toppings del producto seleccionado
}
```

### 6.4 Impresión de Comandas/Tickets

Modificar el sistema de impresión para mostrar:

- Nombre de la promoción
- Cada slot con su selección
- Toppings de cada producto (si aplica)
- Costo extra (si aplica)

```
┌────────────────────────────────────┐
│  PROMO CAFÉ + TORTA          $2500 │
│  ├─ Bebida: Café con Leche         │
│  └─ Torta: Torta de Chocolate      │
│           + dulce de leche         │
│           + crema                  │
│                                    │
│  (Extra torta premium: +$300)      │
└────────────────────────────────────┘
```

### 6.5 Consideraciones de UI/Frontend

El frontend necesitará:

1. **Vista de creación de promoción**:
   - Crear slots con nombre y cantidad
   - Agregar productos como opciones a cada slot
   - Marcar opción por defecto
   - Definir costo extra por opción

2. **Vista de punto de venta**:
   - Al seleccionar promoción, mostrar selector por cada slot
   - Mostrar opciones disponibles
   - Indicar costo extra de opciones premium
   - Permitir selección de toppings si el producto lo admite

3. **Vista de historial de órdenes**:
   - Mostrar detalle de selecciones por promoción

---

## 7. Plan de Implementación

### Fase 1: Entidades Base (4-6 horas)

- [x] Crear `PromotionSlot` entity
- [x] Crear `PromotionSlotOption` entity
- [x] Crear `OrderPromotionSelection` entity
- [x] Modificar `Product` entity (agregar relación)
- [x] Modificar `OrderDetails` entity (agregar relación)
- [ ] Crear migraciones de base de datos

### Fase 2: DTOs y Validaciones (2-3 horas)

- [x] Crear `PromotionSelectionDto`
- [x] Crear `CreatePromotionSlotDto`
- [x] Crear `UpdatePromotionSlotDto`
- [ ] Actualizar `CreateOrderDetailDto`

### Fase 3: Repository y Service de Slots (4-5 horas)

- [x] Crear `PromotionSlotRepository`
- [x] Métodos CRUD para slots y opciones
- [ ] Integrar en `ProductRepository`/`ProductService`

### Fase 4: Modificación de Stock (3-4 horas)

- [ ] Nuevo método `deductPromotionStockWithSelections`
- [ ] Método `checkPromotionStockAvailability`
- [ ] Actualizar `deductStock` para recibir selecciones

### Fase 5: Modificación de Órdenes (4-5 horas)

- [ ] Actualizar `OrderService` para procesar selecciones
- [ ] Guardar `OrderPromotionSelection`
- [ ] Calcular precios con extras

### Fase 6: Testing y Migración (3-4 horas)

- [ ] Tests unitarios
- [ ] Script de migración de datos existentes
- [ ] Tests de integración

**Total estimado: 20-27 horas de desarrollo backend**

---

## 8. Ejemplo de Uso

### Crear Promoción con Slots

```json
POST /products
{
  "name": "Combo Café + Torta",
  "type": "promotion",
  "price": 2500,
  "categories": ["uuid-categoria-promos"],
  "slots": [
    {
      "name": "Bebida",
      "quantity": 1,
      "isOptional": false,
      "displayOrder": 0,
      "options": [
        { "productId": "uuid-cafe-americano",  "extraCost": 0 },
        { "productId": "uuid-cafe-con-leche","extraCost": 0 },
        { "productId": "uuid-cappuccino", "extraCost": 200 }
      ]
    },
    {
      "name": "Torta",
      "quantity": 1,
      "isOptional": false,
      "displayOrder": 1,
      "options": [
        { "productId": "uuid-torta-chocolate", "extraCost": 0 },
        { "productId": "uuid-torta-frutilla", "extraCost": 0 },
        { "productId": "uuid-torta-limon", "extraCost": 0 },
        { "productId": "uuid-torta-premium", "extraCost": 500 }
      ]
    }
  ]
}
```

### Crear Orden con Selecciones

```json
POST /orders
{
  "tableId": "uuid-mesa-1",
  "productDetails": [
    {
      "productId": "uuid-combo-cafe-torta",
      "quantity": 2,
      "promotionSelections": [
        {
          "slotId": "uuid-slot-bebida",
          "selectedProductId": "uuid-cappuccino",
          "toppingsPerUnit": []
        },
        {
          "slotId": "uuid-slot-torta",
          "selectedProductId": "uuid-torta-chocolate",
          "toppingsPerUnit": [
            ["uuid-dulce-de-leche", "uuid-crema"],
            ["uuid-dulce-de-leche"]
          ]
        }
      ]
    }
  ]
}
```

---

## 9. Resumen de Archivos a Crear/Modificar

### Nuevos Archivos

| Archivo                                         | Descripción                     |
| ----------------------------------------------- | ------------------------------- |
| `src/Product/promotion-slot.entity.ts`          | Entidad PromotionSlot           |
| `src/Product/promotion-slot-option.entity.ts`   | Entidad PromotionSlotOption     |
| `src/Order/order-promotion-selection.entity.ts` | Entidad OrderPromotionSelection |
| `src/DTOs/create-promotion-slot.dto.ts`         | DTO para crear slots            |
| `src/DTOs/promotion-selection.dto.ts`           | DTO para selecciones en orden   |

### Archivos a Modificar

| Archivo                               | Modificación                           |
| ------------------------------------- | -------------------------------------- |
| `src/Product/product.entity.ts`       | Agregar relación `promotionSlots`      |
| `src/Order/order_details.entity.ts`   | Agregar relación `promotionSelections` |
| `src/Product/product.repository.ts`   | CRUD de slots                          |
| `src/Product/product.module.ts`       | Registrar nuevas entidades             |
| `src/Order/order.module.ts`           | Registrar nueva entidad                |
| `src/Order/order.service.ts`          | Procesar selecciones                   |
| `src/Stock/stock.service.ts`          | Deducción con selecciones              |
| `src/DTOs/create-order-detail.dto.ts` | Agregar campo `promotionSelections`    |
