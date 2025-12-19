# Plan de Trabajo - Backend - Sistema de Promociones con Slots v01

## 📊 Estado Actual del Proyecto

### ✅ Implementaciones Completadas

#### **Entidades y Estructura Base:**

- ✅ **Entidad `PromotionSlot`** (`src/Product/entities/promotion-slot.entity.ts`)
  - Campos: name, description, quantity, displayOrder, isOptional, isActive
  - Timestamps: createdAt, updatedAt, deletedAt (soft delete)
  - Relación con Product (promotion)
  - Relación con PromotionSlotOption (options)

- ✅ **Entidad `PromotionSlotOption`** (`src/Product/entities/promotion-slot-option.entity.ts`)
  - Campos: isDefault, extraCost, isActive, displayOrder
  - Relación con PromotionSlot (slot)
  - Relación con Product (product seleccionable)

- ✅ **Entidad `OrderPromotionSelection`** (`src/Order/entities/order-promotion-selection.entity.ts`)
  - Guarda selecciones del cliente en órdenes
  - Campos: slotId, selectedProductId, extraCostApplied
  - Relación con OrderDetails

- ✅ **Relaciones en Entidades Principales:**
  - `Product.promotionSlots: PromotionSlot[]`
  - `OrderDetails.promotionSelections: OrderPromotionSelection[]`

#### **DTOs Implementados:**

- ✅ `CreatePromotionSlotDto` (`src/Product/dtos/create-promotion-slot.dto.ts`)
- ✅ `UpdatePromotionSlotDto` (`src/Product/dtos/update-promotion-slot.dto.ts`)
- ✅ `PromotionSelectionDto` (`src/Product/dtos/promotion-selection.dto.ts`)
- ✅ `OrderDetailsDto.promotionSelections` (`src/DTOs/order-details.dto.ts`)

#### **Servicios y Repositorios:**

- ✅ **`PromotionSlotService`** (`src/Product/services/promotion-slot-service.ts`)
  - CRUD completo: create, findAll, findById, findByPromotionId, update, delete, restore
  - Validaciones de negocio
  - Manejo de transacciones
  - Soft delete

- ✅ **`PromotionSlotRepository`** (`src/Product/repositories/promotion-slot.repository.ts`)
  - Operaciones de base de datos
  - Soporte para transacciones con QueryRunner
  - Paginación y filtros

- ✅ **`PromotionSlotController`** (`src/Product/controllers/promotion-slot.controller.ts`)
  - Endpoints REST completos
  - Guards de autorización por rol
  - Validación de inputs

#### **Módulos:**

- ✅ **`ProductModule`** - Registra entidades, servicios y controladores de slots
- ✅ **Exportación de servicios** - `PromotionSlotService` disponible para otros módulos

#### **Procesamiento Parcial en Órdenes:**

- ✅ **Cálculo de costos extra** - En `OrderService.updateOrder()` (líneas 153-170)
- ✅ **Guardado de selecciones** - En `OrderService.updateOrder()` (líneas 183-204)
- ⚠️ **Deducción de stock** - Existe pero NO usa las selecciones (línea 207-211)

---

## 🔴 Tareas Pendientes

### 🎯 **FASE 1: MÓDULO DE PRODUCTOS Y PROMOCIONES FUNCIONAL**

**Objetivo:** Permitir crear, editar y gestionar promociones con slots completamente funcionales.

---

#### **Sprint 1.1: CRUD Completo de Opciones de Slots**

**Duración estimada:** 8-10 horas
**Prioridad:** 🔴 CRÍTICA

##### **Tarea 1.1.1: Crear DTOs para PromotionSlotOption** ⏱️ 1-2h

**Archivos a crear:**

- `src/Product/dtos/create-slot-option.dto.ts`
- `src/Product/dtos/update-slot-option.dto.ts`

**Contenido de `create-slot-option.dto.ts`:**

```typescript
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateSlotOptionDto {
  @IsUUID()
  @IsNotEmpty()
  slotId: string;

  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsBoolean()
  @IsNotEmpty()
  isDefault: boolean;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  extraCost: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  displayOrder: number;
}
```

**Validaciones necesarias:**

- `productId` debe existir y estar activo
- `productId` NO puede ser una promoción (evitar recursión)
- `slotId` debe existir
- `extraCost` no puede ser negativo
- `displayOrder` no puede ser negativo

---

##### **Tarea 1.1.2: Extender PromotionSlotService con métodos para opciones** ⏱️ 4-5h

