# Análisis Frontend: Sistema de Promociones con Slots

## Resumen

Este documento describe las modificaciones necesarias en el frontend para soportar el nuevo sistema de promociones con slots intercambiables. El análisis se basa en la estructura actual del proyecto Next.js con React, Material-UI y Context API.

---

## 1. Estructura Actual Relevante

### 1.1 Archivos Clave Identificados

| Archivo                                                          | Función                                    |
| ---------------------------------------------------------------- | ------------------------------------------ |
| `components/Order/OrderEditor.tsx`                               | Editor de órdenes - selección de productos |
| `components/Order/ToppingsSection.tsx/ToppingsGroupsViewer.tsx`  | Selector de toppings por unidad            |
| `components/Products/TabProducts/Modal/InputsPromo.tsx`          | Creación/edición de promociones            |
| `components/Products/TabProducts/Modal/ProductCreationModal.tsx` | Modal principal de productos               |
| `app/context/order.context.tsx`                                  | Contexto de órdenes                        |
| `components/Interfaces/IProducts.ts`                             | Interfaces de productos                    |

### 1.2 Flujo Actual de Promociones

```
CREACIÓN DE PROMOCIÓN (InputsPromo.tsx):
┌─────────────────────────────────────────────────────────────────┐
│  1. Buscar producto                                             │
│  2. Seleccionar producto → Se agrega a lista con cantidad fija  │
│  3. No hay concepto de "opciones intercambiables"               │
└─────────────────────────────────────────────────────────────────┘

ORDEN CON PROMOCIÓN (OrderEditor.tsx):
┌─────────────────────────────────────────────────────────────────┐
│  1. Seleccionar promoción del catálogo                          │
│  2. Se agrega como producto único                               │
│  3. No hay selección de componentes                             │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Patrón Existente: ToppingsGroupsViewer

El componente `ToppingsGroupsViewer.tsx` implementa un patrón que puede servir de referencia:

```typescript
// Estructura actual de toppings por unidad
toppingsByProductGroup: {
  [productId: string]: Array<{ [groupId: string]: string[] }>;
}

// Cada unidad del producto puede tener diferentes toppings seleccionados
// Ejemplo: 2 waffles, cada uno con diferentes salsas
```

Este patrón es **análogo** a lo que se necesita para slots de promociones.

---

## 2. Nuevas Interfaces Requeridas

### 2.1 Interfaces para Definición de Promociones

```typescript
// components/Interfaces/IPromotionSlots.ts

export interface IPromotionSlot {
  id: string;
  name: string; // "Torta", "Bebida"
  description?: string;
  quantity: number; // Cantidad de este slot
  displayOrder: number;
  isOptional: boolean;
  isActive: boolean;
  options: IPromotionSlotOption[];
}

export interface IPromotionSlotOption {
  id: string;
  isDefault: boolean;
  extraCost: number; // Costo adicional (ej: torta premium +$500)
  displayOrder: number;
  isActive: boolean;
  product: IProductBasic; // Producto seleccionable
  productId: string;
}

export interface IProductBasic {
  id: string;
  name: string;
  price: number;
  allowsToppings: boolean;
  availableToppingGroups?: IProductToppingsGroupResponse[];
}

// DTO para crear slots
export interface CreatePromotionSlotDto {
  name: string;
  description?: string;
  quantity: number;
  displayOrder: number;
  isOptional: boolean;
  options: CreateSlotOptionDto[];
}

export interface CreateSlotOptionDto {
  productId: string;
  isDefault: boolean;
  extraCost: number;
  displayOrder: number;
}
```

### 2.2 Interfaces para Órdenes

```typescript
// Extensión de IProducts.ts

export interface PromotionSelectionDto {
  slotId: string;
  selectedProductId: string;
  toppingsPerUnit?: string[][]; // Si el producto tiene toppings
}

