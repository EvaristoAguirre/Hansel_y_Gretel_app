/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, In, QueryRunner, Raw, Repository } from 'typeorm';
import { CreateProductDto } from 'src/DTOs/create-product.dto';
import { UpdateProductDto } from 'src/DTOs/update-product-dto';
import { Category } from 'src/Category/category.entity';
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { ProductIngredient } from 'src/Ingredient/ingredientProduct.entity';
import { CreatePromotionDto } from 'src/DTOs/create-promotion.dto';
import { ProductResponseDto } from 'src/DTOs/productResponse.dto';
import { UnitOfMeasure } from 'src/UnitOfMeasure/unitOfMesure.entity';
import { UnitOfMeasureService } from 'src/UnitOfMeasure/unitOfMeasure.service';
import { isUUID } from 'class-validator';
import { ToppingsGroup } from 'src/ToppingsGroup/toppings-group.entity';
import { ProductAvailableToppingGroup } from 'src/Ingredient/productAvailableToppingsGroup.entity';
import { Product } from 'src/Product/product.entity';
import { PromotionProduct } from 'src/Product/promotionProducts.entity';
import { ProductMapper } from 'src/Product/productMapper';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(PromotionProduct)
    private readonly promotionProductRepository: Repository<PromotionProduct>,
    private readonly dataSource: DataSource,
    private readonly unitOfMeasureService: UnitOfMeasureService,
  ) {}

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

  async getProductById(id: string): Promise<Product> {
    const product = await this.getProductWithRelations(id, 'product');
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

  async getProductByCode(code: number): Promise<ProductResponseDto> {
    if (!code) {
      throw new BadRequestException('Either code must be provided.');
    }

    try {
      const product = await this.productRepository.findOne({
        where: { code: code },
        relations: ['categories'],
      });

      if (!product) {
        throw new NotFoundException(`Product not found with  code: ${code}`);
      }
      return ProductMapper.toResponseDto(product);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Error fetching the product',
        error.message,
      );
    }
  }

  async getProductByName(name: string): Promise<ProductResponseDto> {
    if (!name) {
      throw new BadRequestException('Either name must be provided.');
    }

    try {
      const product = await this.productRepository.findOne({
        where: { name: ILike(`%${name}%`) },
        relations: ['categories'],
      });

      if (!product) {
        throw new NotFoundException(`Product not found with  name: ${name}`);
      }
      return ProductMapper.toResponseDto(product);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Error fetching the product',
        error.message,
      );
    }
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
      throw new InternalServerErrorException(
        'An error occurred while fetching products. Please try again.',
        error.message,
      );
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
      await this.checkProductUniqueness(queryRunner, productData);

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
      throw new InternalServerErrorException(
        'Error creating the product',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }

  private async createPromotion(
    queryRunner: QueryRunner,
    createPromotionDto: CreatePromotionDto,
  ): Promise<ProductResponseDto> {
    const { categories, products, ...promotionData } = createPromotionDto;

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
    const savedPromotion = await queryRunner.manager.save(promotion);

    if (products && products.length > 0) {
      for (const productDto of products) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: productDto.productId },
        });

        if (product) {
          const promotionProduct = queryRunner.manager.create(
            PromotionProduct,
            {
              promotion: savedPromotion,
              product,
              quantity: productDto.quantity,
            },
          );

          if (product.cost) {
            savedPromotion.cost += product.cost * productDto.quantity;
          }

          await queryRunner.manager.save(promotionProduct);
        }
      }

      await queryRunner.manager.save(Product, savedPromotion);
    }

    const promotionWithDetails =
      await this.getProductWithRelationsByQueryRunner(
        queryRunner,
        savedPromotion.id,
        'promotion',
      );

    if (!promotionWithDetails) {
      throw new NotFoundException('Promotion not found after creation');
    }

    const promotionCreada = ProductMapper.toResponseDto(promotionWithDetails);
    return promotionCreada;
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
        queryRunner,
        savedProduct.id,
        'product',
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
        queryRunner,
        savedProduct.id,
        'product',
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
      throw new InternalServerErrorException(
        'Failed to check product uniqueness',
        error,
      );
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
      throw new InternalServerErrorException(
        'Error updating the product',
        error.message,
      );
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
      const product = await this.getProductWithRelations(id, 'simple');
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
          queryRunner,
          updatedProduct.id,
          updatedProduct.type,
        );
      return ProductMapper.toResponseDto(updatedProductWithRelations);
    }

    // Producto compuesto
    if (!ingredients) {
      throw new BadRequestException(
        'Ingredients are required for composite products',
      );
    }

    const product = await this.getProductWithRelations(id, updateData.type);
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
        queryRunner,
        updatedProduct.id,
        updatedProduct.type,
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
    const { categories, products, ...otherAttributes } = updateData;

    const promotion = await queryRunner.manager.findOne(Product, {
      where: { id: id, isActive: true, type: 'promotion' },
      relations: [
        'categories',
        'promotionDetails',
        'promotionDetails.product',
        'stock',
        'stock.unitOfMeasure',
        'availableToppingGroups',
        'availableToppingGroups.toppingGroup',
      ],
    });
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

    await queryRunner.manager.save(promotion);
    const updatedPromotion = await queryRunner.manager.findOne(Product, {
      where: { id: id, isActive: true },
      relations: [
        'categories',
        'promotionDetails',
        'promotionDetails.product',
        'stock',
        'stock.unitOfMeasure',
        'availableToppingGroups',
        'availableToppingGroups.toppingGroup',
        'availableToppingGroups.toppingGroup.toppings',
      ],
    });
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
      throw new InternalServerErrorException(
        'Error fetching products',
        error.message,
      );
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

      throw new InternalServerErrorException(
        'Error fetching the products',
        error.message,
      );
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
      throw new InternalServerErrorException(
        'Error fetching the product',
        error.message,
      );
    }
  }

  async getProductWithRelations(
    id: string,
    type: 'product' | 'promotion' | 'simple',
  ): Promise<Product> {
    const relations =
      type === 'product' || type === 'simple'
        ? [
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
          ]
        : [
            'categories',
            'promotionDetails',
            'promotionDetails.product',
            'promotionDetails.product.productIngredients',
            'promotionDetails.product.productIngredients.ingredient',
            'promotionDetails.product.productIngredients.unitOfMeasure',
            'promotionDetails.product.stock',
            'promotionDetails.product.stock.unitOfMeasure',
          ];

    const product = await this.productRepository.findOne({
      where: { id, isActive: true },
      relations,
    });

    if (!product) {
      throw new NotFoundException(`Product with ID: ${id} not found`);
    }
    return product;
  }

  private async getProductWithRelationsByQueryRunner(
    queryRunner: QueryRunner,
    id: string,
    type: 'product' | 'promotion' | 'simple',
  ): Promise<Product> {
    const relations =
      type === 'product' || type === 'simple'
        ? [
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
          ]
        : [
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
          ];

    const product = await queryRunner.manager.findOne(Product, {
      where: { id, isActive: true },
      relations,
    });

    if (!product) {
      throw new NotFoundException(`Product with ID: ${id} not found`);
    }
    return product;
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
}