**Archivo a modificar:**

- `src/Product/services/promotion-slot-service.ts`

**Métodos a implementar:**

1. **`createOption(createDto: CreateSlotOptionDto): Promise<PromotionSlotOption>`**
   - Validar que `slotId` exista
   - Validar que `productId` exista y no sea promoción
   - Si `isDefault === true`, desmarcar otras opciones default del mismo slot
   - Crear opción en transacción
   - Retornar opción creada con relaciones

2. **`updateOption(optionId: string, updateDto: UpdateSlotOptionDto): Promise<PromotionSlotOption>`**
   - Validar que opción exista
   - Si cambia `isDefault` a true, desmarcar otras
   - Actualizar en transacción

3. **`deleteOption(optionId: string): Promise<{ message: string }>`**
   - Soft delete de la opción
   - Validar que quede al menos una opción activa en el slot
   - Si era default, marcar otra como default automáticamente

4. **`reorderOptions(slotId: string, orderArray: string[]): Promise<void>`**
   - Recibir array de IDs en el orden deseado
   - Actualizar `displayOrder` de cada opción
   - Ejecutar en transacción

5. **`setDefaultOption(slotId: string, optionId: string): Promise<PromotionSlotOption>`**
   - Desmarcar todas las opciones del slot
   - Marcar la opción especificada como default
   - Ejecutar en transacción

**Validaciones de negocio:**

- Un slot debe tener al menos 1 opción activa en todo momento
- Solo puede haber 1 opción marcada como default por slot
- Los productos en opciones no pueden ser promociones
- Los productos en opciones deben estar activos

---

##### **Tarea 1.1.3: Extender PromotionSlotController** ⏱️ 2h

**Archivo a modificar:**

- `src/Product/controllers/promotion-slot.controller.ts`

**Endpoints a agregar:**

```typescript
// Crear opción en un slot
@Post('option')
@Roles(UserRole.ADMIN, UserRole.ENCARGADO)
async createSlotOption(@Body() createData: CreateSlotOptionDto)

// Actualizar opción
@Patch('option/:optionId')
@Roles(UserRole.ADMIN, UserRole.ENCARGADO)
async updateSlotOption(@Param('optionId') optionId: string, @Body() updateData: UpdateSlotOptionDto)

// Eliminar opción
@Delete('option/:optionId')
@Roles(UserRole.ADMIN, UserRole.ENCARGADO)
async deleteSlotOption(@Param('optionId') optionId: string)

// Reordenar opciones de un slot
@Patch(':slotId/options/reorder')
@Roles(UserRole.ADMIN, UserRole.ENCARGADO)
async reorderSlotOptions(@Param('slotId') slotId: string, @Body() body: { orderArray: string[] })

// Marcar opción como default
@Patch(':slotId/options/:optionId/set-default')
@Roles(UserRole.ADMIN, UserRole.ENCARGADO)
async setDefaultOption(@Param('slotId') slotId: string, @Param('optionId') optionId: string)
```

---

##### **Tarea 1.1.4: Tests Unitarios** ⏱️ 1-2h

**Archivos a crear:**

- `src/Product/services/promotion-slot-service.spec.ts` (extender)

**Tests necesarios:**

- ✅ Crear opción correctamente
- ✅ No permite crear opción con producto promoción
- ✅ Solo una opción puede ser default
- ✅ No permite eliminar última opción activa del slot
- ✅ Reordenar actualiza displayOrder correctamente

---

#### **Sprint 1.2: Creación de Promociones con Slots en Una Transacción**

**Duración estimada:** 6-8 horas
**Prioridad:** 🔴 CRÍTICA

##### **Tarea 1.2.1: Modificar CreateProductDto** ⏱️ 1h

**Archivo a modificar:**

- `src/DTOs/create-product.dto.ts`

**Cambios:**

```typescript
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';

export class CreateProductDto {
  // ... campos existentes ...

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePromotionSlotWithOptionsDto)
  slots?: CreatePromotionSlotWithOptionsDto[];
}
```

---

##### **Tarea 1.2.2: Crear DTO anidado para slots con opciones** ⏱️ 1h

**Archivo a crear:**

- `src/Product/dtos/create-promotion-slot-with-options.dto.ts`