// Actualizar SelectedProductsI
export interface SelectedProductsI {
  productId: string;
  productName?: string;
  quantity: number;
  unitaryPrice?: string | null;
  commentOfProduct?: string | null;
  toppingsIds?: string[];
  toppingsPerUnit?: string[][];
  allowsToppings?: boolean;
  availableToppingGroups?: IProductToppingsGroupResponse[];
  internalId?: string;

  // NUEVOS CAMPOS
  isPromotion?: boolean;
  promotionSlots?: IPromotionSlot[];
  promotionSelections?: PromotionSelectionDto[];
}
```

### 2.3 Actualizar ProductResponse

```typescript
// En IProducts.ts, agregar a ProductResponse:

export interface ProductResponse {
  // ... campos existentes ...

  // NUEVO: Slots de promoción
  promotionSlots?: IPromotionSlot[];
}
```

---

## 3. Modificaciones en Vistas Existentes

### 3.1 ProductCreationModal.tsx - Tab "Promo"

**Cambio necesario**: Reemplazar `InputsPromo.tsx` por un nuevo componente que permita crear slots con opciones.

```
ANTES:
┌─────────────────────────────────────────┐
│  [Buscar producto]                      │
│  ┌─────────────────────────────────┐    │
│  │ 1x Café Americano         $500  │    │
│  │ 1x Torta Chocolate        $800  │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘

DESPUÉS:
┌─────────────────────────────────────────────────────────────┐
│  + Agregar Slot                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ SLOT: Bebida                              [Editar]  │    │
│  │ Cantidad: 1  |  Obligatorio: ✓                      │    │
│  │ Opciones:                                           │    │
│  │   ● Café Americano (por defecto)           +$0     │    │
│  │   ○ Café con Leche                         +$0     │    │
│  │   ○ Cappuccino                           +$200     │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ SLOT: Torta                               [Editar]  │    │
│  │ Cantidad: 1  |  Obligatorio: ✓                      │    │
│  │ Opciones:                                           │    │
│  │   ● Torta Chocolate (por defecto)          +$0     │    │
│  │   ○ Torta Frutilla                         +$0     │    │
│  │   ○ Torta Premium                        +$500     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 OrderEditor.tsx - Selección de Promociones

**Cambio necesario**: Cuando se selecciona una promoción, mostrar un selector para cada slot.

```
FLUJO NUEVO:
1. Usuario selecciona "Combo Café + Torta" del catálogo
2. Se detecta que es promoción con slots
3. Se abre modal/sección de selección de slots
4. Por cada slot, usuario elige una opción
5. Si la opción tiene toppings, se permite seleccionarlos
6. Se calcula precio final (base + extras)
7. Se agrega al pedido con las selecciones
```

---

## 4. Nuevos Componentes a Crear

### 4.1 Componentes para Creación de Promociones

| Componente                 | Ubicación                                      | Descripción                 |
| -------------------------- | ---------------------------------------------- | --------------------------- |
| `PromotionSlotsEditor.tsx` | `components/Products/TabProducts/Modal/Slots/` | Reemplaza a InputsPromo     |
| `SlotCard.tsx`             | `components/Products/TabProducts/Modal/Slots/` | Card individual de un slot  |
| `SlotOptionsEditor.tsx`    | `components/Products/TabProducts/Modal/Slots/` | Editor de opciones del slot |
| `SlotOptionRow.tsx`        | `components/Products/TabProducts/Modal/Slots/` | Fila de una opción          |

### 4.2 Componentes para Órdenes

| Componente                  | Ubicación                          | Descripción                 |
| --------------------------- | ---------------------------------- | --------------------------- |
| `PromotionSlotSelector.tsx` | `components/Order/PromotionSlots/` | Selector principal de slots |
| `SlotOptionPicker.tsx`      | `components/Order/PromotionSlots/` | Picker de opciones por slot |
| `PromotionSummary.tsx`      | `components/Order/PromotionSlots/` | Resumen de selecciones      |

---

## 5. Detalle de Componentes Nuevos

### 5.1 PromotionSlotsEditor.tsx

