# Plan de Trabajo - Frontend - Sistema de Promociones con Slots v01

## 📊 Estado Actual del Proyecto

### ✅ Estructura Existente

#### **Archivos Clave Identificados:**

| Archivo                                                          | Función                                    | Estado                            |
| ---------------------------------------------------------------- | ------------------------------------------ | --------------------------------- |
| `components/Order/OrderEditor.tsx`                               | Editor de órdenes - selección de productos | ✅ Existe                         |
| `components/Order/ToppingsSection.tsx`                           | Selector de toppings por unidad            | ✅ Existe (referencia para slots) |
| `components/Products/TabProducts/Modal/InputsPromo.tsx`          | Creación/edición de promociones            | ✅ Existe (legacy, a reemplazar)  |
| `components/Products/TabProducts/Modal/ProductCreationModal.tsx` | Modal principal de productos               | ✅ Existe                         |
| `app/context/order.context.tsx`                                  | Contexto de órdenes                        | ✅ Existe                         |
| `components/Interfaces/IProducts.ts`                             | Interfaces de productos                    | ✅ Existe                         |

#### **Flujo Actual de Promociones (Legacy):**

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

#### **Patrón Reutilizable: ToppingsGroupsViewer**

El componente `ToppingsGroupsViewer.tsx` implementa un patrón análogo:

- Permite seleccionar opciones por unidad de producto
- Cada unidad puede tener diferentes selecciones
- Estructura de datos: `{ [productId]: Array<{ [groupId]: string[] }> }`

Este patrón servirá de **referencia arquitectónica** para el selector de slots.

---

## 🔴 Tareas Pendientes

### 🎯 **FASE 1: INTERFACES Y TIPOS**

**Objetivo:** Definir estructura de datos y contratos con el backend.

---

#### **Sprint 1.1: Interfaces Base de Slots**

**Duración estimada:** 2-3 horas
**Prioridad:** 🔴 CRÍTICA

##### **Tarea 1.1.1: Crear interfaces de slots** ⏱️ 1.5-2h

**Archivo a crear:**

- `components/Interfaces/IPromotionSlots.ts`

**Contenido:**

```typescript
// components/Interfaces/IPromotionSlots.ts

import { IProductToppingsGroupResponse } from './IProducts';

/**
 * Producto básico para opciones de slots
 */
export interface IProductBasic {
  id: string;
  name: string;
  price: number;
  cost?: number;
  type: 'simple' | 'product' | 'promotion';
  allowsToppings: boolean;
  availableToppingGroups?: IProductToppingsGroupResponse[];
}

/**
 * Opción dentro de un slot
 */
export interface IPromotionSlotOption {
  id: string;
  isDefault: boolean;
  extraCost: number; // Costo adicional (ej: torta premium +$500)
  displayOrder: number;
  isActive: boolean;
  product: IProductBasic; // Producto seleccionable
  productId: string;
  slotId: string;
}

/**
 * Slot de una promoción (ej: "Bebida", "Torta")
 */
export interface IPromotionSlot {
  id: string;
  name: string; // "Torta", "Bebida"
  description?: string;
  quantity: number; // Cantidad de este slot en la promoción
  displayOrder: number;
  isOptional: boolean;
  isActive: boolean;
  promotionId: string;
  options: IPromotionSlotOption[];
}

/**
 * DTO para crear opciones de slot
 */
export interface CreateSlotOptionDto {
  productId: string;
  isDefault: boolean;
  extraCost: number;
  displayOrder: number;
}

/**
 * DTO para crear slot con opciones
 */
export interface CreatePromotionSlotDto {
  name: string;
  description?: string;
  quantity: number;
  displayOrder: number;
  isOptional: boolean;
  options: CreateSlotOptionDto[];
}

/**
 * DTO para actualizar slot
 */
export interface UpdatePromotionSlotDto {
  name?: string;
  description?: string;
  quantity?: number;
  displayOrder?: number;
  isOptional?: boolean;
  isActive?: boolean;
}

/**
 * Selección de un cliente para un slot (en una orden)
 */
export interface PromotionSelectionDto {
  slotId: string;
  selectedProductId: string;
  toppingsPerUnit?: string[][]; // Si el producto tiene toppings
}

/**
 * Estado de validación de selecciones
 */
export interface PromotionValidationResult {
  valid: boolean;
  missingSlots: string[]; // IDs de slots obligatorios sin selección
  invalidOptions: string[]; // IDs de opciones inválidas
  insufficientStock: string[]; // Productos sin stock
}

/**
 * Resumen de precio de promoción con selecciones
 */
export interface PromotionPriceSummary {
  basePrice: number;
  extraCosts: { slotName: string; optionName: string; cost: number }[];
  totalExtraCost: number;
  finalPrice: number;
}
```

---

##### **Tarea 1.1.2: Actualizar IProducts.ts** ⏱️ 0.5-1h

**Archivo a modificar:**

- `components/Interfaces/IProducts.ts`

**Cambios:**

```typescript
import { IPromotionSlot, PromotionSelectionDto } from './IPromotionSlots';

// Actualizar ProductResponse
export interface ProductResponse {
  // ... campos existentes ...

  // NUEVO: Slots de promoción (si type === 'promotion')
  promotionSlots?: IPromotionSlot[];
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

  // NUEVOS CAMPOS para promociones con slots
  isPromotion?: boolean;
  promotionSlots?: IPromotionSlot[];
  promotionSelections?: PromotionSelectionDto[];
}
```

---

### 🎯 **FASE 2: COMPONENTES DE ADMINISTRACIÓN**

**Objetivo:** Permitir a los administradores crear y editar promociones con slots.

---

#### **Sprint 2.1: Editor de Slots (Creación)**