```typescript
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  ValidateNested,
} from 'class-validator';
import { CreateSlotOptionDto } from './create-slot-option.dto';

export class CreateSlotOptionForCreationDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsBoolean()
  @IsNotEmpty()
  isDefault: boolean;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  extraCost: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  displayOrder: number;
}

export class CreatePromotionSlotWithOptionsDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  displayOrder: number;

  @IsBoolean()
  @IsNotEmpty()
  isOptional: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSlotOptionForCreationDto)
  @Max(10, { each: true, message: 'Un slot no puede tener más de 10 opciones' })
  options: CreateSlotOptionForCreationDto[];
}
```

---

##### **Tarea 1.2.3: Modificar ProductService.createProduct()** ⏱️ 4-5h

**Archivo a modificar:**

- `src/Product/services/product.service.ts`

**Lógica a implementar:**

```typescript
async createProduct(productToCreate: CreateProductDto): Promise<ProductResponseDto> {
  // Si es promoción Y tiene slots, crear todo en una transacción
  if (productToCreate.type === 'promotion' && productToCreate.slots?.length > 0) {
    return await this.createPromotionWithSlots(productToCreate);
  }

  // Si no, usar método actual
  const productCreated = await this.productRepository.createProduct(productToCreate);
  this.eventEmitter.emit('product.created', { product: productCreated });
  return productCreated;
}

private async createPromotionWithSlots(productData: CreateProductDto): Promise<ProductResponseDto> {
  const queryRunner = this.productRepository.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 1. Crear el producto (promoción)
    const product = await this.productRepository.createProductInTransaction(productData, queryRunner);

    // 2. Por cada slot
    for (const slotData of productData.slots) {
      // Validar que tenga al menos 1 opción
      if (!slotData.options || slotData.options.length === 0) {
        throw new BadRequestException(`Slot "${slotData.name}" debe tener al menos una opción`);
      }

      // Validar límite de opciones
      if (slotData.options.length > 10) {
        throw new BadRequestException(`Slot "${slotData.name}" no puede tener más de 10 opciones`);
      }

      // Validar que haya exactamente una opción default
      const defaultCount = slotData.options.filter(o => o.isDefault).length;
      if (defaultCount !== 1) {
        throw new BadRequestException(`Slot "${slotData.name}" debe tener exactamente una opción marcada como default`);
      }

      // Crear el slot
      const slot = await queryRunner.manager.create(PromotionSlot, {
        promotionId: product.id,
        name: slotData.name,
        description: slotData.description,
        quantity: slotData.quantity,
        displayOrder: slotData.displayOrder,
        isOptional: slotData.isOptional,
        isActive: true,
      });
      await queryRunner.manager.save(PromotionSlot, slot);

      // 3. Por cada opción del slot
      for (const optionData of slotData.options) {
        // Validar que el producto exista
        const optionProduct = await queryRunner.manager.findOne(Product, {
          where: { id: optionData.productId, isActive: true },
        });

        if (!optionProduct) {
          throw new NotFoundException(`Product ${optionData.productId} not found for slot option`);
        }

        // Validar que el producto NO sea promoción (evitar recursión)
        if (optionProduct.type === 'promotion') {
          throw new BadRequestException(`Cannot add promotion "${optionProduct.name}" as slot option`);
        }

        // Crear la opción
        const option = queryRunner.manager.create(PromotionSlotOption, {
          slotId: slot.id,
          productId: optionData.productId,
          isDefault: optionData.isDefault,
          extraCost: optionData.extraCost,
          displayOrder: optionData.displayOrder,
          isActive: true,
        });
        await queryRunner.manager.save(PromotionSlotOption, option);
      }
    }

    await queryRunner.commitTransaction();

    // Recargar producto con todas las relaciones
    const productWithSlots = await this.productRepository.getProductById(product.id);

    this.eventEmitter.emit('product.created', { product: productWithSlots });
    return productWithSlots;

  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

---

##### **Tarea 1.2.4: Modificar ProductRepository** ⏱️ 1h

**Archivo a modificar:**

- `src/Product/repositories/product.repository.ts`

**Método a agregar:**

```typescript
async createProductInTransaction(
  productData: CreateProductDto,
  queryRunner: QueryRunner
): Promise<Product> {
  // Lógica de creación de producto usando queryRunner.manager
  // Similar al método existente pero sin commit (se hace desde el service)
}
```

---

##### **Tarea 1.2.5: Actualizar getProductById para incluir slots** ⏱️ 1h

**Archivo a modificar:**

- `src/Product/repositories/product.repository.ts`

**Modificar método para incluir relaciones:**

```typescript
async getProductById(id: string): Promise<Product> {
  return await this.productRepository.findOne({
    where: { id, isActive: true },
    relations: [
      'categories',
      'stock',
      'stock.unitOfMeasure',
      'productIngredients',
      'productIngredients.ingredient',
      'productIngredients.unitOfMeasure',
      'promotionDetails',
      'promotionDetails.product',
      // AGREGAR ESTAS RELACIONES:
      'promotionSlots',
      'promotionSlots.options',
      'promotionSlots.options.product',
    ],
  });
}
```

---

#### **Sprint 1.3: Actualización de Promociones con Slots**

**Duración estimada:** 4-6 horas
**Prioridad:** 🟡 ALTA

##### **Tarea 1.3.1: Modificar UpdateProductDto** ⏱️ 1h

**Archivo a modificar:**

- `src/DTOs/update-product.dto.ts`

**Agregar campo opcional:**

```typescript
@IsOptional()
@IsArray()
@ValidateNested({ each: true })
@Type(() => UpdatePromotionSlotWithOptionsDto)
slots?: UpdatePromotionSlotWithOptionsDto[];
```

---

##### **Tarea 1.3.2: Modificar ProductService.updateProduct()** ⏱️ 3-5h

**Archivo a modificar:**

- `src/Product/services/product.service.ts`

**Estrategia de actualización:**

1. Si `updateData.slots` está presente:
   - Comparar slots existentes con nuevos
   - Agregar nuevos slots
   - Actualizar slots existentes
   - Soft delete slots removidos
2. Mantener transaccionalidad
3. Validar integridad en todo momento

---

### 🎯 **FASE 2: DEDUCCIÓN Y CHEQUEO DE STOCK**

**Objetivo:** Deducir stock correctamente según las selecciones del cliente en promociones con slots.

---

#### **Sprint 2.1: Refactorización de StockService**

**Duración estimada:** 6-8 horas
**Prioridad:** 🔴 CRÍTICA

##### **Tarea 2.1.1: Crear deductPromotionStockWithSelections()** ⏱️ 4-5h

**Archivo a modificar:**

- `src/Stock/stock.service.ts`

**Método a implementar:**

```typescript
private async deductPromotionStockWithSelections(
  promotion: Product,
  quantity: number,
  selections: PromotionSelectionDto[],
) {
  // Cargar slots de la promoción con opciones
  const slots = await this.promotionSlotRepository.find({
    where: { promotionId: promotion.id, isActive: true },
    relations: ['options', 'options.product'],
  });

  // Validar que existan slots
  if (!slots || slots.length === 0) {
    throw new BadRequestException(
      `Promotion "${promotion.name}" has no active slots configured`
    );
  }

  // Por cada slot
  for (const slot of slots) {
    // Buscar la selección del cliente para este slot
    const selection = selections?.find(s => s.slotId === slot.id);

    // Si el slot es obligatorio y no tiene selección, error
    if (!selection && !slot.isOptional) {
      throw new BadRequestException(
        `Slot "${slot.name}" is required and has no selection`
      );
    }

    // Si hay selección
    if (selection) {
      // Validar que el producto seleccionado sea una opción válida del slot
      const validOption = slot.options.find(
        opt => opt.productId === selection.selectedProductId && opt.isActive
      );

      if (!validOption) {
        throw new BadRequestException(
          `Product selected is not a valid option for slot "${slot.name}"`
        );
      }

      // Deducir stock del producto seleccionado
      // Multiplicar por la cantidad del slot y por la cantidad de promociones
      const quantityToDeduct = slot.quantity * quantity;

      await this.deductStock(
        selection.selectedProductId,
        quantityToDeduct,
        selection.toppingsPerUnit, // Si el producto tiene toppings
      );
    }
  }
}
```

---

##### **Tarea 2.1.2: Modificar deductStock() para aceptar promotionSelections** ⏱️ 2h

**Archivo a modificar:**

- `src/Stock/stock.service.ts`

**Cambios en firma del método:**

```typescript
async deductStock(
  productId: string,
  quantity: number,
  toppingsPerUnit?: string[][],
  promotionSelections?: PromotionSelectionDto[], // NUEVO PARÁMETRO
) {
  const product = await this.productService.getProductByIdToAnotherService(productId);

  if (!product) {
    throw new NotFoundException(`Product with ID ${productId} not found.`);
  }

  const unidad = await this.unitOfMeasureService.getUnitOfMeasureUnidad();
  const unidadId = unidad?.id;

  if (!unidadId) {
    throw new InternalServerErrorException('Unidad base no encontrada');
  }

  if (product.type === 'simple') {
    await this.deductSimpleStock(product, quantity, unidadId);
  } else if (product.type === 'product') {
    await this.deductCompositeStock(product, quantity);
  } else if (product.type === 'promotion') {
    // MODIFICAR ESTA PARTE:
    if (promotionSelections && promotionSelections.length > 0) {
      // Usar nuevo método con selecciones
      await this.deductPromotionStockWithSelections(product, quantity, promotionSelections);
    } else {
      // Fallback: usar método legacy para promociones sin slots
      // (mantener compatibilidad temporal durante migración)
      await this.deductPromotionStockLegacy(product, quantity);
    }
  }

  if (toppingsPerUnit?.length) {
    await this.deductToppingsStock(toppingsPerUnit, quantity, product);
  }

  this.eventEmitter.emit('stock.deducted', { stockDeducted: true });

  return 'Stock deducted successfully.';
}