```typescript
// components/Products/TabProducts/Modal/Slots/PromotionSlotsEditor.tsx

interface PromotionSlotsEditorProps {
  slots: CreatePromotionSlotDto[];
  onSlotsChange: (slots: CreatePromotionSlotDto[]) => void;
  products: ProductResponse[]; // Productos disponibles para agregar
}

/**
 * Funcionalidades:
 * - Agregar/eliminar slots
 * - Ordenar slots (drag & drop opcional)
 * - Para cada slot:
 *   - Editar nombre y cantidad
 *   - Marcar como opcional/obligatorio
 *   - Agregar/quitar opciones de productos
 *   - Marcar opción por defecto
 *   - Definir costo extra por opción
 */
```

### 5.2 PromotionSlotSelector.tsx

```typescript
// components/Order/PromotionSlots/PromotionSlotSelector.tsx

interface PromotionSlotSelectorProps {
  promotion: ProductResponse; // La promoción seleccionada
  quantity: number; // Cantidad de promociones
  onSelectionsChange: (selections: PromotionSelectionDto[]) => void;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Funcionalidades:
 * - Mostrar todos los slots de la promoción
 * - Por cada slot, mostrar opciones disponibles
 * - Permitir seleccionar una opción por slot
 * - Si la opción tiene toppings, mostrar ToppingsGroupsViewer
 * - Calcular y mostrar precio total (base + extras)
 * - Validar que todos los slots obligatorios tengan selección
 */
```

### 5.3 SlotOptionPicker.tsx (similar a ToppingsGroupsViewer)

```typescript
// components/Order/PromotionSlots/SlotOptionPicker.tsx

interface SlotOptionPickerProps {
  slot: IPromotionSlot;
  unitIndex: number; // Para múltiples promociones
  selectedOptionId: string | null;
  onOptionSelect: (optionId: string, productId: string) => void;
  onToppingsChange?: (toppings: { [groupId: string]: string[] }) => void;
}

/**
 * Diseño sugerido (similar a ToppingsGroupsViewer):
 *
 * ┌─────────────────────────────────────────────────┐
 * │  🍰 Torta                                       │
 * │  ─────────────────────────────────────────────  │
 * │  ○ Torta Chocolate                              │
 * │  ● Torta Frutilla  ✓                           │
 * │  ○ Torta Premium (+$500)                        │
 * │                                                 │
 * │  [Si tiene toppings, mostrar selector]          │
 * │  ┌─────────────────────────────────────────┐   │
 * │  │ Agregados para Torta Frutilla:          │   │
 * │  │ ☑ Dulce de leche  ☑ Crema  ☐ Miel      │   │
 * │  └─────────────────────────────────────────┘   │
 * └─────────────────────────────────────────────────┘
 */
```

---

## 6. Modificaciones en Context

### 6.1 order.context.tsx

Agregar nuevo estado y funciones para manejar selecciones de promociones:

```typescript
// Nuevo estado
const [promotionSelectionsByProduct, setPromotionSelectionsByProduct] =
  useState<{
    [productId: string]: Array<{
      // Array por cada unidad de la promoción
      [slotId: string]: {
        selectedProductId: string;
        toppings?: { [groupId: string]: string[] };
      };
    }>;
  }>({});

// Nuevas funciones en el contexto
type OrderContextType = {
  // ... existentes ...

  // NUEVAS
  updatePromotionSelection: (
    promotionId: string,
    unitIndex: number,
    slotId: string,
    selectedProductId: string
  ) => void;

  updatePromotionSlotToppings: (
    promotionId: string,
    unitIndex: number,
    slotId: string,
    toppings: { [groupId: string]: string[] }
  ) => void;

  getPromotionSelections: (promotionId: string) => PromotionSelectionDto[];

  validatePromotionSelections: (
    promotionId: string,
    slots: IPromotionSlot[]
  ) => { valid: boolean; missingSlots: string[] };
};
```

### 6.2 Modificar handleSelectedProducts