**Duración estimada:** 8-10 horas
**Prioridad:** 🔴 CRÍTICA

##### **Tarea 2.1.1: Crear PromotionSlotsEditor** ⏱️ 4-5h

**Archivo a crear:**

- `components/Products/TabProducts/Modal/Slots/PromotionSlotsEditor.tsx`

**Funcionalidades:**

- Listar slots existentes
- Agregar nuevo slot
- Eliminar slot
- Reordenar slots (drag & drop opcional, o botones ↑↓)
- Por cada slot, mostrar `SlotCard`

**Estructura del componente:**

```typescript
interface PromotionSlotsEditorProps {
  slots: CreatePromotionSlotDto[];
  onSlotsChange: (slots: CreatePromotionSlotDto[]) => void;
  availableProducts: ProductResponse[]; // Productos disponibles para opciones
}

export const PromotionSlotsEditor: React.FC<PromotionSlotsEditorProps> = ({
  slots,
  onSlotsChange,
  availableProducts,
}) => {
  const handleAddSlot = () => {
    const newSlot: CreatePromotionSlotDto = {
      name: '',
      quantity: 1,
      displayOrder: slots.length,
      isOptional: false,
      options: [],
    };
    onSlotsChange([...slots, newSlot]);
  };

  const handleRemoveSlot = (index: number) => {
    onSlotsChange(slots.filter((_, i) => i !== index));
  };

  const handleUpdateSlot = (
    index: number,
    updatedSlot: CreatePromotionSlotDto
  ) => {
    const newSlots = [...slots];
    newSlots[index] = updatedSlot;
    onSlotsChange(newSlots);
  };

  const handleReorderSlot = (fromIndex: number, toIndex: number) => {
    const reordered = [...slots];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    // Actualizar displayOrder
    reordered.forEach((slot, index) => {
      slot.displayOrder = index;
    });
    onSlotsChange(reordered);
  };

  return (
    <Box>
      <Typography variant="h6">Slots de la Promoción</Typography>
      <Button onClick={handleAddSlot} startIcon={<AddIcon />}>
        Agregar Slot
      </Button>

      {slots.map((slot, index) => (
        <SlotCard
          key={index}
          slot={slot}
          index={index}
          availableProducts={availableProducts}
          onUpdate={(updated) => handleUpdateSlot(index, updated)}
          onRemove={() => handleRemoveSlot(index)}
          onMoveUp={() => handleReorderSlot(index, index - 1)}
          onMoveDown={() => handleReorderSlot(index, index + 1)}
          canMoveUp={index > 0}
          canMoveDown={index < slots.length - 1}
        />
      ))}
    </Box>
  );
};
```

**Validaciones:**

- No permitir guardar si hay slots sin nombre
- No permitir guardar si hay slots sin opciones
- Límite de 10 opciones por slot
- Exactamente una opción debe ser default por slot

---

##### **Tarea 2.1.2: Crear SlotCard** ⏱️ 2-3h

**Archivo a crear:**

- `components/Products/TabProducts/Modal/Slots/SlotCard.tsx`

**Funcionalidades:**

- Mostrar información del slot
- Editar nombre, cantidad, obligatorio/opcional
- Botones para reordenar (↑↓)
- Botón para eliminar slot
- Contenedor para `SlotOptionsEditor`

**UI sugerida:**

```
┌─────────────────────────────────────────────────────────┐
│ SLOT #1                                    [↑] [↓] [🗑]  │
│ ───────────────────────────────────────────────────────  │
│ Nombre: [Bebida____________]  Cantidad: [1]              │
│ ☑ Obligatorio                                            │
│                                                          │
│ <SlotOptionsEditor />                                    │
└─────────────────────────────────────────────────────────┘
```

---

##### **Tarea 2.1.3: Crear SlotOptionsEditor** ⏱️ 2-3h

**Archivo a crear:**

- `components/Products/TabProducts/Modal/Slots/SlotOptionsEditor.tsx`

**Funcionalidades:**

- Listar opciones del slot
- Agregar opción (buscar producto con Autocomplete)
- Por cada opción, mostrar `SlotOptionRow`
- Validar límite de 10 opciones

**Estructura:**

```typescript
interface SlotOptionsEditorProps {
  options: CreateSlotOptionDto[];
  availableProducts: ProductResponse[];
  onOptionsChange: (options: CreateSlotOptionDto[]) => void;
}

export const SlotOptionsEditor: React.FC<SlotOptionsEditorProps> = ({
  options,
  availableProducts,
  onOptionsChange,
}) => {
  const [searchProduct, setSearchProduct] = useState<string>('');

  const handleAddOption = (product: ProductResponse) => {
    // Validar que no sea promoción
    if (product.type === 'promotion') {
      alert('No puedes agregar una promoción como opción de slot');
      return;
    }

    // Validar que no esté ya agregado
    if (options.find((o) => o.productId === product.id)) {
      alert('Este producto ya está en las opciones');
      return;
    }

    // Validar límite
    if (options.length >= 10) {
      alert('Un slot no puede tener más de 10 opciones');
      return;
    }

    const newOption: CreateSlotOptionDto = {
      productId: product.id,
      isDefault: options.length === 0, // Primera opción es default
      extraCost: 0,
      displayOrder: options.length,
    };

    onOptionsChange([...options, newOption]);
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);

    // Si eliminamos la opción default, marcar la primera como default
    if (options[index].isDefault && newOptions.length > 0) {
      newOptions[0].isDefault = true;
    }

    onOptionsChange(newOptions);
  };

  const handleUpdateOption = (index: number, updated: CreateSlotOptionDto) => {
    const newOptions = [...options];

    // Si se marca como default, desmarcar las demás
    if (updated.isDefault) {
      newOptions.forEach((opt, i) => {
        opt.isDefault = i === index;
      });
    }

    newOptions[index] = updated;
    onOptionsChange(newOptions);
  };

  return (
    <Box>
      <Typography variant="subtitle2">Opciones del Slot</Typography>

      {/* Autocomplete para buscar productos */}
      <Autocomplete
        options={availableProducts.filter((p) => p.type !== 'promotion')}
        getOptionLabel={(option) => option.name}
        onChange={(_, product) => product && handleAddOption(product)}
        renderInput={(params) => (
          <TextField {...params} label="Buscar producto" />
        )}
      />

      {/* Lista de opciones */}
      {options.map((option, index) => (
        <SlotOptionRow
          key={index}
          option={option}
          product={availableProducts.find((p) => p.id === option.productId)}
          onUpdate={(updated) => handleUpdateOption(index, updated)}
          onRemove={() => handleRemoveOption(index)}
        />
      ))}
    </Box>
  );
};
```