// Renombrar método antiguo para claridad
private async deductPromotionStockLegacy(promotion: Product, quantity: number) {
  // Lógica actual que usa PromotionProduct
  const promotionProducts = await this.productService.getPromotionProductsToAnotherService(promotion.id);

  for (const promotionProduct of promotionProducts) {
    await this.deductStock(
      promotionProduct.product.id,
      promotionProduct.quantity * quantity,
    );
  }
}
```

---

##### **Tarea 2.1.3: Crear checkPromotionStockAvailability()** ⏱️ 2-3h

**Archivo a modificar:**

- `src/Stock/stock.service.ts`

**Método a implementar:**

```typescript
async checkPromotionStockAvailability(
  promotionId: string,
  quantity: number,
  selections: PromotionSelectionDto[],
): Promise<{ available: boolean; insufficientItems: string[] }> {
  const insufficientItems: string[] = [];

  // Cargar slots de la promoción
  const slots = await this.promotionSlotRepository.find({
    where: { promotionId, isActive: true },
    relations: ['options', 'options.product'],
  });

  // Por cada slot
  for (const slot of slots) {
    const selection = selections.find(s => s.slotId === slot.id);

    // Si es obligatorio y no tiene selección, agregar a lista
    if (!selection && !slot.isOptional) {
      insufficientItems.push(`Slot "${slot.name}" is required`);
      continue;
    }

    if (selection) {
      // Validar que la opción sea válida
      const validOption = slot.options.find(
        o => o.productId === selection.selectedProductId && o.isActive
      );

      if (!validOption) {
        insufficientItems.push(`Invalid option for slot "${slot.name}"`);
        continue;
      }

      // Obtener producto seleccionado
      const product = await this.productService.getProductByIdToAnotherService(
        selection.selectedProductId
      );

      // Calcular cantidad requerida
      const requiredQuantity = slot.quantity * quantity;

      // Verificar stock según tipo de producto
      const hasStock = await this.checkProductStock(product, requiredQuantity);

      if (!hasStock) {
        insufficientItems.push(`Insufficient stock for ${product.name} in slot "${slot.name}"`);
      }

      // Si tiene toppings, verificar su stock también
      if (selection.toppingsPerUnit?.length > 0) {
        // Lógica para verificar stock de toppings
        // Similar a la deducción pero sin modificar el stock
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

##### **Tarea 2.1.4: Inyectar PromotionSlotRepository en StockService** ⏱️ 0.5h

**Archivos a modificar:**

- `src/Stock/stock.service.ts`
- `src/Stock/stock.module.ts`

**En stock.module.ts, importar entidades:**

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Stock,
      // ... otras entidades existentes ...
      PromotionSlot, // AGREGAR
      PromotionSlotOption, // AGREGAR
    ]),
    // ... otros imports
  ],
  // ...
})
```

**En stock.service.ts, inyectar repositorio:**

```typescript
constructor(
  // ... inyecciones existentes ...
  @InjectRepository(PromotionSlot)
  private readonly promotionSlotRepository: Repository<PromotionSlot>,
) {}
```

---

#### **Sprint 2.2: Validaciones en OrderService**

**Duración estimada:** 4-6 horas
**Prioridad:** 🔴 CRÍTICA

##### **Tarea 2.2.1: Validar selecciones antes de guardar orden** ⏱️ 2-3h

**Archivo a modificar:**

- `src/Order/services/order.service.ts`

**Crear método de validación:**

```typescript
private async validatePromotionSelections(
  product: Product,
  selections: PromotionSelectionDto[],
  queryRunner: QueryRunner,
): Promise<void> {
  // Cargar slots de la promoción
  const slots = await queryRunner.manager.find(PromotionSlot, {
    where: { promotionId: product.id, isActive: true },
    relations: ['options'],
  });

  if (!slots || slots.length === 0) {
    throw new BadRequestException(
      `Promotion "${product.name}" has no active slots`
    );
  }

  // Validar cada slot
  for (const slot of slots) {
    const selection = selections?.find(s => s.slotId === slot.id);

    // Validar slot obligatorio
    if (!selection && !slot.isOptional) {
      throw new BadRequestException(
        `Slot "${slot.name}" is required for promotion "${product.name}"`
      );
    }

    if (selection) {
      // Validar que la opción exista y esté activa
      const validOption = slot.options.find(
        o => o.productId === selection.selectedProductId && o.isActive
      );

      if (!validOption) {
        throw new BadRequestException(
          `Invalid option selected for slot "${slot.name}"`
        );
      }

      // Validar que el producto de la opción exista
      const optionProduct = await queryRunner.manager.findOne(Product, {
        where: { id: selection.selectedProductId, isActive: true },
      });

      if (!optionProduct) {
        throw new NotFoundException(
          `Product for selected option in slot "${slot.name}" not found`
        );
      }
    }
  }
}
```

---

##### **Tarea 2.2.2: Integrar validación en updateOrder()** ⏱️ 1h

**Archivo a modificar:**

- `src/Order/services/order.service.ts`

**Modificar loop de procesamiento de productos (línea ~144):**

```typescript
for (const pd of updateData.productsDetails) {
  const product = await queryRunner.manager.findOne(Product, {
    where: { id: pd.productId, isActive: true },
  });
  if (!product) throw new NotFoundException('Product not found');

  // SI ES PROMOCIÓN CON SLOTS, VALIDAR SELECCIONES
  if (product.type === 'promotion' && pd.promotionSelections?.length > 0) {
    await this.validatePromotionSelections(
      product,
      pd.promotionSelections,
      queryRunner,
    );
  }

  // ... resto del código existente ...
}
```

---

##### **Tarea 2.2.3: Modificar deducción de stock en updateOrder()** ⏱️ 1-2h

**Archivo a modificar:**

- `src/Order/services/order.service.ts`

**Modificar llamada a deductStock (línea ~207-211):**

```typescript
// ANTES:
await this.stockService.deductStock(
  product.id,
  pd.quantity,
  pd.toppingsPerUnit,
);

