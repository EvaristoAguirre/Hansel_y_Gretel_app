/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  ILike,
  In,
  Not,
  QueryRunner,
  Raw,
  Repository,
} from 'typeorm';
import { CreateProductDto } from 'src/Product/dtos/create-product.dto';
import { UpdateProductDto } from 'src/Product/dtos/update-product-dto';
import {
  UpdatePromotionSlotWithOptionsDto,
  UpdateSlotOptionForUpdateDto,
} from 'src/Product/dtos/update-slot-option-for-update.dto';
import { Category } from 'src/Category/category.entity';
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { ProductIngredient } from 'src/Ingredient/ingredientProduct.entity';
import { ProductResponseDto } from 'src/DTOs/productResponse.dto';
import { UnitOfMeasure } from 'src/UnitOfMeasure/unitOfMesure.entity';
import { UnitOfMeasureService } from 'src/UnitOfMeasure/unitOfMeasure.service';
import { isUUID } from 'class-validator';
import { ToppingsGroup } from 'src/ToppingsGroup/toppings-group.entity';
import { ProductAvailableToppingGroup } from 'src/Ingredient/productAvailableToppingsGroup.entity';
import { Product } from 'src/Product/entities/product.entity';
import { PromotionProduct } from 'src/Product/entities/promotionProducts.entity';
import { PromotionSlot } from 'src/Product/entities/promotion-slot.entity';
import { ProductMapper } from 'src/Product/productMapper';
import { LoggerService } from 'src/Monitoring/monitoring-logger.service';
import { PromotionSlotAssignment } from '../entities/promotion-slot-assignment.entity';
import { PromotionSlotOption } from '../entities/promotion-slot-option.entity';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(PromotionProduct)
    private readonly promotionProductRepository: Repository<PromotionProduct>,
    private readonly dataSource: DataSource,
    private readonly unitOfMeasureService: UnitOfMeasureService,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * Método auxiliar para loguear errores con información estructurada
   * Centraliza el formato de logs para este repositorio
   */
  private logError(
    operation: string,
    context: Record<string, any>,
    error: any,
  ) {
    const errorInfo = {
      operation,
      repository: 'ProductRepository',
      context,
      timestamp: new Date().toISOString(),
    };
    this.loggerService.error(errorInfo, error);
  }

  //---- Estandarizado  -------- con el dto nuevo
  async getAllProducts(page: number, limit: number): Promise<Product[]> {
    if (page <= 0 || limit <= 0) {
      throw new BadRequestException(
        'Page and limit must be positive integers.',
      );
    }

    return await this.productRepository.find({
      where: { isActive: true },
      skip: (page - 1) * limit,
      take: limit,
      relations: [
        'categories',
        'productIngredients',
        'productIngredients.ingredient',
        'productIngredients.unitOfMeasure',
        'promotionDetails',
        'promotionDetails.product',
        'stock',
        'stock.unitOfMeasure',
        'availableToppingGroups',
        'availableToppingGroups.unitOfMeasure',
        'availableToppingGroups.toppingGroup',
        'availableToppingGroups.toppingGroup.toppings',
      ],
    });
  }

  async getProduct(params: {
    code?: number;
    name?: string;
  }): Promise<ProductResponseDto> {
    const { code, name } = params;
    if (!code && !name) {
      throw new BadRequestException('Either code or name must be provided.');
    }
    try {
      if (code) {
        const product = await this.productRepository.findOne({
          where: { code: code },
          relations: ['categories'],
        });
        if (!product) {
          throw new NotFoundException(`Product not found`);
        }
        return ProductMapper.toResponseDto(product);
      }
      if (name) {
        const product = await this.productRepository.findOne({
          where: { name: ILike(`%${name}%`) },
          relations: ['categories'],
        });
        if (!product) {
          throw new NotFoundException(`Product not found`);
        }
        return ProductMapper.toResponseDto(product);
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logError('getProduct', { code, name }, error);
      throw error;
    }
  }

  async getProductById(id: string): Promise<Product> {
    const product = await this.getProductWithRelationsByQueryRunner(
      id,
      'product',
    );
    if (!product) {
      throw new NotFoundException(`Product not found with  id: ${id}`);
    }
    return product;
  }

  async getProductByIdToAnotherService(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: [
        'stock',
        'stock.unitOfMeasure',
        'productIngredients',
        'productIngredients.ingredient',
        'productIngredients.unitOfMeasure',
        'promotionDetails',
        'availableToppingGroups',
        'availableToppingGroups.unitOfMeasure',
        'availableToppingGroups.toppingGroup.toppings',
        'availableToppingGroups.toppingGroup.toppings.unitOfMeasure',
      ],
    });
    if (!product) {
      throw new NotFoundException(`Product not found with  id: ${id}`);
    }
    return product;
  }

  //---- Estandarizado --------  con el dto nuevo
  async getProductsByCategories(
    categories: string[],
  ): Promise<ProductResponseDto[]> {
    if (!categories || categories.length === 0) {
      throw new BadRequestException(
        'At least one category ID must be provided.',
      );
    }
    try {
      const products = await this.dataSource
        .createQueryBuilder(Product, 'product')
        .leftJoinAndSelect('product.categories', 'selectedCategories')
        .leftJoinAndSelect('product.productIngredients', 'productIngredients')
        .leftJoinAndSelect('productIngredients.ingredient', 'ingredient')
        .leftJoinAndSelect('productIngredients.unitOfMeasure', 'unitOfMeasure')
        .leftJoinAndSelect('product.promotionDetails', 'promotionDetails')
        .leftJoinAndSelect('promotionDetails.product', 'promotionProduct')
        .leftJoinAndSelect('product.stock', 'stock')
        .leftJoinAndSelect('stock.unitOfMeasure', 'unitOfMeasureStock')
        .leftJoinAndSelect(
          'product.availableToppingGroups',
          'availableToppingGroups',
        )
        .leftJoinAndSelect(
          'availableToppingGroups.toppingGroup',
          'toppingGroup',
        )
        .leftJoinAndSelect(
          'availableToppingGroups.unitOfMeasure',
          'toppingUnit',
        )
        .leftJoinAndSelect('toppingGroup.toppings', 'groupToppings')
        .leftJoinAndSelect(
          'toppingGroup.productsAvailableIn',
          'productsAvailableIn',
        )
        .leftJoinAndSelect(
          'productsAvailableIn.toppingGroup',
          'productsAvailableInGroup',
        )
        .leftJoinAndSelect(
          'productsAvailableInGroup.toppings',
          'productsAvailableInGroupToppings',
        )
        .where((qb) => {
          const subQuery = qb
            .subQuery()
            .select('pc.productsId')
            .from('product_categories', 'pc')
            .where('pc.categoryId IN (:...categories)', { categories })
            .groupBy('pc.productsId')
            .having('COUNT(pc.categoryId) = :numCategories', {
              numCategories: categories.length,
            })
            .getQuery();
          return `product.id IN ${subQuery}`;
        })
        .andWhere('product.isActive = :isActive', { isActive: true })
        .getMany();
      return ProductMapper.toResponseDtoArray(products);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logError('getProductsByCategories', { categories }, error);
      throw error;
    }
  }

  //---- Estandarizado  -------- con el dto nuevo
  async createProduct(
    productToCreate: CreateProductDto,
  ): Promise<ProductResponseDto> {
    if (!productToCreate.type) {
      throw new BadRequestException('Product type is required');
    }
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const {
        categories,
        ingredients,
        type,
        availableToppingGroups,
        ...productData
      } = productToCreate;
      await this.checkProductUniqueness(queryRunner, {
        name: productData.name,
        code: productData.code,
      });

      if (type === 'promotion') {
        const promotion = await this.createPromotion(
          queryRunner,
          productToCreate,
        );
        await queryRunner.commitTransaction();
        return promotion;
      }

      if (type === 'product') {
        if (
          !productToCreate.ingredients ||
          productToCreate.ingredients.length === 0
        ) {
          const product = await this.createSimpleProduct(
            queryRunner,
            productToCreate,
          );
          await queryRunner.commitTransaction();
          return product;
        } else {
          const product = await this.createCompositeProduct(
            queryRunner,
            productToCreate,
          );
          await queryRunner.commitTransaction();
          return product;
        }
      }

      throw new BadRequestException('Invalid product type');
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof HttpException) {
        throw error;
      }
      this.logError('createProduct', { type: productToCreate.type }, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async createPromotion(
    queryRunner: QueryRunner,
    createPromotionDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    const { products } = createPromotionDto;

    // Crear la promoción base
    const savedPromotion = await this.createPromotionBase(
      queryRunner,
      createPromotionDto,
    );

    if (products && products.length > 0) {
      await this.createPromotionProducts(queryRunner, savedPromotion, products);
      const promotionWithDetails =
        await this.getProductWithRelationsByQueryRunner(
          savedPromotion.id,
          'promotion',
          queryRunner,
        );
      return ProductMapper.toResponseDto(promotionWithDetails);
    } else {
      // Promoción sin productos ni slots (válida para crear estructura base)
      const promotionWithDetails = await this.getPromotionBasicRelations(
        queryRunner,
        savedPromotion.id,
      );
      return ProductMapper.toResponseDto(promotionWithDetails);
    }
  }

  /**
   * NUEVO MÉTODO: Crea la estructura base de una promoción (Product entity)
   */
  private async createPromotionBase(
    queryRunner: QueryRunner,
    createPromotionDto: CreateProductDto,
  ): Promise<Product> {
    const { categories, ...promotionData } = createPromotionDto;

    let categoryEntities: Category[] = [];
    if (categories && categories.length > 0) {
      categoryEntities = await queryRunner.manager.find(Category, {
        where: { id: In(categories), isActive: true },
      });
      if (categoryEntities.length !== categories.length) {
        throw new BadRequestException('Some categories do not exist');
      }
    }

    const unitPromotion = await queryRunner.manager.findOne(UnitOfMeasure, {
      where: { name: 'Unidad' },
    });

    const promotion = queryRunner.manager.create(Product, {
      ...promotionData,
      cost: 0,
      type: 'promotion',
      categories: categoryEntities,
      unitOfMeasure: unitPromotion,
    });

    return await queryRunner.manager.save(promotion);
  }

  /**
   * NUEVO MÉTODO: Crea los productos asociados a una promoción simple (sin slots)
   */
  private async createPromotionProducts(
    queryRunner: QueryRunner,
    promotion: Product,
    products: Array<{ productId: string; quantity: number }>,
  ): Promise<void> {
    let totalCost = 0;

    for (const productDto of products) {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: productDto.productId },
      });

      if (!product) {
        throw new BadRequestException(
          `Product with ID ${productDto.productId} not found`,
        );
      }

      const promotionProduct = queryRunner.manager.create(PromotionProduct, {
        promotion,
        product,
        quantity: productDto.quantity,
      });

      await queryRunner.manager.save(promotionProduct);

      if (product.cost) {
        totalCost += product.cost * productDto.quantity;
      }
    }

    promotion.cost = totalCost;
    await queryRunner.manager.save(Product, promotion);
  }

  private async createCompositeProduct(
    queryRunner: QueryRunner,
    productToCreate: CreateProductDto,
  ): Promise<ProductResponseDto> {
    const { categories, availableToppingGroups, ingredients, ...productData } =
      productToCreate;

    let categoryEntities: Category[] = [];

    if (categories && categories.length > 0) {
      categoryEntities = await queryRunner.manager.find(Category, {
        where: { id: In(categories), isActive: true },
      });
      if (categoryEntities.length !== categories.length) {
        throw new BadRequestException('Some categories do not exist');
      }
    }

    const unitToCompositeProduct = await queryRunner.manager.findOne(
      UnitOfMeasure,
      {
        where: { name: 'Unidad' },
      },
    );

    const product = queryRunner.manager.create(Product, {
      ...productData,
      baseCost: 0,
      toppingsCost: 0,
      cost: 0,
      categories: categoryEntities,
      unitOfMeasure: unitToCompositeProduct,
    });
    const savedProduct = await queryRunner.manager.save(product);
    let totalBaseCost = 0;

    if (ingredients && ingredients.length > 0) {
      const productIngredients = ingredients.map(async (ingredientDto) => {
        const ingredient = await queryRunner.manager.findOne(Ingredient, {
          where: { id: ingredientDto.ingredientId },
          relations: ['unitOfMeasure'],
        });
        if (!ingredient) {
          throw new BadRequestException(
            `Ingredient with id ${ingredientDto.ingredientId} does not exist`,
          );
        }

        const unitOfMeasure = await queryRunner.manager.findOne(UnitOfMeasure, {
          where: { id: ingredientDto.unitOfMeasureId },
        });
        if (!unitOfMeasure) {
          throw new BadRequestException(
            `Unit of measure ${ingredientDto.unitOfMeasureId} does not exist`,
          );
        }
        // ---- la conversion de unidad
        const convertedQuantity = await this.unitOfMeasureService.convertUnit(
          ingredientDto.unitOfMeasureId,
          ingredient.unitOfMeasure.id,
          ingredientDto.quantityOfIngredient,
        );

        const productIngredient = queryRunner.manager.create(
          ProductIngredient,
          {
            product: savedProduct,
            ingredient,
            quantityOfIngredient: convertedQuantity,
            unitOfMeasure: ingredient.unitOfMeasure,
          },
        );

        if (ingredient.cost) {
          const partialCost = ingredient.cost * convertedQuantity;
          totalBaseCost += partialCost;
        }
        return queryRunner.manager.save(productIngredient);
      });

      await Promise.all(productIngredients);
      savedProduct.baseCost = totalBaseCost;
      savedProduct.cost = totalBaseCost;
      await queryRunner.manager.save(Product, savedProduct);
    }

    if (productToCreate.allowsToppings && availableToppingGroups?.length) {
      await this.createAvailableToppingsGroup(
        savedProduct,
        availableToppingGroups,
        queryRunner,
      );

      const extraToppingCost = await this.calculateToppingsCostForProduct(
        productToCreate,
        queryRunner,
      );

      savedProduct.toppingsCost += extraToppingCost;
      savedProduct.cost =
        Number(savedProduct.baseCost || 0) + Number(extraToppingCost);
      await queryRunner.manager.save(Product, savedProduct);
    }

    const productWithRelations =
      await this.getProductWithRelationsByQueryRunner(
        savedProduct.id,
        'product',
        queryRunner,
      );

    if (!productWithRelations) {
      throw new NotFoundException('Product not found after creation');
    }

    return ProductMapper.toResponseDto(productWithRelations);
  }

  private async createSimpleProduct(
    queryRunner: QueryRunner,
    productToCreate: CreateProductDto,
  ): Promise<ProductResponseDto> {
    const { categories, availableToppingGroups, ...productData } =
      productToCreate;

    let categoryEntities: Category[] = [];
    if (categories && categories.length > 0) {
      categoryEntities = await queryRunner.manager.find(Category, {
        where: { id: In(categories), isActive: true },
      });
      if (categoryEntities.length !== categories.length) {
        throw new BadRequestException('Some categories do not exist');
      }
    }

    const unitToSimpleProduct = await queryRunner.manager.findOne(
      UnitOfMeasure,
      {
        where: { name: 'Unidad' },
      },
    );

    const product = queryRunner.manager.create(Product, {
      ...productData,
      categories: categoryEntities,
      unitOfMeasure: unitToSimpleProduct,
      type: 'simple',
      baseCost: productData.baseCost,
      toppingsCost: 0,
      cost: 0,
    });

    const savedProduct = await queryRunner.manager.save(Product, product);

    if (productToCreate.allowsToppings && availableToppingGroups?.length) {
      await this.createAvailableToppingsGroup(
        savedProduct,
        availableToppingGroups,
        queryRunner,
      );

      const extraToppingCost = await this.calculateToppingsCostForProduct(
        productToCreate,
        queryRunner,
      );

      savedProduct.toppingsCost += extraToppingCost;
      savedProduct.cost =
        Number(savedProduct.baseCost || 0) + Number(extraToppingCost);

      await queryRunner.manager.save(Product, savedProduct);
    } else {
      savedProduct.cost = Number(savedProduct.baseCost || 0);
      await queryRunner.manager.save(Product, savedProduct);
    }

    const productWithRelations =
      await this.getProductWithRelationsByQueryRunner(
        savedProduct.id,
        'product',
        queryRunner,
      );
    if (!productWithRelations) {
      throw new NotFoundException('Product not found after creation');
    }

    return ProductMapper.toResponseDto(productWithRelations);
  }

  private async checkProductUniqueness(
    queryRunner: QueryRunner,
    productData: Partial<Product>,
  ): Promise<void> {
    try {
      if (productData.name) {
        const existingProductByName = await queryRunner.manager.findOne(
          Product,
          {
            where: { name: ILike(productData.name) },
          },
        );
        if (existingProductByName) {
          throw new ConflictException('Product name already exists');
        }
      }
      if (productData.code) {
        const existingProductByCode = await queryRunner.manager.findOne(
          Product,
          {
            where: { code: productData.code },
          },
        );
        if (existingProductByCode) {
          throw new ConflictException('Product code already exists');
        }
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logError('checkProductUniqueness', { productData }, error);
      throw error;
    }
  }

  async updateProduct(
    id: string,
    updateData: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (updateData.type === 'promotion') {
        const promotion = await this.updatePromotion(
          queryRunner,
          id,
          updateData,
        );
        await queryRunner.commitTransaction();
        return promotion;
      }

      if (updateData.type === 'product' || updateData.type === 'simple') {
        const product = await this.updateNormalProduct(
          queryRunner,
          id,
          updateData,
        );
        await queryRunner.commitTransaction();
        return product;
      }

      throw new BadRequestException('Invalid product type');
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof HttpException) {
        throw error;
      }
      this.logError('updateProduct', { id, type: updateData.type }, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateNormalProduct(
    queryRunner: QueryRunner,
    id: string,
    updateData: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }

    const { categories, ingredients, ...otherAttributes } = updateData;

    // Producto simple
    if (
      !updateData.ingredients ||
      updateData.ingredients.length === 0 ||
      updateData.type === 'simple'
    ) {
      const product = await this.getProductWithRelationsByQueryRunner(
        id,
        'simple',
      );
      if (!product) {
        throw new NotFoundException(`Product with ID: ${id} not found`);
      }

      Object.assign(product, otherAttributes);

      if (categories) {
        if (categories.length > 0) {
          const categoryEntities = await queryRunner.manager.find(Category, {
            where: { id: In(categories), isActive: true },
          });
          const foundIds = categoryEntities.map((cat) => cat.id);
          const invalidIds = categories.filter((id) => !foundIds.includes(id));
          if (invalidIds.length > 0) {
            throw new BadRequestException(
              `Invalid category IDs: ${invalidIds.join(', ')}`,
            );
          }
          product.categories = categoryEntities;
        } else {
          product.categories = [];
        }
      }

      let toppingsExtraCost = 0;

      if (updateData.availableToppingGroups) {
        await queryRunner.manager.delete(ProductAvailableToppingGroup, {
          product: { id: product.id },
        });

        await this.updateToppingsGroups(updateData, product, queryRunner);

        toppingsExtraCost = await this.calculateToppingsCostForProduct(
          updateData,
          queryRunner,
        );
        product.toppingsCost = toppingsExtraCost;
      }

      if (
        typeof updateData.baseCost === 'number' &&
        !isNaN(updateData.cost) &&
        updateData.cost >= 0
      ) {
        product.baseCost = updateData.baseCost;
      }

      product.cost =
        Number(product.baseCost || 0) + Number(product.toppingsCost || 0);

      const updatedProduct = await queryRunner.manager.save(product);
      const updatedProductWithRelations =
        await this.getProductWithRelationsByQueryRunner(
          updatedProduct.id,
          updatedProduct.type,
          queryRunner,
        );
      return ProductMapper.toResponseDto(updatedProductWithRelations);
    }

    // Producto compuesto
    if (!ingredients) {
      throw new BadRequestException(
        'Ingredients are required for composite products',
      );
    }

    const product = await this.getProductWithRelationsByQueryRunner(
      id,
      updateData.type,
    );
    Object.assign(product, otherAttributes);

    if (categories) {
      if (categories.length > 0) {
        const categoryEntities = await queryRunner.manager.find(Category, {
          where: { id: In(categories), isActive: true },
        });
        const foundIds = categoryEntities.map((cat) => cat.id);
        const invalidIds = categories.filter((id) => !foundIds.includes(id));
        if (invalidIds.length > 0) {
          throw new BadRequestException(
            `Invalid category IDs: ${invalidIds.join(', ')}`,
          );
        }
        product.categories = categoryEntities;
      } else {
        product.categories = [];
      }
    }

    const existingIngredientIds = product.productIngredients.map(
      (pi) => pi.ingredient.id,
    );
    const newIngredientIds = ingredients.map((i) => i.ingredientId);

    const ingredientsToRemove = product.productIngredients.filter(
      (pi) => !newIngredientIds.includes(pi.ingredient.id),
    );
    if (ingredientsToRemove.length > 0) {
      await queryRunner.manager.remove(ProductIngredient, ingredientsToRemove);
    }

    product.baseCost = 0;

    let totalBaseCost = 0;

    const updatedIngredients = await Promise.all(
      ingredients.map(async (ingredientDto) => {
        const ingredient = await queryRunner.manager.findOne(Ingredient, {
          where: { id: ingredientDto.ingredientId, isActive: true },
          relations: ['unitOfMeasure'],
        });
        if (!ingredient) {
          throw new BadRequestException(
            `Ingredient with id ${ingredientDto.ingredientId} does not exist or is inactive`,
          );
        }

        const unitOfMeasure = await queryRunner.manager.findOne(UnitOfMeasure, {
          where: { id: ingredientDto.unitOfMeasureId },
        });
        if (!unitOfMeasure) {
          throw new BadRequestException(
            `Unit of measure ${ingredientDto.unitOfMeasureId} does not exist`,
          );
        }

        const conversion =
          await this.unitOfMeasureService.convertUnitWithDetails(
            ingredientDto.unitOfMeasureId,
            ingredient.unitOfMeasure.id,
            ingredientDto.quantityOfIngredient,
          );

        const existingRelation = product.productIngredients.find(
          (pi) => pi.ingredient.id === ingredientDto.ingredientId,
        );

        const ingredientCost = ingredient.cost * conversion.convertedQuantity;
        totalBaseCost += ingredientCost;

        if (existingRelation) {
          existingRelation.quantityOfIngredient = conversion.convertedQuantity;
          existingRelation.unitOfMeasure = conversion.targetUnit;

          const savedRelation =
            await queryRunner.manager.save(existingRelation);

          savedRelation.quantityOfIngredient = conversion.originalQuantity;
          savedRelation.unitOfMeasure = conversion.originalUnit;

          return savedRelation;
        } else {
          const newProductIngredient = queryRunner.manager.create(
            ProductIngredient,
            {
              product,
              ingredient,
              quantityOfIngredient: conversion.convertedQuantity,
              unitOfMeasure: conversion.targetUnit,
            },
          );

          const savedNew = await queryRunner.manager.save(newProductIngredient);

          savedNew.quantityOfIngredient = conversion.originalQuantity;
          savedNew.unitOfMeasure = conversion.originalUnit;

          return savedNew;
        }
      }),
    );

    product.baseCost = totalBaseCost;

    product.productIngredients = updatedIngredients;

    if (updateData.availableToppingGroups) {
      await queryRunner.manager.delete(ProductAvailableToppingGroup, {
        product: { id: product.id },
      });
      await this.updateToppingsGroups(updateData, product, queryRunner);
    }

    const toppingsExtraCost = await this.calculateToppingsCostForProduct(
      updateData,
      queryRunner,
    );

    product.toppingsCost = toppingsExtraCost;
    product.cost =
      Number(product.baseCost || 0) + Number(product.toppingsCost || 0);

    const updatedProduct = await queryRunner.manager.save(product);
    const updatedProductWithRelations =
      await this.getProductWithRelationsByQueryRunner(
        updatedProduct.id,
        updatedProduct.type,
        queryRunner,
      );

    return ProductMapper.toResponseDto(updatedProductWithRelations);
  }

  private async updatePromotion(
    queryRunner: QueryRunner,
    id: string,
    updateData: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
    const { categories, products, slots, ...otherAttributes } = updateData;

    const promotion = await this.getProductWithRelationsByQueryRunner(
      id,
      'promotion',
      queryRunner,
    );

    if (!promotion) {
      throw new NotFoundException(`Promotion with ID: ${id} not found`);
    }

    Object.assign(promotion, otherAttributes);

    promotion.cost = 0;

    if (categories) {
      if (categories.length > 0) {
        const categoryEntities = await queryRunner.manager.find(Category, {
          where: { id: In(categories), isActive: true },
        });

        const foundIds = categoryEntities.map((cat) => cat.id);
        const invalidIds = categories.filter((id) => !foundIds.includes(id));
        if (invalidIds.length > 0) {
          throw new BadRequestException(
            `Invalid category IDs: ${invalidIds.join(', ')}`,
          );
        }

        promotion.categories = categoryEntities;
      } else {
        promotion.categories = [];
      }
    }

    if (products) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const existingProductIds = promotion.promotionDetails.map((p) => p.id);

      const updatedProductIds = products.map((p) => p.productId);

      const productsToRemove = promotion.promotionDetails.filter(
        (p) => !updatedProductIds.includes(p.id),
      );

      if (productsToRemove.length > 0) {
        await queryRunner.manager.remove(productsToRemove);
      }

      const updatedProducts = await Promise.all(
        products.map(async (productDto) => {
          const product = await queryRunner.manager.findOne(Product, {
            where: { id: productDto.productId, isActive: true },
          });

          if (!product) {
            throw new BadRequestException(
              `Product with ID ${productDto.productId} not found`,
            );
          }

          const existingProduct = promotion.promotionDetails.find(
            (p) => p.id === productDto.productId,
          );

          if (existingProduct) {
            existingProduct.quantity = productDto.quantity;
            return queryRunner.manager.save(existingProduct);
          } else {
            const promotionProduct = queryRunner.manager.create(
              PromotionProduct,
              {
                promotion,
                product,
                quantity: productDto.quantity,
              },
            );
            return queryRunner.manager.save(promotionProduct);
          }
        }),
      );

      promotion.promotionDetails = updatedProducts;

      for (const productDto of products) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: productDto.productId, isActive: true },
        });
        if (product && product.cost) {
          promotion.cost += product.cost * productDto.quantity;
        }
      }
    }

    // Actualizar slots si están presentes
    if (slots !== undefined) {
      await this.updatePromotionSlots(queryRunner, promotion, slots);
    }

    await queryRunner.manager.save(promotion);
    const updatedPromotion = await this.getProductWithRelationsByQueryRunner(
      id,
      'promotion',
      queryRunner,
    );
    return ProductMapper.toResponseDto(updatedPromotion);
  }

  async deleteProduct(id: string): Promise<string> {
    const result = await this.productRepository.update(id, {
      isActive: false,
    });
    if (result.affected === 0) {
      throw new NotFoundException(`Product with id ${id} not found.`);
    }
    return 'Product deleted successfully.';
  }

  //---- Estandarizado  ----------------con nuevo dto
  async searchProducts(
    name?: string,
    code?: string,
    categories?: string[],
    isActive: boolean = true,
    page?: number,
    limit?: number,
    type?: string,
  ): Promise<ProductResponseDto[]> {
    try {
      if (!name && !code && !categories) {
        throw new BadRequestException(
          'At least a name, code, or category must be provided for search.',
        );
      }

      const offset = page && limit ? (page - 1) * limit : undefined;
      const whereConditions: any = { isActive };

      if (name) {
        whereConditions.name = ILike(`%${name}%`);
      } else if (code) {
        whereConditions.code = Raw(
          (alias) => `CAST(${alias} AS TEXT) ILIKE :code`,
          { code: `%${code}%` },
        );
      }

      if (categories && categories.length > 0) {
        whereConditions.categories = { id: In(categories) };
      }
      if (type) {
        whereConditions.type = In([type as 'product' | 'promotion' | 'simple']);
      }

      const [products] = await this.productRepository.findAndCount({
        where: whereConditions,
        relations: [
          'categories',
          'productIngredients',
          'productIngredients.ingredient',
          'productIngredients.unitOfMeasure',
          'promotionDetails',
          'promotionDetails.product',
          'stock',
          'stock.unitOfMeasure',
          'availableToppingGroups',
          'availableToppingGroups.unitOfMeasure',
          'availableToppingGroups.toppingGroup',
          'availableToppingGroups.toppingGroup.toppings',
        ],
        skip: offset,
        take: limit,
      });

      // Manejar caso sin resultados
      if (products.length === 0) {
        const searchCriteriaParts = [];
        if (name) searchCriteriaParts.push(`name: ${name}`);
        if (code) searchCriteriaParts.push(`code: ${code}`);
        if (categories?.length)
          searchCriteriaParts.push(`categories: ${categories.join(', ')}`);
        throw new NotFoundException(
          `No products found with ${searchCriteriaParts.join(', ')}`,
        );
      }

      return ProductMapper.toResponseDtoArray(products);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logError(
        'searchProducts',
        { name, code, categories, page, limit },
        error,
      );
      throw error;
    }
  }

  //---- Estandarizado  -------- con el dto nuevo
  async searchProductsToPromotion(
    isActive: boolean = true,
    page: number,
    limit: number,
    name?: string,
    code?: number,
  ): Promise<ProductResponseDto[]> {
    try {
      if (!name && !code) {
        throw new BadRequestException(
          'At least a name or a code must be provided for search.',
        );
      }

      const offset = (page - 1) * limit;
      const whereConditions: any = {
        isActive,
        type: In(['product', 'simple']),
      };
      if (name) {
        whereConditions.name = ILike(`%${name}%`);
      } else if (code) {
        whereConditions.code = Raw(
          (alias) => `CAST(${alias} AS TEXT) ILIKE :code`,
          {
            code: `%${code}%`,
          },
        );
      }

      const [products] = await this.productRepository.findAndCount({
        where: whereConditions,
        relations: ['stock', 'stock.unitOfMeasure'],
        skip: offset,
        take: limit,
      });

      if (products.length === 0) {
        const searchCriteria = name ? `name: ${name}` : `code: ${code}`;
        throw new NotFoundException(`No products found with ${searchCriteria}`);
      }

      return ProductMapper.toResponseDtoArray(products);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logError(
        'searchProductsToPromotion',
        { name, code, page, limit },
        error,
      );
      throw error;
    }
  }

  async getSimpleAndCompositeProducts(page: number, limit: number) {
    if (page <= 0 || limit <= 0) {
      throw new BadRequestException(
        'Page and limit must be positive integers.',
      );
    }
    try {
      return await this.productRepository.find({
        where: {
          type: In(['product', 'simple']),
          isActive: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        relations: ['stock', 'stock.unitOfMeasure'],
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logError('getSimpleAndCompositeProducts', { page, limit }, error);
      throw error;
    }
  }

  private async updateToppingsGroups(
    updateData: UpdateProductDto,
    product: Product,
    queryRunner: QueryRunner,
  ) {
    const toppingRelations = await Promise.all(
      updateData.availableToppingGroups.map(async (groupDto) => {
        const toppingGroup = await queryRunner.manager.findOne(ToppingsGroup, {
          where: { id: groupDto.toppingsGroupId, isActive: true },
        });

        if (!toppingGroup) {
          throw new BadRequestException(
            `ToppingsGroup with ID ${groupDto.toppingsGroupId} not found or inactive.`,
          );
        }

        let unitOfMeasure: UnitOfMeasure | null = null;
        if (groupDto.unitOfMeasureId) {
          unitOfMeasure = await queryRunner.manager.findOne(UnitOfMeasure, {
            where: { id: groupDto.unitOfMeasureId },
          });

          if (!unitOfMeasure) {
            throw new BadRequestException(
              `Unit of measure ${groupDto.unitOfMeasureId} does not exist`,
            );
          }
        }

        const toppingRelation = queryRunner.manager.create(
          ProductAvailableToppingGroup,
          {
            product,
            toppingGroup,
            quantityOfTopping: groupDto.quantityOfTopping || 1,
            unitOfMeasure: unitOfMeasure || undefined,
            settings: groupDto.settings ?? null,
          },
        );

        return queryRunner.manager.save(toppingRelation);
      }),
    );

    product.availableToppingGroups = toppingRelations;
    await queryRunner.manager.save(product);
    return queryRunner.manager.findOne(Product, {
      where: { id: product.id },
      relations: [
        'availableToppingGroups',
        'availableToppingGroups.toppingGroup',
        'availableToppingGroups.unitOfMeasure',
      ],
    });
  }

  private async createAvailableToppingsGroup(
    savedProduct: Product,
    toppingGroups,
    queryRunner: QueryRunner,
  ) {
    for (const groupDto of toppingGroups) {
      const group = await queryRunner.manager.findOne(ToppingsGroup, {
        where: { id: groupDto.toppingsGroupId, isActive: true },
      });

      if (!group) {
        throw new BadRequestException(
          `Toppings group with ID ${groupDto.toppingsGroupId} does not exist`,
        );
      }

      const unit = await queryRunner.manager.findOne(UnitOfMeasure, {
        where: { id: groupDto.unitOfMeasureId },
      });

      if (!unit) {
        throw new BadRequestException(
          `Unit of measure ${groupDto.unitOfMeasureId} does not exist`,
        );
      }

      const association = new ProductAvailableToppingGroup();
      association.product = savedProduct;
      association.productId = savedProduct.id;
      association.toppingGroup = group;
      association.unitOfMeasure = unit;
      association.quantityOfTopping = groupDto.quantityOfTopping;
      association.settings = groupDto.settings ?? null;

      await queryRunner.manager.save(association);

      const productWithToppings = await queryRunner.manager.findOne(Product, {
        where: { id: savedProduct.id },
        relations: [
          'availableToppingGroups',
          'availableToppingGroups.toppingGroup',
          'availableToppingGroups.unitOfMeasure',
        ],
      });
    }
  }

  //---------------- Consultas de Stock ---------------
  async getProductsWithStock(): Promise<Product[]> {
    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.stock', 'stock')
      .leftJoinAndSelect('stock.unitOfMeasure', 'unitOfMeasure')
      .where('product.type = :type', { type: 'simple' })
      .getMany();
  }

  async getProductWithRelationsToService(id: string): Promise<Product> {
    return this.productRepository.findOne({
      where: { id, isActive: true },
      relations: [
        'product',
        'productIngredients',
        'productIngredients.ingredient',
        'productIngredients.unitOfMeasure',
        'promotionDetails',
        'promotionDetails.product',
        'promotionDetails.product.productIngredients',
        'promotionDetails.product.productIngredients.ingredient',
        'promotionDetails.product.productIngredients.unitOfMeasure',
        'stock',
        'stock.unitOfMeasure',
      ],
    });
  }

  async getPromotionProductsToAnotherService(promotionId: string) {
    const promotionProducts = await this.promotionProductRepository.find({
      where: { promotion: { id: promotionId } },
      relations: [
        'product',
        'product.productIngredients',
        'product.productIngredients.ingredient',
        'product.productIngredients.unitOfMeasure',
        'product.stock',
        'product.stock.unitOfMeasure',
      ],
    });

    return promotionProducts;
  }

  private async calculateToppingsCostForProduct(
    productToCreate: CreateProductDto | UpdateProductDto,
    queryRunner: QueryRunner,
  ): Promise<number> {
    let totalExtraCost = 0;

    for (const groupDto of productToCreate.availableToppingGroups || []) {
      const { settings, quantityOfTopping, unitOfMeasureId } = groupDto;
      if (!unitOfMeasureId) continue;

      const group = await queryRunner.manager.findOne(ToppingsGroup, {
        where: { id: groupDto.toppingsGroupId, isActive: true },
        relations: ['toppings', 'toppings.unitOfMeasure'],
      });

      if (!group) {
        throw new BadRequestException(
          `Toppings group with ID ${groupDto.toppingsGroupId} does not exist`,
        );
      }

      const activeToppings = group.toppings?.filter(
        (t) =>
          t.isActive &&
          !isNaN(Number(t.cost)) &&
          t.unitOfMeasure &&
          typeof t.unitOfMeasure.id === 'string',
      );

      if (!activeToppings || activeToppings.length === 0) continue;

      const toppingsWithConvertedCost = await Promise.all(
        activeToppings.map(async (topping) => {
          const convertedQuantity = await this.unitOfMeasureService.convertUnit(
            unitOfMeasureId,
            topping.unitOfMeasure.id,
            quantityOfTopping || 1,
          );
          return {
            topping,
            cost: Number(topping.cost) * convertedQuantity,
          };
        }),
      );

      const maxSelection = settings.maxSelection || 1;
      const topCheapest = toppingsWithConvertedCost
        .sort((a, b) => a.cost - b.cost)
        .slice(0, maxSelection);

      const totalCost = topCheapest.reduce((sum, item) => sum + item.cost, 0);
      const averageCost =
        topCheapest.length > 0 ? totalCost / topCheapest.length : 0;

      totalExtraCost += averageCost;
    }

    return totalExtraCost;
  }

  /**
   * Verifica si existe un producto por su ID
   * Método optimizado que solo verifica la existencia sin cargar relaciones
   * @param id - ID del producto a verificar
   * @param type - Tipo de producto opcional para filtrar (ej: 'promotion')
   * @returns true si existe, false si no existe
   */
  async existsById(id: string, type?: string): Promise<boolean> {
    const whereCondition: Record<string, any> = { id };
    if (type) {
      whereCondition.type = type;
    }

    const count = await this.productRepository.count({
      where: whereCondition,
    });

    return count > 0;
  }

  /**
   * Crea un producto dentro de una transacción existente
   * No hace commit, solo crea el producto usando el queryRunner proporcionado
   * @param productData - Datos del producto a crear
   * @param queryRunner - QueryRunner de la transacción activa
   * @returns Producto creado
   */
  async createProductInTransaction(
    productData: CreateProductDto,
    queryRunner: QueryRunner,
  ): Promise<Product> {
    const { categories, ...productDataWithoutCategories } = productData;

    let categoryEntities: Category[] = [];
    if (categories && categories.length > 0) {
      categoryEntities = await queryRunner.manager.find(Category, {
        where: { id: In(categories), isActive: true },
      });
      if (categoryEntities.length !== categories.length) {
        throw new BadRequestException('Some categories do not exist');
      }
    }

    const unitPromotion = await queryRunner.manager.findOne(UnitOfMeasure, {
      where: { name: 'Unidad' },
    });

    if (!unitPromotion) {
      throw new NotFoundException('Unit of measure "Unidad" not found');
    }

    const product = queryRunner.manager.create(Product, {
      ...productDataWithoutCategories,
      cost: productData.cost || 0,
      baseCost: productData.baseCost || 0,
      toppingsCost: 0,
      type: productData.type || 'product',
      categories: categoryEntities,
      unitOfMeasure: unitPromotion,
    });

    const savedProduct = await queryRunner.manager.save(Product, product);
    return savedProduct;
  }

  /**
   * Actualiza los slots de una promoción
   * Solo recibe IDs de slots y gestiona las asignaciones
   * @private
   */
  private async updatePromotionSlots(
    queryRunner: QueryRunner,
    promotion: Product,
    slotsIds: string[],
  ): Promise<void> {
    try {
      // Obtener asignaciones actuales de la promoción
      const existingAssignments = promotion.promotionSlotAssignments || [];
      const incomingSlotIds = slotsIds || [];

      // Validar que todos los IDs de slots existan
      if (incomingSlotIds.length > 0) {
        const existingSlots = await queryRunner.manager.find(PromotionSlot, {
          where: { id: In(incomingSlotIds) },
        });

        const foundSlotIds = existingSlots.map((slot) => slot.id);
        const invalidSlotIds = incomingSlotIds.filter(
          (id) => !foundSlotIds.includes(id),
        );

        if (invalidSlotIds.length > 0) {
          throw new BadRequestException(
            `Los siguientes IDs de slots no existen: ${invalidSlotIds.join(', ')}`,
          );
        }
      }

      // Obtener los IDs de slots que ya tienen asignación
      const existingSlotIds = existingAssignments.map((a) => a.slotId);

      // Asignaciones a eliminar (existen en BD pero no en la actualización)
      const assignmentsToRemove = existingAssignments.filter(
        (assignment) => !incomingSlotIds.includes(assignment.slotId),
      );

      // Eliminar solo las asignaciones (NO hacer soft delete del slot)
      if (assignmentsToRemove.length > 0) {
        const assignmentIdsToRemove = assignmentsToRemove.map((a) => a.id);
        await queryRunner.manager.delete(
          PromotionSlotAssignment,
          assignmentIdsToRemove,
        );
      }

      // Crear asignaciones para slots nuevos (que no tenían asignación previa)
      const newSlotIds = incomingSlotIds.filter(
        (slotId) => !existingSlotIds.includes(slotId),
      );

      if (newSlotIds.length > 0) {
        const newAssignments = newSlotIds.map((slotId) =>
          queryRunner.manager.create(PromotionSlotAssignment, {
            promotionId: promotion.id,
            slotId,
            quantity: 1,
            isOptional: true,
          }),
        );

        await queryRunner.manager.save(PromotionSlotAssignment, newAssignments);
      }

      // Las asignaciones existentes que siguen en la lista se mantienen sin cambios
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logError(
        'updatePromotionSlots',
        { promotionId: promotion.id, slotsCount: slotsIds?.length },
        error,
      );
      throw error;
    }
  }

  /**
   * Obtiene relaciones básicas para promociones sin productos ni slots
   */
  private async getPromotionBasicRelations(
    queryRunner: QueryRunner,
    promotionId: string,
  ): Promise<Product> {
    const relations = ['categories', 'unitOfMeasure'];
    const promotion = await queryRunner.manager.findOne(Product, {
      where: { id: promotionId, isActive: true },
      relations,
    });
    if (!promotion) {
      throw new NotFoundException(
        `Promotion with ID: ${promotionId} not found`,
      );
    }
    return promotion;
  }

  /**
   * Método mejorado que carga solo las relaciones necesarias según el tipo
   */
  async getProductWithRelationsByQueryRunner(
    id: string,
    type: 'product' | 'promotion' | 'simple',
    queryRunner?: QueryRunner,
  ): Promise<Product> {
    const relations = this.getRelationsForProductType(type);
    if (queryRunner) {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id, isActive: true },
        relations,
      });
      if (!product) {
        throw new NotFoundException(`Product with ID: ${id} not found`);
      }
      return product;
    }

    const product = await this.productRepository.findOne({
      where: { id, isActive: true },
      relations,
    });

    if (!product) {
      throw new NotFoundException(`Product with ID: ${id} not found`);
    }

    return product;
  }

  /**
   * Retorna las relaciones específicas según el tipo de producto
   */
  private getRelationsForProductType(
    type: 'product' | 'promotion' | 'simple',
  ): string[] {
    if (type === 'product' || type === 'simple') {
      return [
        'categories',
        'productIngredients',
        'productIngredients.ingredient',
        'productIngredients.unitOfMeasure',
        'promotionDetails',
        'promotionDetails.product',
        'stock',
        'stock.unitOfMeasure',
        'availableToppingGroups',
        'availableToppingGroups.unitOfMeasure',
        'availableToppingGroups.toppingGroup',
        'availableToppingGroups.toppingGroup.toppings',
        'availableToppingGroups.toppingGroup.toppings.unitOfMeasure',
      ];
    }

    // Para promociones, cargar ambas estructuras posibles
    // (el mapper o servicio deberá determinar cuál usar)
    return [
      'categories',
      'unitOfMeasure',
      'promotionDetails',
      'promotionDetails.product',
      'promotionDetails.product.unitOfMeasure',
      'promotionDetails.product.productIngredients',
      'promotionDetails.product.productIngredients.ingredient',
      'promotionDetails.product.productIngredients.unitOfMeasure',
      'promotionDetails.product.stock',
      'promotionDetails.product.stock.unitOfMeasure',
      'promotionSlotAssignments',
      'promotionSlotAssignments.slot',
      'promotionSlotAssignments.slot.options',
      'promotionSlotAssignments.slot.options.product',
      'promotionSlotAssignments.slot.options.product.unitOfMeasure',
      'stock',
      'stock.unitOfMeasure',
    ];
  }

  /**
   * Actualiza un slot existente y su asignación a la promoción
   * @private
   */
  private async updateExistingSlotAndAssignment(
    queryRunner: QueryRunner,
    promotionId: string,
    slotData: UpdatePromotionSlotWithOptionsDto,
  ): Promise<void> {
    // Verificar que el slot existe
    const existingSlot = await queryRunner.manager.findOne(PromotionSlot, {
      where: { id: slotData.id },
      relations: ['options'],
    });

    if (!existingSlot) {
      throw new NotFoundException(`Slot con ID ${slotData.id} no encontrado`);
    }

    // Actualizar los datos del slot (name, description)
    await queryRunner.manager.update(PromotionSlot, slotData.id, {
      name: slotData.name,
      description: slotData.description || null,
    });

    // Actualizar o crear la asignación
    const existingAssignment = await queryRunner.manager.findOne(
      PromotionSlotAssignment,
      {
        where: {
          promotionId,
          slotId: slotData.id,
        },
      },
    );

    const assignmentData = {
      quantity: slotData.quantity,
      isOptional: slotData.isOptional,
    };

    if (existingAssignment) {
      // Actualizar asignación existente
      await queryRunner.manager.update(
        PromotionSlotAssignment,
        existingAssignment.id,
        assignmentData,
      );
    } else {
      // Crear nueva asignación si no existe
      const newAssignment = queryRunner.manager.create(
        PromotionSlotAssignment,
        {
          promotionId,
          slotId: slotData.id,
          ...assignmentData,
        },
      );
      await queryRunner.manager.save(PromotionSlotAssignment, newAssignment);
    }

    // Actualizar opciones del slot
    await this.updateSlotOptions(queryRunner, slotData.id, slotData.options);
  }

  /**
   * Crea un nuevo slot y su asignación a la promoción
   * @private
   */
  private async createNewSlotAndAssignment(
    queryRunner: QueryRunner,
    promotionId: string,
    slotData: UpdatePromotionSlotWithOptionsDto,
  ): Promise<void> {
    // Crear el slot
    const newSlot = queryRunner.manager.create(PromotionSlot, {
      name: slotData.name,
      description: slotData.description || null,
      isActive: true,
    });
    const savedSlot = await queryRunner.manager.save(PromotionSlot, newSlot);

    // Crear la asignación del slot a la promoción
    const assignment = queryRunner.manager.create(PromotionSlotAssignment, {
      promotionId,
      slotId: savedSlot.id,
      quantity: slotData.quantity,
      isOptional: slotData.isOptional,
    });
    await queryRunner.manager.save(PromotionSlotAssignment, assignment);

    // Crear las opciones del slot
    await this.createSlotOptions(queryRunner, savedSlot.id, slotData.options);
  }

  /**
   * Crea las opciones de un slot
   * @private
   */
  private async createSlotOptions(
    queryRunner: QueryRunner,
    slotId: string,
    optionsData: UpdateSlotOptionForUpdateDto[],
  ): Promise<void> {
    for (const optionData of optionsData) {
      const newOption = queryRunner.manager.create(PromotionSlotOption, {
        slotId,
        productId: optionData.productId,
        extraCost: optionData.extraCost,
        isActive: true,
      });
      await queryRunner.manager.save(PromotionSlotOption, newOption);
    }
  }

  /**
   * Actualiza las opciones de un slot
   * @private
   */
  private async updateSlotOptions(
    queryRunner: QueryRunner,
    slotId: string,
    optionsData: UpdateSlotOptionForUpdateDto[],
  ): Promise<void> {
    // Obtener opciones existentes del slot
    const existingOptions = await queryRunner.manager.find(
      PromotionSlotOption,
      {
        where: { slotId },
      },
    );

    // IDs de opciones que vienen en la actualización
    const incomingOptionIds = optionsData
      .map((o) => o.id)
      .filter((id) => id !== undefined);

    // Opciones a eliminar (soft delete)
    const optionsToRemove = existingOptions.filter(
      (opt) => !incomingOptionIds.includes(opt.id),
    );

    for (const optionToRemove of optionsToRemove) {
      await queryRunner.manager.softDelete(
        PromotionSlotOption,
        optionToRemove.id,
      );
    }

    // Procesar cada opción
    for (const optionData of optionsData) {
      if (optionData.id) {
        // Actualizar opción existente
        await queryRunner.manager.update(PromotionSlotOption, optionData.id, {
          productId: optionData.productId,
          extraCost: optionData.extraCost,
        });
      } else {
        // Crear nueva opción
        const newOption = queryRunner.manager.create(PromotionSlotOption, {
          slotId,
          productId: optionData.productId,
          extraCost: optionData.extraCost,
          isActive: true,
        });
        await queryRunner.manager.save(PromotionSlotOption, newOption);
      }
    }
  }
}