---

##### **Tarea 2.1.4: Crear SlotOptionRow** ⏱️ 1h

**Archivo a crear:**

- `components/Products/TabProducts/Modal/Slots/SlotOptionRow.tsx`

**Funcionalidades:**

- Mostrar nombre del producto
- Radio button para marcar como default
- Input para costo extra
- Botón para eliminar opción

**UI sugerida:**

```
┌─────────────────────────────────────────────────────┐
│ ● Torta Chocolate    Extra: $[0___]    [🗑]         │
└─────────────────────────────────────────────────────┘
```

---

#### **Sprint 2.2: Integración en ProductCreationModal**

**Duración estimada:** 3-4 horas
**Prioridad:** 🔴 CRÍTICA

##### **Tarea 2.2.1: Modificar ProductCreationModal** ⏱️ 2-3h

**Archivo a modificar:**

- `components/Products/TabProducts/Modal/ProductCreationModal.tsx`

**Cambios:**

- Detectar cuando `type === 'promotion'`
- Mostrar `PromotionSlotsEditor` en lugar de `InputsPromo`
- Agregar estado para slots: `const [slots, setSlots] = useState<CreatePromotionSlotDto[]>([])`
- Al enviar, incluir `slots` en el body

**Estructura condicional:**

```typescript
{
  productType === 'promotion' && (
    <PromotionSlotsEditor
      slots={slots}
      onSlotsChange={setSlots}
      availableProducts={availableProductsList}
    />
  );
}
```

---

##### **Tarea 2.2.2: Actualizar envío al backend** ⏱️ 1h

**Archivo a modificar:**

- `components/Products/TabProducts/Modal/ProductCreationModal.tsx`

**Modificar función de submit:**

```typescript
const handleSubmit = async () => {
  const productData = {
    name,
    price,
    type: productType,
    categories: selectedCategories,
    // ... otros campos ...

    // NUEVO: Si es promoción, incluir slots
    ...(productType === 'promotion' && { slots }),
  };

  // Validaciones antes de enviar
  if (productType === 'promotion' && slots.length === 0) {
    alert('Una promoción debe tener al menos un slot');
    return;
  }

  // Enviar al backend
  await createProduct(productData, token);
};
```

---

#### **Sprint 2.3: API de Slots**

**Duración estimada:** 2-3 horas
**Prioridad:** 🔴 CRÍTICA

##### **Tarea 2.3.1: Crear api/promotionSlots.ts** ⏱️ 2-3h

**Archivo a crear:**

- `api/promotionSlots.ts`

**Contenido:**

```typescript
import { URI } from '@/components/URI/URI';
import {
  IPromotionSlot,
  CreatePromotionSlotDto,
  UpdatePromotionSlotDto,
  CreateSlotOptionDto,
} from '@/components/Interfaces/IPromotionSlots';

const URI_SLOTS = `${URI}/promotion-slot`;

/**
 * Obtener todos los slots de una promoción
 */
export const getPromotionSlots = async (
  promotionId: string,
  token: string
): Promise<IPromotionSlot[]> => {
  const response = await fetch(`${URI_SLOTS}/promotion/${promotionId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener slots de la promoción');
  }

  return response.json();
};

/**
 * Crear un slot
 */
export const createPromotionSlot = async (
  slotData: CreatePromotionSlotDto & { promotionId: string },
  token: string
): Promise<IPromotionSlot> => {
  const response = await fetch(URI_SLOTS, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(slotData),
  });

  if (!response.ok) {
    throw new Error('Error al crear slot');
  }

  return response.json();
};

/**
 * Actualizar un slot
 */
export const updatePromotionSlot = async (
  slotId: string,
  slotData: UpdatePromotionSlotDto,
  token: string
): Promise<IPromotionSlot> => {
  const response = await fetch(`${URI_SLOTS}/${slotId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(slotData),
  });

  if (!response.ok) {
    throw new Error('Error al actualizar slot');
  }

  return response.json();
};

/**
 * Eliminar un slot
 */
export const deletePromotionSlot = async (
  slotId: string,
  token: string
): Promise<void> => {
  const response = await fetch(`${URI_SLOTS}/${slotId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al eliminar slot');
  }
};

/**
 * Crear opción en un slot
 */
export const createSlotOption = async (
  optionData: CreateSlotOptionDto & { slotId: string },
  token: string
): Promise<void> => {
  const response = await fetch(`${URI_SLOTS}/option`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(optionData),
  });

  if (!response.ok) {
    throw new Error('Error al crear opción');
  }
};

/**
 * Eliminar opción de un slot
 */
