/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Stock } from './stock.entity';
import { CreateStockDto } from 'src/DTOs/create-stock.dto';
import { UpdateStockDto } from 'src/DTOs/update-stock.dto';
import { AddStockDto } from 'src/DTOs/add-stock.dto';
import { StockRepository } from './stock.repository';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StockSummaryResponseDTO } from 'src/DTOs/stockSummaryResponse.dto';
import { UnitOfMeasureService } from 'src/UnitOfMeasure/unitOfMeasure.service';
import { IngredientService } from 'src/Ingredient/ingredient.service';
import { ProductService } from 'src/Product/services/product-service/product.service';
import { Product } from 'src/Product/entities/product.entity';
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { isUUID } from 'class-validator';
import { Logger } from '@nestjs/common';
import { StockResponseFormatter } from './stock-response-formatter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromotionSlot } from 'src/Product/entities/promotion-slot.entity';
import { PromotionSlotAssignment } from 'src/Product/entities/promotion-slot-assignment.entity';
import { PromotionSelectionDto } from 'src/Product/dtos/promotion-selection.dto';

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);
  constructor(
    private readonly stockRepository: StockRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly unitOfMeasureService: UnitOfMeasureService,
    private readonly ingredientService: IngredientService,
    @Inject(forwardRef(() => ProductService))
    private readonly productService: ProductService,
    @InjectRepository(PromotionSlot)
    private readonly promotionSlotRepository: Repository<PromotionSlot>,
  ) {}

  // ------------- formato string, con separador de miles y decimales
  async getAllStocks(
    page: number,
    limit: number,
  ): Promise<StockSummaryResponseDTO[]> {
    return await this.stockRepository.getAllStocks(page, limit);
  }

  // ------------- formato string, con separador de miles y decimales
  async getStockByProductId(
    productId: string,
  ): Promise<StockSummaryResponseDTO> {
    return await this.stockRepository.getStockByProductId(productId);
  }

  // ------------- formato string, con separador de miles y decimales
  async getStockByIngredientId(
    ingredientId: string,
  ): Promise<StockSummaryResponseDTO> {
    return await this.stockRepository.getStockByIngredientId(ingredientId);
  }

  // ------------- formato string, con separador de miles y decimales
  async createStock(createStockDto: CreateStockDto): Promise<Stock> {
    const {
      productId,
      ingredientId,
      quantityInStock,
      minimumStock,
      unitOfMeasureId,
    } = createStockDto;

    if (productId && ingredientId) {
      throw new BadRequestException(
        'You cannot assign a stock to a product and an ingredient at the same time.',
      );
    }

    if (!productId && !ingredientId) {
      throw new BadRequestException(
        'You must provide either a productId or an ingredientId.',
      );
    }

    if (quantityInStock < 0 || minimumStock < 0) {
      throw new BadRequestException(
        'Quantity in stock and minimum stock must be greater than 0.',
      );
    }

    if (!unitOfMeasureId) {
      throw new BadRequestException('You must provide a unitOfMeasureId.');
    }

    const unitOfMeasure =
      await this.unitOfMeasureService.getUnitOfMeasureById(unitOfMeasureId);
    if (!unitOfMeasure) {
      throw new NotFoundException(
        `Unit of measure with ID: ${unitOfMeasureId} not found.`,
      );
    }

    let product: Product | undefined;
    let ingredient: Ingredient | undefined;

    // -------- Validaciones para PRODUCTO --------
    if (productId) {
      product =
        await this.productService.getProductByIdToAnotherService(productId);
      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      if (product.type !== 'simple') {
        throw new BadRequestException(
          'Only simple products can have stock assigned.',
        );
      }

      if (unitOfMeasure.name.toLowerCase() !== 'unidad') {
        throw new BadRequestException(
          'Simple products must have stock measured in "unidad".',
        );
      }
    }

    // -------- Validaciones para INGREDIENTE --------
    if (ingredientId) {
      ingredient =
        await this.ingredientService.getIngredientByIdToAnotherService(
          ingredientId,
        );
      if (!ingredient) {
        throw new NotFoundException(
          `Ingredient with ID ${ingredientId} not found.`,
        );
      }

      const unitName = unitOfMeasure.name.toLowerCase();

      const invalidCombination =
        (ingredient.type === 'masa' &&
          !unitName.includes('gramo') &&
          !unitName.includes('miligramo') &&
          !unitName.includes('kilo')) ||
        (ingredient.type === 'volumen' &&
          !unitName.includes('litro') &&
          !unitName.includes('centímetro cúbico') &&
          !unitName.includes('mililitro')) ||
        (ingredient.type === 'unidad' && unitName !== 'unidad');

      if (invalidCombination) {
        throw new BadRequestException(
          `Unit of measure "${unitOfMeasure.name}" is not compatible with ingredient type "${ingredient.type}".`,
        );
      }
    }

    const createdStock = await this.stockRepository.createAndSaveStock(
      quantityInStock,
      minimumStock,
      unitOfMeasure,
      product,
      ingredient,
    );

    const stockWithFormatt = StockResponseFormatter.format(createdStock);

    this.eventEmitter.emit('stock.created', { stock: stockWithFormatt });

    return stockWithFormatt;
  }
  // ------------- formato string, con separador de miles y decimales
  async updateStock(
    id: string,
    updateStockDto: UpdateStockDto,
  ): Promise<Stock> {
    const {
      productId,
      ingredientId,
      quantityInStock,
      minimumStock,
      unitOfMeasureId,
    } = updateStockDto;

    if (!id || !isUUID(id)) {
      throw new BadRequestException('Invalid or missing stock ID.');
    }

    if (!productId && !ingredientId) {
      throw new BadRequestException(
        'You must provide either a productId or an ingredientId.',
      );
    }

    if (productId && ingredientId) {
      throw new BadRequestException(
        'You cannot assign a stock to both a product and an ingredient.',
      );
    }

    const stock = await this.stockRepository.findStockById(id);
    if (!stock) {
      throw new NotFoundException(`Stock with ID ${id} not found.`);
    }

    // Cargar unidad de medida si se va a validar más adelante
    let unitOfMeasure = null;
    if (unitOfMeasureId) {
      unitOfMeasure =
        await this.unitOfMeasureService.getUnitOfMeasureById(unitOfMeasureId);
      if (!unitOfMeasure) {
        throw new NotFoundException(
          `Unit of measure with ID: ${unitOfMeasureId} not found.`,
        );
      }
    }

    // Producto
    if (productId) {
      const product =
        await this.productService.getProductByIdToAnotherService(productId);

      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found.`);
      }

      // Verificar que sea tipo simple
      if (product.type !== 'simple') {
        throw new BadRequestException(
          `Only simple products can have stock assigned.`,
        );
      }

      // Validar que la unidad de medida del stock sea "unidad"
      if (unitOfMeasure && unitOfMeasure.name.toLowerCase() !== 'unidad') {
        throw new BadRequestException(
          `Simple products must have stock measured in "unidad".`,
        );
      }

      stock.product = product;
      stock.ingredient = null;
    }

    // Ingrediente
    if (ingredientId) {
      const ingredient =
        await this.ingredientService.getIngredientByIdToAnotherService(
          ingredientId,
        );

      if (!ingredient) {
        throw new NotFoundException(
          `Ingredient with ID ${ingredientId} not found.`,
        );
      }

      // Validar coherencia entre tipo del ingrediente y unidad de medida
      if (unitOfMeasure) {
        const unitName = unitOfMeasure.name.toLowerCase();

        const invalidCombination =
          (ingredient.type === 'masa' &&
            !unitName.includes('gramo') &&
            !unitName.includes('miligramo') &&
            !unitName.includes('kilo')) ||
          (ingredient.type === 'volumen' &&
            !unitName.includes('litro') &&
            !unitName.includes('centímetro cúbico') &&
            !unitName.includes('mililitro')) ||
          (ingredient.type === 'unidad' && unitName !== 'unidad');

        if (invalidCombination) {
          throw new BadRequestException(
            `Unit of measure "${unitOfMeasure.name}" is not compatible with ingredient type "${ingredient.type}".`,
          );
        }
      }

      stock.ingredient = ingredient;
      stock.product = null;
    }

    if (quantityInStock !== undefined) {
      stock.quantityInStock = quantityInStock;
    }

    if (minimumStock !== undefined) {
      stock.minimumStock = minimumStock;
    }

    if (unitOfMeasure) {
      stock.unitOfMeasure = unitOfMeasure;
    }

    const updatedStock = await this.stockRepository.saveStock(stock);

    const stockWithFormatt = StockResponseFormatter.format(updatedStock);

    this.eventEmitter.emit('stock.updated', { stock: stockWithFormatt });
    return stockWithFormatt;
  }

  async deductStock(
    productId: string,
    quantity: number,
    toppingsPerUnit?: string[][],
    promotionSelections?: PromotionSelectionDto[],
  ) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a8a89acd-2352-4f1e-ae86-02cc26cfa6f0', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'stock.service.ts:309',
        message: 'deductStock ENTRY',
        data: {
          productId,
          quantity,
          hasToppings: !!toppingsPerUnit?.length,
          hasSelections: !!promotionSelections?.length,
          selectionsCount: promotionSelections?.length,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A',
      }),
    }).catch(() => {});
    // #endregion
    const product =
      await this.productService.getProductByIdToAnotherService(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found.`);
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a8a89acd-2352-4f1e-ae86-02cc26cfa6f0', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'stock.service.ts:318',
        message: 'Product loaded',
        data: {
          productId: product.id,
          productName: product.name,
          productType: product.type,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A',
      }),
    }).catch(() => {});
    // #endregion

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
      // #region agent log
      fetch(
        'http://127.0.0.1:7242/ingest/a8a89acd-2352-4f1e-ae86-02cc26cfa6f0',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'stock.service.ts:333',
            message: 'Processing promotion',
            data: {
              productId: product.id,
              hasSelections: !!promotionSelections?.length,
              selectionsCount: promotionSelections?.length,
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'A',
          }),
        },
      ).catch(() => {});
      // #endregion
      // Si hay selecciones, usar el nuevo método con slots
      if (promotionSelections && promotionSelections.length > 0) {
        await this.deductPromotionStockWithSelections(
          product,
          quantity,
          promotionSelections,
        );
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

  private async deductSimpleStock(
    product: Product,
    quantity: number,
    unidadId: string,
  ) {
    if (!product.stock) {
      throw new NotFoundException(
        `Product ${product.name} has no associated stock.`,
      );
    }

    const stockUnitId = product.stock.unitOfMeasure.id;

    const quantityToDeduct = await this.unitOfMeasureService.convertUnit(
      unidadId,
      stockUnitId,
      quantity,
    );

    if (product.stock.quantityInStock < quantityToDeduct) {
      throw new BadRequestException(
        `Insufficient stock for product ${product.name}.`,
      );
    }

    product.stock.quantityInStock -= quantityToDeduct;
    await this.stockRepository.saveStock(product.stock);
  }

  private async deductCompositeStock(product: Product, quantity: number) {
    for (const pi of product.productIngredients) {
      await this.deductIngredientStock(
        pi.ingredient.id,
        pi.quantityOfIngredient * quantity,
        pi.unitOfMeasure.id,
      );
    }
  }

  // Renombrar método antiguo para claridad
  private async deductPromotionStockLegacy(
    promotion: Product,
    quantity: number,
  ) {
    const promotionProducts =
      await this.productService.getPromotionProductsToAnotherService(
        promotion.id,
      );

    for (const promotionProduct of promotionProducts) {
      await this.deductStock(
        promotionProduct.product.id,
        promotionProduct.quantity * quantity,
      );
    }
  }

  /**
   * Deducir stock de una promoción con slots basándose en las selecciones del cliente
   * @param promotion - La promoción con slots
   * @param quantity - Cantidad de promociones a procesar
   * @param selections - Selecciones del cliente para cada slot
   */
  private async deductPromotionStockWithSelections(
    promotion: Product,
    quantity: number,
    selections: PromotionSelectionDto[],
  ) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a8a89acd-2352-4f1e-ae86-02cc26cfa6f0', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'stock.service.ts:416',
        message: 'deductPromotionStockWithSelections ENTRY',
        data: {
          promotionId: promotion.id,
          promotionName: promotion.name,
          quantity,
          selectionsCount: selections.length,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'B',
      }),
    }).catch(() => {});
    // #endregion

    // Cargar asignaciones de slots de la promoción
    const assignments = await this.promotionSlotRepository.manager.find(
      PromotionSlotAssignment,
      {
        where: { promotionId: promotion.id },
        relations: ['slot', 'slot.options', 'slot.options.product'],
      },
    );

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a8a89acd-2352-4f1e-ae86-02cc26cfa6f0', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'stock.service.ts:424',
        message: 'Assignments loaded',
        data: {
          assignmentsCount: assignments?.length,
          assignments: assignments?.map((a) => ({
            id: a.id,
            slotId: a.slotId,
            quantity: a.quantity,
            isOptional: a.isOptional,
          })),
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'B',
      }),
    }).catch(() => {});
    // #endregion

    // Validar que existan asignaciones
    if (!assignments || assignments.length === 0) {
      throw new BadRequestException(
        `Promotion "${promotion.name}" has no slot assignments configured`,
      );
    }

    // Por cada asignación de slot
    for (const assignment of assignments) {
      const slot = assignment.slot;

      // #region agent log
      fetch(
        'http://127.0.0.1:7242/ingest/a8a89acd-2352-4f1e-ae86-02cc26cfa6f0',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'stock.service.ts:435',
            message: 'Processing slot assignment',
            data: {
              slotId: slot.id,
              slotName: slot.name,
              isOptional: assignment.isOptional,
              quantity: assignment.quantity,
              optionsCount: slot.options?.length,
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'B',
          }),
        },
      ).catch(() => {});
      // #endregion

      // Buscar la selección del cliente para este slot
      const selection = selections?.find((s) => s.slotId === slot.id);

      // Si el slot es obligatorio y no tiene selección, error
      if (!selection && !assignment.isOptional) {
        throw new BadRequestException(
          `Slot "${slot.name}" is required and has no selection`,
        );
      }

      // Si hay selección
      if (selection) {
        // Validar que la cantidad de productos seleccionados coincida con quantity
        if (
          !selection.selectedProductIds ||
          selection.selectedProductIds.length !== assignment.quantity
        ) {
          throw new BadRequestException(
            `Slot "${slot.name}" requires ${assignment.quantity} product(s), but ${selection.selectedProductIds?.length || 0} were provided`,
          );
        }

        // #region agent log
        fetch(
          'http://127.0.0.1:7242/ingest/a8a89acd-2352-4f1e-ae86-02cc26cfa6f0',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              location: 'stock.service.ts:447',
              message: 'Selection found',
              data: {
                slotId: slot.id,
                selectedProductIds: selection.selectedProductIds,
                selectedProductsCount: selection.selectedProductIds?.length,
                hasToppings: !!selection.toppingsPerUnit?.length,
              },
              timestamp: Date.now(),
              sessionId: 'debug-session',
              runId: 'run1',
              hypothesisId: 'B',
            }),
          },
        ).catch(() => {});
        // #endregion

        // Deducir stock por cada producto seleccionado
        for (let i = 0; i < selection.selectedProductIds.length; i++) {
          const selectedProductId = selection.selectedProductIds[i];

          // Validar que el producto seleccionado sea una opción válida del slot
          const validOption = slot.options?.find(
            (opt) => opt.productId === selectedProductId && opt.isActive,
          );

          if (!validOption) {
            throw new BadRequestException(
              `Product ${selectedProductId} is not a valid option for slot "${slot.name}"`,
            );
          }

          // Obtener toppings para este producto específico (si hay)
          const toppingsForThisProduct = selection.toppingsPerUnit?.[i] || [];

          // #region agent log
          fetch(
            'http://127.0.0.1:7242/ingest/a8a89acd-2352-4f1e-ae86-02cc26cfa6f0',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                location: 'stock.service.ts:464',
                message: 'Deducting stock for selected product',
                data: {
                  selectedProductId,
                  quantityToDeduct: quantity,
                  slotQuantity: assignment.quantity,
                  promotionQuantity: quantity,
                  hasToppings: toppingsForThisProduct.length > 0,
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'A',
              }),
            },
          ).catch(() => {});
          // #endregion

          // Deducir stock del producto seleccionado
          // Multiplicar por la cantidad de promociones (quantity ya es por producto individual)
          await this.deductStock(
            selectedProductId,
            quantity, // Cantidad de promociones (cada producto se descuenta 1 vez por promoción)
            [toppingsForThisProduct], // Toppings para este producto específico
          );
        }
      }
    }
  }

  private async deductIngredientStock(
    ingredientId: string,
    quantity: number,
    unitOfMeasureId: string,
  ) {
    const ingredient =
      await this.ingredientService.getIngredientByIdToAnotherService(
        ingredientId,
      );

    if (!ingredient || !ingredient.stock) {
      throw new NotFoundException(
        `Ingredient ${ingredientId} not found or has no stock.`,
      );
    }

    const stockUnitId = ingredient.stock.unitOfMeasure.id;

    const quantityToDeduct = await this.unitOfMeasureService.convertUnit(
      unitOfMeasureId,
      stockUnitId,
      quantity,
    );

    if (ingredient.stock.quantityInStock < quantityToDeduct) {
      throw new BadRequestException(
        `Insufficient stock for ingredient ${ingredient.name}.`,
      );
    }

    ingredient.stock.quantityInStock -= quantityToDeduct;
    await this.stockRepository.saveStock(ingredient.stock);
  }

  private async deductToppingsStock(
    toppingsPerUnit: string[][],
    productQuantity: number,
    product: Product,
  ) {
    this.logger.log(
      `🧾 Toppings por unidad: ${JSON.stringify(toppingsPerUnit)} | Cantidad de producto: ${productQuantity}`,
    );

    const toppingCountMap: Record<string, number> = {};

    for (const unitToppings of toppingsPerUnit) {
      for (const toppingId of unitToppings) {
        toppingCountMap[toppingId] = (toppingCountMap[toppingId] || 0) + 1;
      }
    }

    this.logger.log(
      `📊 Toppings totales por ID: ${JSON.stringify(toppingCountMap)}`,
    );

    for (const [toppingId, totalUses] of Object.entries(toppingCountMap)) {
      const toppingStock =
        await this.stockRepository.getStockByToppingId(toppingId);
      if (!toppingStock) {
        throw new NotFoundException(`No stock found for topping ${toppingId}`);
      }

      const topping =
        await this.ingredientService.getIngredientByIdToAnotherService(
          toppingId,
        );

      const toppingGroup = product.availableToppingGroups.find((group) =>
        group.toppingGroup?.toppings?.some((t) => t.id === toppingId),
      );

      if (!toppingGroup) {
        throw new NotFoundException(
          `Topping group for topping ${topping.name} (${toppingId}) not found`,
        );
      }

      const quantityPerUse = Number(toppingGroup.quantityOfTopping);
      const sourceUnitId = toppingGroup.unitOfMeasure.id;
      const targetUnitId = toppingStock.unitOfMeasure.id;

      const totalToDeductInSource = totalUses * quantityPerUse;

      this.logger.log(
        `🔍 Procesando topping ${topping.name} (${toppingId}) - Usos totales: ${totalUses}, Por uso: ${quantityPerUse} ${toppingGroup.unitOfMeasure.abbreviation}, Total: ${totalToDeductInSource} ${toppingGroup.unitOfMeasure.abbreviation}`,
      );

      const quantityToDeduct = await this.unitOfMeasureService.convertUnit(
        sourceUnitId,
        targetUnitId,
        totalToDeductInSource,
      );

      this.logger.log(
        `🔁 Conversión de ${totalToDeductInSource} ${toppingGroup.unitOfMeasure.abbreviation} a ${quantityToDeduct} ${toppingStock.unitOfMeasure.abbreviation}`,
      );

      this.logger.log(
        `📦 Stock disponible antes de descontar: ${toppingStock.quantityInStock} ${toppingStock.unitOfMeasure.abbreviation}`,
      );

      if (Number(toppingStock.quantityInStock) < quantityToDeduct) {
        throw new BadRequestException(
          `Insufficient stock for topping ${topping.name}`,
        );
      }

      toppingStock.quantityInStock -= quantityToDeduct;

      await this.stockRepository.saveStock(toppingStock);

      this.logger.log(
        `✅ Descontado ${quantityToDeduct} ${toppingStock.unitOfMeasure.abbreviation} del topping ${topping.name} (${toppingId}). Stock restante: ${toppingStock.quantityInStock}`,
      );
    }
  }

  /**
   * Verifica la disponibilidad de stock para una promoción con slots
   * @param promotionId - ID de la promoción
   * @param quantity - Cantidad de promociones a verificar
   * @param selections - Selecciones del cliente para cada slot
   * @returns Objeto con disponibilidad y lista de items insuficientes
   */
  async checkPromotionStockAvailability(
    promotionId: string,
    quantity: number,
    selections: PromotionSelectionDto[],
  ): Promise<{ available: boolean; insufficientItems: string[] }> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a8a89acd-2352-4f1e-ae86-02cc26cfa6f0', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'stock.service.ts:597',
        message: 'checkPromotionStockAvailability ENTRY',
        data: { promotionId, quantity, selectionsCount: selections.length },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'E',
      }),
    }).catch(() => {});
    // #endregion
    const insufficientItems: string[] = [];

    // Cargar asignaciones de slots de la promoción
    const assignments = await this.promotionSlotRepository.manager.find(
      PromotionSlotAssignment,
      {
        where: { promotionId },
        relations: ['slot', 'slot.options', 'slot.options.product'],
      },
    );

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a8a89acd-2352-4f1e-ae86-02cc26cfa6f0', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'stock.service.ts:608',
        message: 'Assignments loaded for check',
        data: {
          assignmentsCount: assignments?.length,
          hasAssignments: !!assignments?.length,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'E',
      }),
    }).catch(() => {});
    // #endregion

    // Por cada asignación de slot
    for (const assignment of assignments) {
      const slot = assignment.slot;

      // Validar que el slot esté activo
      if (!slot.isActive) {
        continue;
      }

      const selection = selections.find((s) => s.slotId === slot.id);

      // Si es obligatorio y no tiene selección, agregar a lista
      if (!selection && !assignment.isOptional) {
        insufficientItems.push(`Slot "${slot.name}" is required`);
        continue;
      }

      if (selection) {
        // Validar que la cantidad de productos seleccionados coincida con quantity
        if (
          !selection.selectedProductIds ||
          selection.selectedProductIds.length !== assignment.quantity
        ) {
          insufficientItems.push(
            `Slot "${slot.name}" requires ${assignment.quantity} product(s), but ${selection.selectedProductIds?.length || 0} were provided`,
          );
          continue;
        }

        // Verificar cada producto seleccionado
        for (let i = 0; i < selection.selectedProductIds.length; i++) {
          const selectedProductId = selection.selectedProductIds[i];

          // Validar que la opción sea válida
          const validOption = slot.options?.find(
            (o) => o.productId === selectedProductId && o.isActive,
          );

          if (!validOption) {
            insufficientItems.push(
              `Invalid option for slot "${slot.name}": product ${selectedProductId}`,
            );
            continue;
          }

          // Obtener producto seleccionado
          const product =
            await this.productService.getProductByIdToAnotherService(
              selectedProductId,
            );

          if (!product) {
            insufficientItems.push(
              `Product not found for slot "${slot.name}": ${selectedProductId}`,
            );
            continue;
          }

          // Calcular cantidad requerida: 1 producto por promoción (quantity ya es la cantidad de promociones)
          const requiredQuantity = quantity;

          // Verificar stock según tipo de producto
          const hasStock = await this.checkProductStock(
            product,
            requiredQuantity,
          );

          if (!hasStock) {
            insufficientItems.push(
              `Insufficient stock for ${product.name} in slot "${slot.name}"`,
            );
          }

          // Si tiene toppings, verificar su stock también
          // Obtener toppings para este producto específico (índice i)
          const toppingsForThisProduct = selection.toppingsPerUnit?.[i] || [];

          if (toppingsForThisProduct.length > 0) {
            // #region agent log
            fetch(
              'http://127.0.0.1:7242/ingest/a8a89acd-2352-4f1e-ae86-02cc26cfa6f0',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  location: 'stock.service.ts:694',
                  message: 'Checking toppings stock',
                  data: {
                    toppingsPerUnitCount: toppingsForThisProduct.length,
                    requiredQuantity,
                    productId: selectedProductId,
                  },
                  timestamp: Date.now(),
                  sessionId: 'debug-session',
                  runId: 'run1',
                  hypothesisId: 'C',
                }),
              },
            ).catch(() => {});
            // #endregion

            // Contar cuántas veces aparece cada topping para este producto
            const toppingCountMap: Record<string, number> = {};
            for (const toppingId of toppingsForThisProduct) {
              toppingCountMap[toppingId] =
                (toppingCountMap[toppingId] || 0) + quantity; // Multiplicar por cantidad de promociones
            }

            // Verificar stock de toppings sin modificar el stock
            for (const [toppingId, totalUses] of Object.entries(
              toppingCountMap,
            )) {
              const toppingStock =
                await this.stockRepository.getStockByToppingId(toppingId);
              if (!toppingStock) {
                insufficientItems.push(
                  `No stock found for topping ${toppingId}`,
                );
                continue;
              }

              const topping =
                await this.ingredientService.getIngredientByIdToAnotherService(
                  toppingId,
                );

              if (!topping) {
                insufficientItems.push(`Topping ${toppingId} not found`);
                continue;
              }

              const toppingGroup = product.availableToppingGroups.find(
                (group) =>
                  group.toppingGroup?.toppings?.some((t) => t.id === toppingId),
              );

              if (!toppingGroup) {
                insufficientItems.push(
                  `Topping group for topping ${topping.name} not found`,
                );
                continue;
              }

              const quantityPerUse = Number(toppingGroup.quantityOfTopping);
              const sourceUnitId = toppingGroup.unitOfMeasure.id;
              const targetUnitId = toppingStock.unitOfMeasure.id;

              // Calcular cantidad total requerida: cantidad por uso * número de usos
              const totalToCheckInSource = totalUses * quantityPerUse;

              // #region agent log
              fetch(
                'http://127.0.0.1:7242/ingest/a8a89acd-2352-4f1e-ae86-02cc26cfa6f0',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    location: 'stock.service.ts:737',
                    message: 'Topping stock calculation',
                    data: {
                      toppingId,
                      quantityPerUse,
                      totalUses,
                      totalToCheckInSource,
                    },
                    timestamp: Date.now(),
                    sessionId: 'debug-session',
                    runId: 'run1',
                    hypothesisId: 'C',
                  }),
                },
              ).catch(() => {});
              // #endregion

              const quantityToCheck =
                await this.unitOfMeasureService.convertUnit(
                  sourceUnitId,
                  targetUnitId,
                  totalToCheckInSource,
                );

              // #region agent log
              fetch(
                'http://127.0.0.1:7242/ingest/a8a89acd-2352-4f1e-ae86-02cc26cfa6f0',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    location: 'stock.service.ts:748',
                    message: 'Topping stock comparison',
                    data: {
                      toppingId,
                      quantityToCheck,
                      availableStock: toppingStock.quantityInStock,
                      hasEnough:
                        Number(toppingStock.quantityInStock) >= quantityToCheck,
                    },
                    timestamp: Date.now(),
                    sessionId: 'debug-session',
                    runId: 'run1',
                    hypothesisId: 'C',
                  }),
                },
              ).catch(() => {});
              // #endregion

              if (Number(toppingStock.quantityInStock) < quantityToCheck) {
                insufficientItems.push(
                  `Insufficient stock for topping ${topping.name}`,
                );
              }
            }
          }
        }
      }
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a8a89acd-2352-4f1e-ae86-02cc26cfa6f0', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'stock.service.ts:716',
        message: 'checkPromotionStockAvailability EXIT',
        data: {
          available: insufficientItems.length === 0,
          insufficientItemsCount: insufficientItems.length,
          insufficientItems,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'E',
      }),
    }).catch(() => {});
    // #endregion
    return {
      available: insufficientItems.length === 0,
      insufficientItems,
    };
  }

  /**
   * Verifica si un producto tiene stock suficiente
   * @param product - Producto a verificar
   * @param requiredQuantity - Cantidad requerida
   * @returns true si hay stock suficiente, false en caso contrario
   */
  private async checkProductStock(
    product: Product,
    requiredQuantity: number,
  ): Promise<boolean> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a8a89acd-2352-4f1e-ae86-02cc26cfa6f0', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'stock.service.ts:728',
        message: 'checkProductStock ENTRY',
        data: {
          productId: product.id,
          productName: product.name,
          productType: product.type,
          requiredQuantity,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A',
      }),
    }).catch(() => {});
    // #endregion
    if (product.type === 'simple') {
      if (!product.stock) {
        return false;
      }
      const unidad = await this.unitOfMeasureService.getUnitOfMeasureUnidad();
      const unidadId = unidad?.id;

      if (!unidadId) {
        return false;
      }

      const stockUnitId = product.stock.unitOfMeasure.id;

      const quantityToCheck = await this.unitOfMeasureService.convertUnit(
        unidadId,
        stockUnitId,
        requiredQuantity,
      );

      const result = product.stock.quantityInStock >= quantityToCheck;
      // #region agent log
      fetch(
        'http://127.0.0.1:7242/ingest/a8a89acd-2352-4f1e-ae86-02cc26cfa6f0',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'stock.service.ts:751',
            message: 'checkProductStock simple result',
            data: {
              productId: product.id,
              hasStock: result,
              available: product.stock.quantityInStock,
              required: quantityToCheck,
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'A',
          }),
        },
      ).catch(() => {});
      // #endregion
      return result;
    } else if (product.type === 'product') {
      // Verificar ingredientes
      for (const pi of product.productIngredients) {
        // Obtener el ingrediente con su stock cargado
        const ingredient =
          await this.ingredientService.getIngredientByIdToAnotherService(
            pi.ingredient.id,
          );

        if (!ingredient || !ingredient.stock) {
          // #region agent log
          fetch(
            'http://127.0.0.1:7242/ingest/a8a89acd-2352-4f1e-ae86-02cc26cfa6f0',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                location: 'stock.service.ts:761',
                message: 'Ingredient without stock',
                data: {
                  ingredientId: pi.ingredient.id,
                  hasIngredient: !!ingredient,
                  hasStock: !!ingredient?.stock,
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'A',
              }),
            },
          ).catch(() => {});
          // #endregion
          return false;
        }

        const required = pi.quantityOfIngredient * requiredQuantity;
        const sourceUnitId = pi.unitOfMeasure.id;
        const targetUnitId = ingredient.stock.unitOfMeasure.id;

        const quantityToCheck = await this.unitOfMeasureService.convertUnit(
          sourceUnitId,
          targetUnitId,
          required,
        );

        if (ingredient.stock.quantityInStock < quantityToCheck) {
          // #region agent log
          fetch(
            'http://127.0.0.1:7242/ingest/a8a89acd-2352-4f1e-ae86-02cc26cfa6f0',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                location: 'stock.service.ts:775',
                message: 'Insufficient ingredient stock',
                data: {
                  ingredientId: ingredient.id,
                  available: ingredient.stock.quantityInStock,
                  required: quantityToCheck,
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'A',
              }),
            },
          ).catch(() => {});
          // #endregion
          return false;
        }
      }
      return true;
    }
    // Para promociones, se verifica en checkPromotionStockAvailability
    return true;
  }

  // Método para sumar stock existente
  async addStock(id: string, addStockDto: AddStockDto): Promise<Stock> {
    const { quantityToAdd, minimumStock } = addStockDto;

    if (!id || !isUUID(id)) {
      throw new BadRequestException('Invalid or missing stock ID.');
    }

    const stock = await this.stockRepository.findStockById(id);
    if (!stock) {
      throw new NotFoundException(`Stock with ID ${id} not found.`);
    }

    // Sumar la cantidad al stock existente
    if (quantityToAdd !== undefined && quantityToAdd > 0) {
      const currentStock = Number(stock.quantityInStock);
      stock.quantityInStock = currentStock + quantityToAdd;
    }

    // Actualizar stock mínimo si se proporciona
    if (minimumStock !== undefined) {
      stock.minimumStock = Number(minimumStock);
    }

    const updatedStock = await this.stockRepository.saveStock(stock);

    // Recargar el stock con todas las relaciones para asegurar que esté actualizado
    const stockWithRelations = await this.stockRepository.findStockById(id);
    const stockWithFormatt = StockResponseFormatter.format(stockWithRelations);

    this.eventEmitter.emit('stock.updated', { stock: stockWithFormatt });
    return stockWithFormatt;
  }
}