```typescript
const handleSelectedProducts = async (product: ProductResponse) => {
  // Si es promoción con slots, abrir selector en lugar de agregar directamente
  if (product.type === 'promotion' && product.promotionSlots?.length > 0) {
    // Disparar apertura de modal de selección de slots
    setPromotionToSelect(product);
    setShowPromotionSlotSelector(true);
    return;
  }

  // ... lógica existente para productos normales ...
};
```

### 6.3 Modificar confirmarPedido en OrderEditor.tsx

```typescript
const confirmarPedido = async () => {
  const productDetails = selectedProducts.map((product) => {
    const baseDetail = {
      productId: product.productId,
      quantity: product.quantity,
      toppingsPerUnit: selectedToppingsByProduct[product.productId] ?? [],
      commentOfProduct: commentInputs[product.productId],
    };

    // NUEVO: Si es promoción, incluir selecciones de slots
    if (product.isPromotion && product.promotionSelections) {
      return {
        ...baseDetail,
        promotionSelections: product.promotionSelections,
      };
    }

    return baseDetail;
  });

  // ... resto igual ...
};
```

---

## 7. Modificaciones en API

### 7.1 Nuevo archivo: api/promotionSlots.ts

```typescript
// frontend/api/promotionSlots.ts

import { URI_PRODUCTS } from '@/components/URI/URI';

export const getPromotionSlots = async (
  promotionId: string,
  token: string
): Promise<IPromotionSlot[]> => {
  const response = await fetch(`${URI_PRODUCTS}/${promotionId}/slots`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Error al obtener slots');
  return response.json();
};

export const checkSlotOptionStock = async (
  productId: string,
  quantity: number,
  toppingsPerUnit: string[][],
  token: string
): Promise<{ available: boolean; message?: string }> => {
  // Reutilizar checkStock existente
  // ...
};
```

### 7.2 Modificar api/products.ts

```typescript
// Agregar slots al crear/editar promoción

export const createPromotion = async (
  data: CreatePromotionDto,
  token: string
) => {
  // data ahora incluye slots en lugar de products
  const body = {
    ...data,
    slots: data.slots, // Array de CreatePromotionSlotDto
  };

  // ... fetch ...
};
```

---

## 8. Flujo de Usuario Detallado

### 8.1 Crear Promoción con Slots

```
1. Admin abre modal de creación de producto
2. Selecciona tab "Promo"
3. Completa datos básicos (nombre, precio, categorías)
4. Sección de Slots:
   a. Click "Agregar Slot"
   b. Ingresa nombre del slot (ej: "Bebida")
   c. Define cantidad (ej: 1)
   d. Marca si es obligatorio u opcional
   e. Agrega opciones:
      - Busca productos
      - Selecciona producto
      - Marca si es opción por defecto
      - Define costo extra (si aplica)
   f. Repite para más slots
5. Guarda promoción
```

### 8.2 Ordenar Promoción con Slots

```
1. Mozo/Cajero selecciona promoción del catálogo
2. Se abre modal de selección de slots
3. Por cada slot:
   a. Ve las opciones disponibles
   b. Selecciona una opción
   c. Si la opción tiene toppings:
      - Se expande selector de toppings
      - Elige toppings para esa opción
4. Ve resumen con precio total
5. Confirma selección
6. Promoción se agrega al pedido con las selecciones
7. En la lista de productos se muestra:
   "Combo Café + Torta x1
    └─ Bebida: Cappuccino
    └─ Torta: Torta Chocolate + dulce de leche"
```

---

## 9. Diseño de UI Propuesto

### 9.1 Modal de Selección de Slots (Orden)