export const deleteSlotOption = async (
  optionId: string,
  token: string
): Promise<void> => {
  const response = await fetch(`${URI_SLOTS}/option/${optionId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al eliminar opción');
  }
};

/**
 * Marcar opción como default
 */
export const setDefaultSlotOption = async (
  slotId: string,
  optionId: string,
  token: string
): Promise<void> => {
  const response = await fetch(
    `${URI_SLOTS}/${slotId}/options/${optionId}/set-default`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Error al marcar opción como default');
  }
};

/**
 * Verificar disponibilidad de stock para una opción
 */
export const checkSlotOptionStock = async (
  productId: string,
  quantity: number,
  toppingsPerUnit: string[][],
  token: string
): Promise<{ available: boolean; message?: string }> => {
  const response = await fetch(`${URI}/product/check-stock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      productId,
      quantityToSell: quantity,
      toppingsPerUnit,
    }),
  });

  if (!response.ok) {
    return { available: false, message: 'Error al verificar stock' };
  }

  return response.json();
};
```

---

### 🎯 **FASE 3: VISUALIZACIÓN EN CATÁLOGO**

**Objetivo:** Mostrar información de slots en el catálogo de productos.

---

#### **Sprint 3.1: Badge y Vista Previa**

**Duración estimada:** 4-6 horas
**Prioridad:** 🟡 ALTA

##### **Tarea 3.1.1: Modificar ProductCard** ⏱️ 2-3h

**Archivo a modificar:**

- `components/Products/TabProducts/Products.tsx` (o donde se muestren productos)

**Cambios:**

- Mostrar badge "Promoción flexible" si tiene slots
- Indicador de cantidad de opciones
- Vista previa al hover (tooltip)

**UI sugerida:**

```
┌─────────────────────────────┐
│ Combo Café + Torta          │
│ $2.500                      │
│ [🎁 Promoción Flexible]     │
│ 2 slots · 7 opciones        │
└─────────────────────────────┘
```

---

##### **Tarea 3.1.2: Crear modal de detalle** ⏱️ 2-3h

**Archivo a crear:**

- `components/Products/PromotionDetailModal.tsx`

**Funcionalidades:**

- Mostrar lista de slots
- Por cada slot, mostrar opciones disponibles
- Mostrar costos extra
- Botón para cerrar

---

### 🎯 **FASE 4: COMPONENTES DE ÓRDENES**

**Objetivo:** Permitir a los usuarios seleccionar opciones al agregar una promoción a la orden.

---

#### **Sprint 4.1: Selector de Slots en Órdenes**

**Duración estimada:** 8-10 horas
**Prioridad:** 🔴 CRÍTICA

##### **Tarea 4.1.1: Crear PromotionSlotSelector** ⏱️ 4-5h

**Archivo a crear:**

- `components/Order/PromotionSlots/PromotionSlotSelector.tsx`

**Funcionalidades:**

- Modal que se abre al seleccionar promoción con slots
- Mostrar todos los slots de la promoción
- Por cada slot, mostrar `SlotOptionPicker`
- Calcular precio total en tiempo real
- Validar que todos los slots obligatorios tengan selección
- Botones: Cancelar, Agregar al Pedido

**Estructura:**

```typescript
interface PromotionSlotSelectorProps {
  promotion: ProductResponse;
  quantity: number; // Cantidad de promociones a agregar
  onConfirm: (selections: PromotionSelectionDto[]) => void;
  onCancel: () => void;
}

