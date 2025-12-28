# Orders - Archivos Bruno para Gestión de Pedidos

Esta carpeta contiene los archivos Bruno para crear y actualizar pedidos, incluyendo soporte para promociones con slots.

## 📋 Archivos Disponibles

### 1. **Get Promotion Slots (Helper).bru** (seq: 1)
**Propósito:** Obtener los slots disponibles de una promoción y guardar automáticamente los IDs necesarios.

**Variables requeridas:**
- `{{promotionId}}` - ID de la promoción

**Variables que guarda automáticamente:**
- `{{slotId1}}`, `{{slotId2}}`, etc. - IDs de los slots encontrados
- `{{selectedProductId1}}`, `{{selectedProductId2}}`, etc. - IDs de productos (primera opción de cada slot)

**Uso:** Ejecutar antes de crear/actualizar una orden con promoción para obtener los IDs necesarios.

---

### 2. **Create Order.bru** (seq: 2)
**Propósito:** Crear una nueva orden (pedido) asociada a una mesa.

**Variables requeridas:**
- `{{tableId}}` - ID de una mesa disponible
- `{{authToken}}` - Token de autenticación

**Variables que guarda automáticamente:**
- `{{orderId}}` - ID de la orden creada

**Body de ejemplo:**
```json
{
  "tableId": "uuid-de-mesa",
  "numberCustomers": 2,
  "comment": "Pedido con promoción y slots"
}
```

---

### 3. **Update Order - Add Promotion with Slots.bru** (seq: 3)
**Propósito:** Agregar una promoción con slots seleccionados a una orden existente.

**Variables requeridas:**
- `{{orderId}}` - ID de la orden (se guarda al crear)
- `{{promotionId}}` - ID de la promoción
- `{{slotId1}}`, `{{slotId2}}` - IDs de los slots
- `{{selectedProductId1}}`, `{{selectedProductId2}}` - IDs de productos seleccionados
- `{{toppingId1}}`, `{{toppingId2}}` - IDs de toppings (opcional)

**Ejemplo de uso:**
Agrega una promoción con 2 slots, donde:
- Slot 1: Selecciona un producto sin toppings
- Slot 2: Selecciona un producto con 2 toppings

---

### 4. **Update Order - Simple Promotion.bru** (seq: 5)
**Propósito:** Versión simplificada para agregar una promoción con un solo slot.

**Variables requeridas:**
- `{{orderId}}` - ID de la orden
- `{{promotionId}}` - ID de la promoción
- `{{slotId1}}` - ID del slot
- `{{selectedProductId1}}` - ID del producto seleccionado

**Uso:** Ideal para promociones con un solo slot o para pruebas rápidas.

---

### 5. **Update Order - Complete Example.bru** (seq: 4)
**Propósito:** Ejemplo completo que incluye múltiples productos (simples y promociones) con toppings.

**Variables requeridas:**
- `{{orderId}}` - ID de la orden
- `{{simpleProductId}}` - ID de un producto simple
- `{{promotionId}}` - ID de la promoción
- `{{slotId1}}`, `{{slotId2}}` - IDs de los slots
- `{{selectedProductId1}}`, `{{selectedProductId2}}` - IDs de productos seleccionados
- `{{toppingId1}}`, `{{toppingId2}}`, `{{toppingId3}}` - IDs de toppings

**Ejemplo de uso:**
Agrega a la orden:
- 2 unidades de un producto simple con toppings diferentes por unidad
- 1 promoción con 2 slots seleccionados, uno con toppings

---

## 🚀 Orden de Ejecución Recomendado

### Flujo Básico:
1. **Log in** (desde carpeta Register) → Obtener `{{authToken}}`
2. **Get Promotion Slots (Helper)** → Obtener `{{slotId1}}`, `{{slotId2}}`, `{{selectedProductId1}}`, `{{selectedProductId2}}`
3. **Create Order** → Crear orden y guardar `{{orderId}}`
4. **Update Order - Add Promotion with Slots** → Agregar promoción con selecciones

### Flujo Completo:
1. **Log in** → Obtener `{{authToken}}`
2. **Get Promotion Slots (Helper)** → Obtener IDs de slots y opciones
3. **Create Order** → Crear orden base
4. **Update Order - Complete Example** → Agregar múltiples productos con toppings

---

## 📝 Estructura de `promotionSelections`

Cada selección de promoción tiene la siguiente estructura:

```json
{
  "slotId": "uuid-del-slot",
  "selectedProductId": "uuid-del-producto-seleccionado",
  "toppingsPerUnit": [
    ["topping-id-1", "topping-id-2"],  // Toppings para unidad 1
    ["topping-id-3"]                    // Toppings para unidad 2
  ]
}
```

**Notas importantes:**
- `slotId`: Debe corresponder a un slot activo de la promoción
- `selectedProductId`: Debe ser una opción válida del slot
- `toppingsPerUnit`: Array de arrays, donde cada array interno representa los toppings de una unidad
- Si el slot es obligatorio (`isOptional: false`), debe incluirse una selección
- Si el slot es opcional, puede omitirse la selección

---

## 🔧 Configuración de Variables

Asegúrate de tener configuradas estas variables en `environments/HyG.bru`:

```bru
vars {
  authToken: tu-token-jwt
  tableId: uuid-de-mesa-disponible
  promotionId: uuid-de-promocion-con-slots
  slotId1: se-guarda-automaticamente
  slotId2: se-guarda-automaticamente
  selectedProductId1: se-guarda-automaticamente
  selectedProductId2: se-guarda-automaticamente
  simpleProductId: uuid-producto-simple
  toppingId1: uuid-topping-1
  toppingId2: uuid-topping-2
  toppingId3: uuid-topping-3
  orderId: se-guarda-automaticamente
}
```

---

## 💡 Tips

1. **Variables automáticas:** Los scripts `post-response` y `get-response` guardan automáticamente los IDs necesarios
2. **Consola de Bruno:** Revisa la consola para ver información detallada de las respuestas
3. **Validación:** Si un slot es obligatorio y no se envía selección, la API retornará error 400
4. **Toppings:** Los toppings se aplican por unidad, por eso `toppingsPerUnit` es un array de arrays
5. **Múltiples promociones:** Puedes agregar múltiples promociones en un solo `updateOrder` usando diferentes objetos en `productsDetails`

---

## ⚠️ Errores Comunes

- **"Slot is required and has no selection"**: Un slot obligatorio no tiene selección
- **"Product selected is not a valid option"**: El `selectedProductId` no es una opción válida del slot
- **"Promotion has no active slots configured"**: La promoción no tiene slots activos
- **"Table not available"**: La mesa ya tiene una orden activa

---

## 📚 Referencias

- Ver `backend/src/DTOs/order-details.dto.ts` para la estructura completa de `PromotionSelectionDto`
- Ver `backend/src/Order/services/order.service.ts` para la lógica de procesamiento
- Ver `backend/src/Stock/stock.service.ts` para la deducción de stock con slots