// DESPUÉS:
await this.stockService.deductStock(
  product.id,
  pd.quantity,
  pd.toppingsPerUnit,
  pd.promotionSelections, // PASAR SELECCIONES
);
```

---

##### **Tarea 2.2.4: Verificar stock antes de confirmar orden** ⏱️ 1h

**Archivo a modificar:**

- `src/Order/services/order.service.ts`

**Agregar validación ANTES del loop de deducción:**

```typescript
// Verificar disponibilidad de stock antes de procesar
for (const pd of updateData.productsDetails) {
  const product = await queryRunner.manager.findOne(Product, {
    where: { id: pd.productId, isActive: true },
  });

  if (product.type === 'promotion' && pd.promotionSelections?.length > 0) {
    const stockCheck = await this.stockService.checkPromotionStockAvailability(
      product.id,
      pd.quantity,
      pd.promotionSelections,
    );

    if (!stockCheck.available) {
      throw new BadRequestException(
        `Insufficient stock for promotion "${product.name}": ${stockCheck.insufficientItems.join(', ')}`,
      );
    }
  }
}
```

---

### 🎯 **FASE 3: EXPERIENCIA COMPLETA Y OPTIMIZACIONES**

**Objetivo:** Completar funcionalidades secundarias y mejorar la experiencia.

---

#### **Sprint 3.1: Soporte para Toppings en Productos de Slots**

**Duración estimada:** 3-4 horas
**Prioridad:** 🟡 MEDIA

##### **Tarea 3.1.1: Validar y procesar toppings en selecciones** ⏱️ 2-3h

**Archivo a modificar:**

- `src/Order/services/order.service.ts`

**Consideraciones:**

- Los toppings ya están soportados en `PromotionSelectionDto.toppingsPerUnit`
- Verificar que el producto seleccionado permita toppings (`allowsToppings === true`)
- Deducir stock de toppings correctamente

---

##### **Tarea 3.1.2: Tests de toppings en slots** ⏱️ 1h

**Archivo a crear:**

- Tests E2E para verificar funcionamiento

---

#### **Sprint 3.2: Impresión de Comandas**

**Duración estimada:** 4-5 horas
**Prioridad:** 🟡 MEDIA

##### **Tarea 3.2.1: Modificar formato de impresión** ⏱️ 3-4h

**Archivo a modificar:**

- `src/Printer/printer.service.ts`

**Formato propuesto:**

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

---

##### **Tarea 3.2.2: Cargar selecciones en el servicio de impresión** ⏱️ 1h

**Archivo a modificar:**

- `src/Order/services/order.service.ts`

**Modificar preparación de datos de impresión:**

- Incluir información de slots y selecciones
- Formatear para legibilidad en cocina

---

#### **Sprint 3.3: Respuestas Enriquecidas de Órdenes**

**Duración estimada:** 3-4 horas
**Prioridad:** 🟢 BAJA

##### **Tarea 3.3.1: Modificar OrderRepository** ⏱️ 2h

**Archivo a modificar:**

- `src/Order/repositories/order.repository.ts`

**Incluir relaciones en queries:**

```typescript
relations: [
  // ... existentes ...
  'orderDetails.promotionSelections',
  'orderDetails.promotionSelections.slot',
  'orderDetails.promotionSelections.selectedProduct',
];
```

---

##### **Tarea 3.3.2: Actualizar DTOs de respuesta** ⏱️ 1-2h

**Archivo a modificar:**

- `src/DTOs/orderSummaryResponse.dto.ts`

**Agregar información de selecciones en la respuesta:**

- Mostrar productos seleccionados por slot
- Incluir costos extra aplicados

---

### 🎯 **FASE 4: MIGRACIÓN Y LIMPIEZA**

**Objetivo:** Deprecar sistema legacy y migrar datos existentes.

---

#### **Sprint 4.1: Migración de Datos Existentes**

**Duración estimada:** 6-8 horas
**Prioridad:** 🟢 BAJA (post-desarrollo)

##### **Tarea 4.1.1: Crear script de migración** ⏱️ 4-5h

**Archivo a crear:**

- `migration/migrate-promotions-to-slots.ts`

**Estrategia:**

1. Seleccionar todas las promociones con `PromotionProduct`
2. Por cada promoción:
   - Por cada producto en `PromotionProduct`:
     - Crear un `PromotionSlot` con el nombre del producto
     - Crear una única `PromotionSlotOption` con ese producto
     - Marcar como default
     - `extraCost = 0`
3. Validar integridad después de migración
4. NO eliminar `PromotionProduct` todavía (backup)

---

##### **Tarea 4.1.2: Tests de migración** ⏱️ 2-3h

**Archivo a crear:**

- Tests para verificar que la migración funciona correctamente
- Verificar que promociones migradas funcionan igual que antes

---

#### **Sprint 4.2: Deprecación de PromotionProduct**

**Duración estimada:** 2-3 horas
**Prioridad:** 🟢 BAJA (futuro)

##### **Tarea 4.2.1: Marcar como deprecated** ⏱️ 1h

**Archivos a modificar:**

- `src/Product/entities/promotionProducts.entity.ts`
- Agregar comentarios `@deprecated` en todos los métodos que lo usan

---

##### **Tarea 4.2.2: Plan de eliminación futura** ⏱️ 1-2h

- Documentar cuándo y cómo eliminar la tabla
- Verificar que no hay dependencias
- Backup de datos históricos

---

## 💡 **MEJORAS Y FUNCIONALIDADES FUTURAS**

### **Mejora 1: Caché de Opciones Disponibles**

**Objetivo:** Reducir llamadas a la base de datos.

**Estrategia:**

- Implementar caché con Redis o memoria
- Cachear slots y opciones de promociones populares
- Invalidar caché al actualizar promoción
- TTL de 5-10 minutos

**Estimación:** 3-4 horas
**Prioridad:** 🟡 MEDIA

---

### **Mejora 2: WebSocket para Stock en Tiempo Real**

**Objetivo:** Actualizar disponibilidad de opciones en tiempo real.

**Estrategia:**

- Extender sistema WebSocket existente
- Emitir evento cuando stock de producto cambia
- Frontend actualiza disponibilidad de opciones automáticamente
- Prevenir órdenes con stock agotado

**Estimación:** 4-5 horas
**Prioridad:** 🟡 MEDIA

---

### **Mejora 3: Templates de Promociones**

**Objetivo:** Acelerar creación de promociones similares.

**Funcionalidades:**

- Guardar configuración de slots como template
- Aplicar template a nueva promoción
- Modificar template sin afectar promociones existentes

**Archivos nuevos:**

- `src/Product/entities/promotion-template.entity.ts`
- `src/Product/services/promotion-template.service.ts`
- `src/Product/controllers/promotion-template.controller.ts`

**Estimación:** 8-10 horas
**Prioridad:** 🟢 BAJA

---

### **Mejora 4: Análisis de Popularidad de Opciones**

**Objetivo:** Optimizar inventario según preferencias.

**Funcionalidades:**

- Trackear qué opciones se seleccionan más
- Dashboard de estadísticas
- Alertas de opciones poco populares
- Recomendaciones de stock

**Archivos nuevos:**

- `src/Analytics/promotion-analytics.service.ts`
- `src/Analytics/promotion-analytics.controller.ts`
- `src/Analytics/entities/slot-selection-stats.entity.ts`

**Estimación:** 12-15 horas
**Prioridad:** 🟢 BAJA

---

### **Mejora 5: Validación de Coherencia Periódica**

**Objetivo:** Detectar inconsistencias en datos.

**Funcionalidades:**

- Cron job que verifica:
  - Slots sin opciones activas
  - Slots sin opción default
  - Productos inactivos en opciones activas
  - Referencias rotas
- Notificaciones a administradores
- Auto-corrección de problemas menores

**Estimación:** 4-5 horas
**Prioridad:** 🟡 MEDIA

---

## 📊 **RESUMEN DE TIEMPOS**

| Fase                                | Sprints        | Horas Estimadas | Prioridad               |
| ----------------------------------- | -------------- | --------------- | ----------------------- |
| **Fase 1: Productos y Promociones** | 3 sprints      | 18-24h          | 🔴 CRÍTICA              |
| **Fase 2: Stock**                   | 2 sprints      | 10-14h          | 🔴 CRÍTICA              |
| **Fase 3: Experiencia Completa**    | 3 sprints      | 10-13h          | 🟡 MEDIA                |
| **Fase 4: Migración**               | 2 sprints      | 8-11h           | 🟢 BAJA                 |
| **Mejoras Futuras**                 | -              | 31-39h          | 🟢 OPCIONAL             |
| **TOTAL**                           | **10 sprints** | **46-62h**      | **77-101h con mejoras** |

---

## 🎯 **ORDEN DE EJECUCIÓN RECOMENDADO**

### **Semana 1: Fundamentos**

1. Sprint 1.1: CRUD Opciones (8-10h)
2. Sprint 1.2: Creación con Slots (6-8h)
3. **Total:** 14-18h

### **Semana 2: Integración**

4. Sprint 1.3: Actualización (4-6h)
5. Sprint 2.1: Stock con Slots (6-8h)
6. Sprint 2.2: Validaciones (4-6h)
7. **Total:** 14-20h

### **Semana 3: Completitud**

8. Sprint 3.1: Toppings (3-4h)
9. Sprint 3.2: Impresión (4-5h)
10. Sprint 3.3: Respuestas (3-4h)
11. **Total:** 10-13h

### **Post-Lanzamiento:**

- Sprint 4.1 y 4.2: Migración (8-11h)
- Mejoras según necesidad (31-39h)

---

## 📝 **NOTAS IMPORTANTES**

### **Decisiones Tomadas:**

1. ✅ **PromotionProduct será eliminado** - Reemplazado completamente por sistema de slots
2. ✅ **Múltiples slots del mismo tipo permitidos** - Campo `quantity` en slot lo soporta
3. ✅ **Límite de 10 opciones por slot** - Validado en DTOs y servicios
4. ✅ **No slots anidados** - Arquitectura actual no lo requiere

### **Compatibilidad Durante Desarrollo:**

- Mantener método `deductPromotionStockLegacy()` temporalmente
- Promociones existentes seguirán funcionando
- Migración se hace después de completar desarrollo

### **Testing:**

- Cada sprint debe incluir tests unitarios
- Tests E2E al finalizar cada fase
- Validar casos edge:
  - Slots opcionales sin selección
  - Productos sin stock
  - Toppings en productos de slots
  - Múltiples unidades de la misma promoción con diferentes selecciones

---

**Versión:** v01
**Fecha:** Diciembre 2025
**Última actualización:** 19/12/2025