export const PromotionSlotSelector: React.FC<PromotionSlotSelectorProps> = ({
  promotion,
  quantity,
  onConfirm,
  onCancel,
}) => {
  // Estado: selecciones por unidad
  const [selectionsByUnit, setSelectionsByUnit] = useState<
    Array<{ [slotId: string]: PromotionSelectionDto }>
  >([]);

  // Inicializar con opciones default
  useEffect(() => {
    const initialSelections = Array.from({ length: quantity }, () => {
      const unitSelections: { [slotId: string]: PromotionSelectionDto } = {};

      promotion.promotionSlots?.forEach((slot) => {
        const defaultOption = slot.options.find((o) => o.isDefault);
        if (defaultOption) {
          unitSelections[slot.id] = {
            slotId: slot.id,
            selectedProductId: defaultOption.productId,
          };
        }
      });

      return unitSelections;
    });

    setSelectionsByUnit(initialSelections);
  }, [promotion, quantity]);

  const handleSlotSelectionChange = (
    unitIndex: number,
    slotId: string,
    selection: PromotionSelectionDto
  ) => {
    const newSelections = [...selectionsByUnit];
    newSelections[unitIndex][slotId] = selection;
    setSelectionsByUnit(newSelections);
  };

  const handleConfirm = () => {
    // Validar que todos los slots obligatorios tengan selección
    const validation = validateSelections();
    if (!validation.valid) {
      alert(`Faltan selecciones: ${validation.missingSlots.join(', ')}`);
      return;
    }

    // Aplanar selecciones para enviar
    const flatSelections = selectionsByUnit.flatMap((unitSelections) =>
      Object.values(unitSelections)
    );

    onConfirm(flatSelections);
  };

  const validateSelections = (): PromotionValidationResult => {
    const missingSlots: string[] = [];

    promotion.promotionSlots?.forEach((slot) => {
      if (!slot.isOptional) {
        // Verificar que todas las unidades tengan selección para este slot
        selectionsByUnit.forEach((unitSelections, unitIndex) => {
          if (!unitSelections[slot.id]) {
            missingSlots.push(`${slot.name} (Unidad ${unitIndex + 1})`);
          }
        });
      }
    });

    return {
      valid: missingSlots.length === 0,
      missingSlots,
      invalidOptions: [],
      insufficientStock: [],
    };
  };

  const calculateTotalPrice = (): PromotionPriceSummary => {
    let totalExtraCost = 0;
    const extraCosts: { slotName: string; optionName: string; cost: number }[] =
      [];

    selectionsByUnit.forEach((unitSelections) => {
      Object.values(unitSelections).forEach((selection) => {
        const slot = promotion.promotionSlots?.find(
          (s) => s.id === selection.slotId
        );
        const option = slot?.options.find(
          (o) => o.productId === selection.selectedProductId
        );

        if (option && option.extraCost > 0) {
          totalExtraCost += option.extraCost;
          extraCosts.push({
            slotName: slot?.name || '',
            optionName: option.product.name,
            cost: option.extraCost,
          });
        }
      });
    });

    return {
      basePrice: promotion.price,
      extraCosts,
      totalExtraCost,
      finalPrice: promotion.price + totalExtraCost,
    };
  };

  const priceSummary = calculateTotalPrice();

  return (
    <Dialog open onClose={onCancel} maxWidth="md" fullWidth>
      <DialogTitle>
        {promotion.name}
        <IconButton
          onClick={onCancel}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Typography variant="subtitle1" gutterBottom>
          Selecciona tus opciones:
        </Typography>

        {/* Si hay múltiples unidades, mostrar tabs o acordeón */}
        {quantity > 1 && (
          <Tabs
            value={currentUnitIndex}
            onChange={(_, v) => setCurrentUnitIndex(v)}
          >
            {Array.from({ length: quantity }, (_, i) => (
              <Tab key={i} label={`Unidad ${i + 1}`} />
            ))}
          </Tabs>
        )}

        {/* Mostrar slots de la unidad actual */}
        {promotion.promotionSlots
          ?.sort((a, b) => a.displayOrder - b.displayOrder)
          .map((slot) => (
            <SlotOptionPicker
              key={slot.id}
              slot={slot}
              unitIndex={currentUnitIndex}
              selectedOptionId={
                selectionsByUnit[currentUnitIndex]?.[slot.id]?.selectedProductId
              }
              onOptionSelect={(selection) =>
                handleSlotSelectionChange(currentUnitIndex, slot.id, selection)
              }
            />
          ))}

        {/* Resumen de precio */}
        <PromotionSummary priceSummary={priceSummary} quantity={quantity} />
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleConfirm} variant="contained" color="primary">
          Agregar al Pedido
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

---

##### **Tarea 4.1.2: Crear SlotOptionPicker** ⏱️ 3-4h

**Archivo a crear:**

- `components/Order/PromotionSlots/SlotOptionPicker.tsx`

**Funcionalidades:**

- Mostrar nombre del slot
- Indicador de obligatorio/opcional
- Radio buttons para seleccionar opción
- Mostrar costo extra si aplica
- Si la opción tiene toppings, mostrar selector de toppings
- Indicador de disponibilidad de stock

**UI referencia (similar a ToppingsGroupsViewer):**

```
┌─────────────────────────────────────────────────┐
│  🍰 Torta                         Obligatorio   │
│  ───────────────────────────────────────────    │
│  ○ Torta Chocolate                              │
│  ● Torta Frutilla  ✓                           │
│  ○ Torta Premium (+$500)                        │
│                                                 │
│  [Si tiene toppings, mostrar ToppingsSelector]  │
│  ┌─────────────────────────────────────────┐   │
│  │ Agregados para Torta Frutilla:          │   │
│  │ ☑ Dulce de leche  ☑ Crema  ☐ Miel      │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Integración con toppings:**

- Reutilizar lógica de `ToppingsGroupsViewer`
- Cuando se selecciona una opción que `allowsToppings`, mostrar grupos de toppings
- Actualizar `PromotionSelectionDto.toppingsPerUnit`

---

##### **Tarea 4.1.3: Crear PromotionSummary** ⏱️ 1h

**Archivo a crear:**

- `components/Order/PromotionSlots/PromotionSummary.tsx`

**Funcionalidades:**

- Mostrar precio base
- Listar costos extra
- Mostrar total
- Formato moneda

**UI:**

```
═══════════════════════════════════════════════════
Precio base (x2):                         $5.000
Extra Cappuccino (x1):                      $200
Extra Torta Premium (x1):                   $500
───────────────────────────────────────────────────
TOTAL:                                    $5.700
```

---

#### **Sprint 4.2: Integración en OrderEditor**

**Duración estimada:** 3-4 horas
**Prioridad:** 🔴 CRÍTICA

##### **Tarea 4.2.1: Detectar promociones con slots** ⏱️ 1h

**Archivo a modificar:**

- `components/Order/OrderEditor.tsx`

**Cambios en handleSelectedProducts:**

```typescript
const handleSelectedProducts = async (product: ProductResponse) => {
  // Si es promoción con slots, abrir selector
  if (product.type === 'promotion' && product.promotionSlots?.length > 0) {
    setPromotionToSelect(product);
    setShowPromotionSlotSelector(true);
    return;
  }

  // Si es producto normal, agregar directamente (lógica existente)
  // ...
};
```

---

##### **Tarea 4.2.2: Manejar confirmación de selecciones** ⏱️ 2-3h

**Archivo a modificar:**

- `components/Order/OrderEditor.tsx`

**Agregar estados:**

```typescript
const [showPromotionSlotSelector, setShowPromotionSlotSelector] =
  useState(false);
const [promotionToSelect, setPromotionToSelect] =
  useState<ProductResponse | null>(null);
const [promotionQuantity, setPromotionQuantity] = useState(1);
```

**Handler de confirmación:**

```typescript
const handlePromotionSelectionsConfirm = (
  selections: PromotionSelectionDto[]
) => {
  if (!promotionToSelect) return;

  const productToAdd: SelectedProductsI = {
    productId: promotionToSelect.id,
    productName: promotionToSelect.name,
    quantity: promotionQuantity,
    unitaryPrice: calculatePromotionPrice(promotionToSelect, selections),
    isPromotion: true,
    promotionSlots: promotionToSelect.promotionSlots,
    promotionSelections: selections,
    internalId: generateUUID(),
  };

  setSelectedProducts([...selectedProducts, productToAdd]);
  setShowPromotionSlotSelector(false);
  setPromotionToSelect(null);
};

const calculatePromotionPrice = (
  promotion: ProductResponse,
  selections: PromotionSelectionDto[]
): string => {
  let totalExtraCost = 0;

  selections.forEach((selection) => {
    const slot = promotion.promotionSlots?.find(
      (s) => s.id === selection.slotId
    );
    const option = slot?.options.find(
      (o) => o.productId === selection.selectedProductId
    );
    if (option) {
      totalExtraCost += option.extraCost;
    }
  });

  return (promotion.price + totalExtraCost).toString();
};
```

**Renderizar modal:**

```typescript
{
  showPromotionSlotSelector && promotionToSelect && (
    <PromotionSlotSelector
      promotion={promotionToSelect}
      quantity={promotionQuantity}
      onConfirm={handlePromotionSelectionsConfirm}
      onCancel={() => setShowPromotionSlotSelector(false)}
    />
  );
}
```

---

#### **Sprint 4.3: Visualización en Lista de Productos**

**Duración estimada:** 4-5 horas
**Prioridad:** 🟡 ALTA

##### **Tarea 4.3.1: Mostrar selecciones en lista** ⏱️ 3-4h

**Archivo a modificar:**

- `components/Order/OrderEditor.tsx` (o componente de lista de productos)

**UI propuesta:**

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

**Componente de visualización:**

```typescript
const PromotionSelectionsView: React.FC<{
  product: SelectedProductsI;
}> = ({ product }) => {
  if (!product.isPromotion || !product.promotionSelections) {
    return null;
  }

  // Agrupar selecciones por unidad
  const selectionsPerUnit = groupSelectionsByUnit(
    product.promotionSelections,
    product.quantity
  );

  return (
    <Box pl={3}>
      {selectionsPerUnit.map((unitSelections, unitIndex) => (
        <Box key={unitIndex} mb={1}>
          <Typography variant="caption" color="textSecondary">
            Unidad {unitIndex + 1}:
          </Typography>
          {unitSelections.map((selection) => {
            const slot = product.promotionSlots?.find(
              (s) => s.id === selection.slotId
            );
            const option = slot?.options.find(
              (o) => o.productId === selection.selectedProductId
            );

            return (
              <Box key={selection.slotId} pl={2}>
                <Typography variant="body2">
                  └─ {slot?.name}: {option?.product.name}
                  {option?.extraCost > 0 && ` (+$${option.extraCost})`}
                </Typography>

                {/* Si tiene toppings, mostrarlos */}
                {selection.toppingsPerUnit && (
                  <Typography variant="caption" color="textSecondary">
                    + {formatToppings(selection.toppingsPerUnit)}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
};
```

---

##### **Tarea 4.3.2: Botón para editar selecciones** ⏱️ 1h

**Archivo a modificar:**

- `components/Order/OrderEditor.tsx`

**Funcionalidad:**

- Botón "Editar selecciones"
- Abre `PromotionSlotSelector` con selecciones actuales pre-cargadas
- Permite modificar y guardar cambios

---

### 🎯 **FASE 5: CONTEXT Y ESTADO**

**Objetivo:** Centralizar manejo de estado de promociones con slots.

---

#### **Sprint 5.1: Actualizar OrderContext**

**Duración estimada:** 3-4 horas
**Prioridad:** 🟡 ALTA

##### **Tarea 5.1.1: Agregar estado para selecciones** ⏱️ 2-3h

**Archivo a modificar:**

- `app/context/order.context.tsx`

**Agregar estado:**

```typescript
const [promotionSelectionsByProduct, setPromotionSelectionsByProduct] =
  useState<{
    [internalId: string]: PromotionSelectionDto[];
  }>({});
```

**Agregar funciones:**

```typescript
const updatePromotionSelections = (
  internalId: string,
  selections: PromotionSelectionDto[]
) => {
  setPromotionSelectionsByProduct((prev) => ({
    ...prev,
    [internalId]: selections,
  }));
};

const validatePromotionSelections = (
  product: SelectedProductsI
): PromotionValidationResult => {
  if (!product.isPromotion || !product.promotionSlots) {
    return {
      valid: true,
      missingSlots: [],
      invalidOptions: [],
      insufficientStock: [],
    };
  }

  const selections = product.promotionSelections || [];
  const missingSlots: string[] = [];

  product.promotionSlots.forEach((slot) => {
    if (!slot.isOptional) {
      const hasSelection = selections.some((s) => s.slotId === slot.id);
      if (!hasSelection) {
        missingSlots.push(slot.name);
      }
    }
  });

  return {
    valid: missingSlots.length === 0,
    missingSlots,
    invalidOptions: [],
    insufficientStock: [],
  };
};
```

**Exportar en contexto:**

```typescript
type OrderContextType = {
  // ... existentes ...

  // NUEVAS
  promotionSelectionsByProduct: {
    [internalId: string]: PromotionSelectionDto[];
  };
  updatePromotionSelections: (
    internalId: string,
    selections: PromotionSelectionDto[]
  ) => void;
  validatePromotionSelections: (
    product: SelectedProductsI
  ) => PromotionValidationResult;
};
```

---

##### **Tarea 5.1.2: Integrar validación en confirmarPedido** ⏱️ 1h

**Archivo a modificar:**

- `components/Order/OrderEditor.tsx`

**Modificar función confirmarPedido:**

```typescript
const confirmarPedido = async () => {
  // Validar promociones
  for (const product of selectedProducts) {
    if (product.isPromotion) {
      const validation = validatePromotionSelections(product);
      if (!validation.valid) {
        alert(
          `Faltan selecciones en ${
            product.productName
          }: ${validation.missingSlots.join(', ')}`
        );
        return;
      }
    }
  }

  // Construir productDetails
  const productDetails = selectedProducts.map((product) => {
    const baseDetail = {
      productId: product.productId,
      quantity: product.quantity,
      toppingsPerUnit: selectedToppingsByProduct[product.productId] ?? [],
      commentOfProduct: commentInputs[product.productId],
    };

    // Si es promoción, incluir selecciones de slots
    if (product.isPromotion && product.promotionSelections) {
      return {
        ...baseDetail,
        promotionSelections: product.promotionSelections,
      };
    }

    return baseDetail;
  });

  // ... resto de la función (enviar al backend) ...
};
```

---

### 🎯 **FASE 6: VALIDACIÓN DE STOCK EN TIEMPO REAL**

**Objetivo:** Verificar disponibilidad de opciones antes de confirmar orden.

---

#### **Sprint 6.1: Chequeo de Stock**

**Duración estimada:** 4-5 horas
**Prioridad:** 🟡 MEDIA

##### **Tarea 6.1.1: Verificar stock al seleccionar opción** ⏱️ 2-3h

**Archivo a modificar:**

- `components/Order/PromotionSlots/SlotOptionPicker.tsx`

**Funcionalidad:**

- Al seleccionar una opción, llamar a `checkSlotOptionStock()`
- Mostrar indicador de disponibilidad
- Deshabilitar opciones sin stock suficiente

**Código:**

```typescript
const [stockByOption, setStockByOption] = useState<{
  [productId: string]: { available: boolean; message?: string };
}>({});

useEffect(() => {
  // Verificar stock de cada opción
  slot.options.forEach(async (option) => {
    const stockCheck = await checkSlotOptionStock(
      option.productId,
      slot.quantity * quantityOfPromotions,
      [], // toppings vacío por ahora
      token
    );

    setStockByOption((prev) => ({
      ...prev,
      [option.productId]: stockCheck,
    }));
  });
}, [slot, quantityOfPromotions]);

// En el render, mostrar indicador
{
  !stockByOption[option.productId]?.available && (
    <Chip label="Sin stock" color="error" size="small" />
  );
}
```

---

##### **Tarea 6.1.2: Validar stock antes de confirmar orden** ⏱️ 2h

**Archivo a modificar:**

- `components/Order/OrderEditor.tsx`

**Agregar validación en confirmarPedido:**

```typescript
// Verificar stock de promociones
for (const product of selectedProducts) {
  if (product.isPromotion && product.promotionSelections) {
    // Llamar a API de validación de stock
    const stockValidation = await validatePromotionStock(
      product.productId,
      product.quantity,
      product.promotionSelections
    );

    if (!stockValidation.available) {
      alert(
        `Stock insuficiente: ${stockValidation.insufficientItems.join(', ')}`
      );
      return;
    }
  }
}
```

---

## 💡 **MEJORAS Y FUNCIONALIDADES FUTURAS**

### **Mejora 1: Caché de Opciones Disponibles**

**Objetivo:** Reducir llamadas a la API.

**Estrategia:**

- Usar `useMemo` y `useCallback` para cachear datos
- Implementar cache de productos con TTL
- Usar React Query para manejo de cache automático

**Estimación:** 3-4 horas
**Prioridad:** 🟡 MEDIA

**Archivos a modificar:**

- `components/Order/PromotionSlots/PromotionSlotSelector.tsx`
- Crear hook `usePromotionSlots` con caching

---

### **Mejora 2: WebSocket para Stock en Tiempo Real**

**Objetivo:** Actualizar disponibilidad automáticamente.

**Estrategia:**

- Extender servicio WebSocket existente (`services/websocket.service.ts`)
- Escuchar evento `stock.updated`
- Actualizar estado de disponibilidad de opciones
- Mostrar notificación si una opción seleccionada se queda sin stock

**Estimación:** 4-5 horas
**Prioridad:** 🟡 MEDIA

**Código ejemplo:**

```typescript
useEffect(() => {
  const handleStockUpdate = (data: any) => {
    // Si el producto actualizado es una opción de un slot, actualizar estado
    if (slot.options.some((o) => o.productId === data.productId)) {
      recheckStockAvailability();
    }
  };

  socketService.on('stock.updated', handleStockUpdate);
  return () => socketService.off('stock.updated', handleStockUpdate);
}, [slot]);
```

---

### **Mejora 3: Drag & Drop para Reordenar Slots**

**Objetivo:** UX mejorada para administradores.

**Estrategia:**

- Usar librería `react-beautiful-dnd` o `dnd-kit`
- Permitir arrastrar slots para reordenar
- Actualizar `displayOrder` automáticamente

**Estimación:** 3-4 horas
**Prioridad:** 🟢 BAJA

---

### **Mejora 4: Historial de Selecciones Populares**

**Objetivo:** Sugerencias basadas en órdenes anteriores.

**Funcionalidad:**

- Trackear combinaciones más pedidas
- Mostrar badge "Popular" en opciones frecuentes
- Pre-seleccionar combinación más común como sugerencia

**Estimación:** 6-8 horas
**Prioridad:** 🟢 BAJA

---

### **Mejora 5: Modo de Selección Rápida**

**Objetivo:** Acelerar órdenes repetitivas.

**Funcionalidad:**

- Botón "Usar selecciones por defecto"
- Guardar "favoritos" de selecciones por cliente
- One-click para agregar promoción con selecciones predefinidas

**Estimación:** 5-6 horas
**Prioridad:** 🟢 BAJA

---

### **Mejora 6: Exportación de Configuración de Promociones**

**Objetivo:** Backup y migración de promociones.

**Funcionalidad:**

- Exportar promoción con slots a JSON
- Importar configuración de promoción
- Duplicar promoción existente

**Estimación:** 4-5 horas
**Prioridad:** 🟢 BAJA

---

## 📊 **RESUMEN DE TIEMPOS**

| Fase                           | Sprints        | Horas Estimadas | Prioridad              |
| ------------------------------ | -------------- | --------------- | ---------------------- |
| **Fase 1: Interfaces y Tipos** | 1 sprint       | 2-3h            | 🔴 CRÍTICA             |
| **Fase 2: Admin**              | 3 sprints      | 13-17h          | 🔴 CRÍTICA             |
| **Fase 3: Catálogo**           | 1 sprint       | 4-6h            | 🟡 ALTA                |
| **Fase 4: Órdenes**            | 3 sprints      | 15-19h          | 🔴 CRÍTICA             |
| **Fase 5: Context**            | 1 sprint       | 3-4h            | 🟡 ALTA                |
| **Fase 6: Stock**              | 1 sprint       | 4-5h            | 🟡 MEDIA               |
| **Mejoras Futuras**            | -              | 25-32h          | 🟢 OPCIONAL            |
| **TOTAL**                      | **10 sprints** | **41-54h**      | **66-86h con mejoras** |

---

## 🎯 **ORDEN DE EJECUCIÓN RECOMENDADO**

### **Semana 1: Fundamentos**

1. Sprint 1.1: Interfaces (2-3h)
2. Sprint 2.1: Editor de Slots (8-10h)
3. Sprint 2.2: Integración Modal (3-4h)
4. **Total:** 13-17h

### **Semana 2: Órdenes**

5. Sprint 2.3: API (2-3h)
6. Sprint 4.1: Selector de Slots (8-10h)
7. Sprint 4.2: Integración OrderEditor (3-4h)
8. **Total:** 13-17h

### **Semana 3: Completitud**

9. Sprint 3.1: Catálogo (4-6h)
10. Sprint 4.3: Visualización (4-5h)
11. Sprint 5.1: Context (3-4h)
12. Sprint 6.1: Stock (4-5h)
13. **Total:** 15-20h

### **Post-Lanzamiento:**

- Mejoras según necesidad (25-32h)

---

## 📝 **ARCHIVOS CREADOS Y MODIFICADOS**

### **Nuevos Archivos a Crear:**

| Archivo                                                                | Descripción               |
| ---------------------------------------------------------------------- | ------------------------- |
| `components/Interfaces/IPromotionSlots.ts`                             | Interfaces TypeScript     |
| `components/Products/TabProducts/Modal/Slots/PromotionSlotsEditor.tsx` | Editor principal de slots |
| `components/Products/TabProducts/Modal/Slots/SlotCard.tsx`             | Card de slot individual   |
| `components/Products/TabProducts/Modal/Slots/SlotOptionsEditor.tsx`    | Editor de opciones        |
| `components/Products/TabProducts/Modal/Slots/SlotOptionRow.tsx`        | Fila de opción            |
| `components/Order/PromotionSlots/PromotionSlotSelector.tsx`            | Modal selector de slots   |
| `components/Order/PromotionSlots/SlotOptionPicker.tsx`                 | Picker de opciones        |
| `components/Order/PromotionSlots/PromotionSummary.tsx`                 | Resumen de selección      |
| `components/Products/PromotionDetailModal.tsx`                         | Detalle de promoción      |
| `api/promotionSlots.ts`                                                | Funciones de API          |

### **Archivos a Modificar:**

| Archivo                                                          | Modificación                             |
| ---------------------------------------------------------------- | ---------------------------------------- |
| `components/Interfaces/IProducts.ts`                             | Agregar campos de slots                  |
| `components/Products/TabProducts/Modal/ProductCreationModal.tsx` | Integrar editor de slots                 |
| `components/Products/TabProducts/Products.tsx`                   | Badge y vista previa                     |
| `components/Order/OrderEditor.tsx`                               | Detectar y manejar promociones con slots |
| `app/context/order.context.tsx`                                  | Estado y funciones para selecciones      |

---

## 📋 **NOTAS IMPORTANTES**

### **Decisiones Tomadas:**

1. ✅ **Reutilizar patrón de ToppingsGroupsViewer** - Arquitectura probada y familiar
2. ✅ **Tabs para múltiples unidades** - Si cantidad > 1, mostrar tabs para cada unidad
3. ✅ **Validación en múltiples niveles** - Client-side + backend
4. ✅ **Límite de 10 opciones** - Validación en UI y backend

### **Compatibilidad:**

- Detectar si promoción tiene `promotionSlots`
- Si no tiene slots, usar flujo legacy (agregar directo)
- Transición gradual sin romper funcionalidad existente

### **UX/UI:**

- Diseño responsive (desktop y mobile)
- Feedback visual claro de selecciones
- Indicadores de stock en tiempo real
- Precios actualizados dinámicamente

### **Testing:**

- Cada componente debe ser testeable
- Tests E2E al finalizar cada fase
- Casos edge:
  - Promoción con 1 slot vs múltiples slots
  - Slots opcionales vs obligatorios
  - Múltiples unidades con diferentes selecciones
  - Productos con toppings en slots
  - Cambio de stock durante selección

---

**Versión:** v01
**Fecha:** Diciembre 2025
**Última actualización:** 19/12/2025