```
┌─────────────────────────────────────────────────────────────────┐
│  COMBO CAFÉ + TORTA                                    [X]      │
│  ═══════════════════════════════════════════════════════════   │
│                                                                 │
│  Selecciona tus opciones:                                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ☕ BEBIDA                                    Obligatorio │   │
│  │ ───────────────────────────────────────────────────────  │   │
│  │  ○ Café Americano                                        │   │
│  │  ● Café con Leche                                  ✓     │   │
│  │  ○ Cappuccino                              (+$200)       │   │
│  │  ○ Té                                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🍰 TORTA                                     Obligatorio │   │
│  │ ───────────────────────────────────────────────────────  │   │
│  │  ● Torta Chocolate                                 ✓     │   │
│  │  ○ Torta Frutilla                                        │   │
│  │  ○ Torta Limón                                           │   │
│  │  ○ Torta Premium                           (+$500)       │   │
│  │                                                          │   │
│  │  ┌─ Agregados para Torta Chocolate ─────────────────┐   │   │
│  │  │  Salsas (máx 2):                                 │   │   │
│  │  │  ☑ Dulce de leche  ☑ Crema  ☐ Miel  ☐ Chocolate │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ═══════════════════════════════════════════════════════════   │
│  Precio base:                                         $2.500    │
│  Extra Cappuccino:                                      $200    │
│  ───────────────────────────────────────────────────────────   │
│  TOTAL:                                               $2.700    │
│                                                                 │
│              [Cancelar]              [Agregar al Pedido]        │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Editor de Slots (Admin)

```
┌─────────────────────────────────────────────────────────────────┐
│  SLOTS DE LA PROMOCIÓN                      [+ Agregar Slot]    │
│  ═══════════════════════════════════════════════════════════   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ SLOT #1                                    [↑] [↓] [🗑]  │   │
│  │ ───────────────────────────────────────────────────────  │   │
│  │ Nombre: [Bebida____________]  Cantidad: [1]              │   │
│  │ ☑ Obligatorio                                            │   │
│  │                                                          │   │
│  │ Opciones:                              [+ Agregar opción]│   │
│  │ ┌─────────────────────────────────────────────────────┐ │   │
│  │ │ ● Café Americano          Extra: $[0___]    [🗑]    │ │   │
│  │ │ ○ Café con Leche          Extra: $[0___]    [🗑]    │ │   │
│  │ │ ○ Cappuccino              Extra: $[200_]    [🗑]    │ │   │
│  │ └─────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ SLOT #2                                    [↑] [↓] [🗑]  │   │
│  │ ───────────────────────────────────────────────────────  │   │
│  │ Nombre: [Torta_____________]  Cantidad: [1]              │   │
│  │ ☑ Obligatorio                                            │   │
│  │                                                          │   │
│  │ Opciones:                              [+ Agregar opción]│   │
│  │ ┌─────────────────────────────────────────────────────┐ │   │
│  │ │ ● Torta Chocolate         Extra: $[0___]    [🗑]    │ │   │
│  │ │ ○ Torta Frutilla          Extra: $[0___]    [🗑]    │ │   │
│  │ │ ○ Torta Premium           Extra: $[500_]    [🗑]    │ │   │
│  │ └─────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 9.3 Visualización en Lista de Pedido

