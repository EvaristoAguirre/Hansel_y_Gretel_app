# Guía de Pruebas - Promotion Slots

## 🔄 Orden de Ejecución para Base de Datos Vacía

### Método 1: Crear Promoción con Slots en una Transacción (Recomendado)

Ejecutar en este orden:

1. **Log in** (`../Register/Log in.bru`)
   - Obtiene el token de autenticación
   - Guarda en variable `{{authToken}}`

2. **Setup - Create Category**
   - Crea una categoría para las promociones
   - Guarda `{{categoryId}}`

3. **Setup - Create Simple Product 1** (Café con Leche)
   - Crea producto simple para usar como opción
   - Guarda `{{productId1}}`

4. **Setup - Create Simple Product 2** (Cappuccino)
   - Crea producto simple para usar como opción
   - Guarda `{{productId2}}`

5. **Setup - Create Simple Product 3** (Torta de Chocolate)
   - Crea producto simple para usar como opción
   - Guarda `{{productId3}}`

6. **Setup - Create Simple Product 4** (Torta Premium)
   - Crea producto simple para usar como opción
   - Guarda `{{productId4}}`

7. **Create Promotion with Slots**
   - Crea la promoción completa con todos los slots y opciones en una sola transacción
   - Guarda `{{promotionId}}`

---

### Método 2: Crear Paso a Paso (Para Testing Individual)

Si quieres probar cada endpoint por separado:

1. **Log in** (`../Register/Log in.bru`)

2. **Setup - Create Category**

3. **Setup - Create Simple Product 1-4** (todos los productos)

4. **Alternative - Create Promotion (Simple)**
   - Crea una promoción básica sin slots
   - Guarda `{{promotionId}}`

5. **Create Prom-Slot**
   - Crea un slot individual en la promoción
   - Guarda `{{slotId}}`

6. **Create Slot Option** (ejecutar múltiples veces si es necesario)
   - Crea una opción en el slot
   - Necesitas actualizar `{{productId1}}` en el body para cada opción

---

## 📋 Variables Utilizadas

Las siguientes variables se guardan automáticamente y se pueden usar en otras peticiones:

- `{{authToken}}` - Token JWT (se obtiene del login)
- `{{categoryId}}` - ID de la categoría creada
- `{{productId1}}` - ID del primer producto (Café con Leche)
- `{{productId2}}` - ID del segundo producto (Cappuccino)
- `{{productId3}}` - ID del tercer producto (Torta de Chocolate)
- `{{productId4}}` - ID del cuarto producto (Torta Premium)
- `{{promotionId}}` - ID de la promoción creada
- `{{slotId}}` - ID del slot creado

---

## ⚠️ Notas Importantes

1. **Base de datos vacía**: Los archivos de "Setup" son necesarios para crear los datos base (categorías y productos) que se usan como opciones en los slots.

2. **Validaciones**:
   - Cada slot debe tener al menos 1 opción
   - Cada slot debe tener exactamente 1 opción marcada como `isDefault: true`
   - Máximo 10 opciones por slot
   - Los `productId` deben ser productos simples o compuestos, NO promociones
   - Todos los productos deben existir y estar activos

3. **Método recomendado**: Usar "Create Promotion with Slots" ya que crea todo en una única transacción, garantizando la integridad de los datos.

4. **Roles requeridos**: Todos los endpoints requieren rol `ADMIN` o `ENCARGADO`.

---

## 🧪 Ejemplos de Pruebas

### Ejemplo 1: Promoción simple con 2 slots
- Slot 1: Bebida (2 opciones)
- Slot 2: Torta (2 opciones)

### Ejemplo 2: Promoción con slot opcional
- Slot 1: Bebida (obligatorio, 3 opciones)
- Slot 2: Acompañamiento (opcional, 2 opciones)

### Ejemplo 3: Promoción con costo extra
- Slot 1: Bebida básica (sin costo extra)
- Slot 2: Torta premium (con costo extra de $500)