```
┌─────────────────────────────────────────────────────────────────┐
│  PRODUCTOS SIN CONFIRMAR                                        │
│  ───────────────────────────────────────────────────────────   │
│                                                                 │
│  [-] 2 [+]  Combo Café + Torta                        $5.400   │
│             ├─ Unidad 1:                                        │
│             │  └─ Bebida: Cappuccino (+$200)                   │
│             │  └─ Torta: Chocolate + dulce de leche, crema     │
│             ├─ Unidad 2:                                        │
│             │  └─ Bebida: Café Americano                       │
│             │  └─ Torta: Frutilla + miel                       │
│             [Comentario] [Editar selecciones] [Eliminar]       │
│                                                                 │
│  [-] 1 [+]  Medialuna                                   $350   │
│             [Comentario] [Eliminar]                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Plan de Implementación Frontend

### Fase 1: Interfaces y Tipos (2-3 horas)

- [ ] Crear `IPromotionSlots.ts` con todas las interfaces
- [ ] Actualizar `IProducts.ts` con campos para slots
- [ ] Actualizar `IOrder.ts` con campos para selecciones

### Fase 2: Componentes de Admin (6-8 horas)

- [ ] Crear `PromotionSlotsEditor.tsx`
- [ ] Crear `SlotCard.tsx`
- [ ] Crear `SlotOptionsEditor.tsx`
- [ ] Crear `SlotOptionRow.tsx`
- [ ] Modificar `ProductCreationModal.tsx` para usar nuevos componentes
- [ ] Actualizar `InputsPromo.tsx` o reemplazarlo

### Fase 3: API y Servicios (2-3 horas)

- [ ] Crear `api/promotionSlots.ts`
- [ ] Modificar `api/products.ts` para soportar slots
- [ ] Agregar endpoints de validación de stock para opciones

### Fase 4: Componentes de Orden (8-10 horas)

- [ ] Crear `PromotionSlotSelector.tsx`
- [ ] Crear `SlotOptionPicker.tsx`
- [ ] Crear `PromotionSummary.tsx`
- [ ] Integrar con `OrderEditor.tsx`
- [ ] Modificar visualización en lista de productos

### Fase 5: Context y Estado (4-5 horas)

- [ ] Actualizar `order.context.tsx` con nuevo estado
- [ ] Implementar funciones de manejo de selecciones
- [ ] Integrar validaciones de stock
- [ ] Manejar WebSocket para actualizaciones

### Fase 6: Testing y Ajustes (4-5 horas)

- [ ] Pruebas de creación de promociones con slots
- [ ] Pruebas de órdenes con promociones
- [ ] Pruebas de múltiples unidades con diferentes selecciones
- [ ] Pruebas de toppings en productos de slots
- [ ] Ajustes de UI/UX

**Total estimado: 26-34 horas de desarrollo frontend**

---

## 11. Resumen de Archivos

### Nuevos Archivos a Crear

| Archivo                                                                | Descripción               |
| ---------------------------------------------------------------------- | ------------------------- |
| `components/Interfaces/IPromotionSlots.ts`                             | Interfaces para slots     |
| `components/Products/TabProducts/Modal/Slots/PromotionSlotsEditor.tsx` | Editor principal de slots |
| `components/Products/TabProducts/Modal/Slots/SlotCard.tsx`             | Card de slot individual   |
| `components/Products/TabProducts/Modal/Slots/SlotOptionsEditor.tsx`    | Editor de opciones        |
| `components/Products/TabProducts/Modal/Slots/SlotOptionRow.tsx`        | Fila de opción            |
| `components/Order/PromotionSlots/PromotionSlotSelector.tsx`            | Modal selector de slots   |
| `components/Order/PromotionSlots/SlotOptionPicker.tsx`                 | Picker de opciones        |
| `components/Order/PromotionSlots/PromotionSummary.tsx`                 | Resumen de selección      |
| `api/promotionSlots.ts`                                                | Funciones de API          |

### Archivos a Modificar

| Archivo                                                          | Modificación                        |
| ---------------------------------------------------------------- | ----------------------------------- |
| `components/Interfaces/IProducts.ts`                             | Agregar campos de slots             |
| `components/Products/TabProducts/Modal/ProductCreationModal.tsx` | Integrar editor de slots            |
| `components/Products/TabProducts/Modal/InputsPromo.tsx`          | Reemplazar o adaptar                |
| `components/Order/OrderEditor.tsx`                               | Detectar promociones con slots      |
| `app/context/order.context.tsx`                                  | Estado y funciones para selecciones |
| `api/products.ts`                                                | Soportar creación con slots         |

---

## 12. Consideraciones Adicionales

### 12.1 Compatibilidad con Promociones Existentes

- Las promociones sin slots deben seguir funcionando igual
- Detectar si `promotionSlots` existe y tiene elementos
- Si no tiene slots, usar flujo actual (agregar directo al pedido)

### 12.2 Rendimiento

- Cargar slots de promoción bajo demanda (cuando se selecciona)
- Cachear opciones de productos ya cargadas
- Optimizar re-renders en selectores

### 12.3 UX Mobile

- Los modales de selección deben ser responsive
- Considerar versión de pantalla completa en móviles
- Botones táctiles de tamaño adecuado

### 12.4 Accesibilidad

- Labels descriptivos en formularios
- Navegación por teclado en selectores
- Feedback visual claro de selecciones
