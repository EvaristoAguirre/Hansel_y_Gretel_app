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
import { Product } from './product.entity';
import { DataSource, ILike, In, QueryRunner, Raw, Repository } from 'typeorm';
import { CreateProductDto } from 'src/DTOs/create-product.dto';
import { UpdateProductDto } from 'src/DTOs/update-product-dto';
import { Category } from 'src/Category/category.entity';
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { ProductIngredient } from 'src/Ingredient/ingredientProduct.entity';

import { instanceToPlain, plainToInstance } from 'class-transformer';
import { PromotionProduct } from './promotionProducts.entity';
import { CreatePromotionDto } from 'src/DTOs/create-promotion.dto';
import { ProductResponseDto } from 'src/DTOs/productResponse.dto';
import { UnitOfMeasure } from 'src/UnitOfMeasure/unitOfMesure.entity';
import { UnitOfMeasureService } from 'src/UnitOfMeasure/unitOfMeasure.service';
import { isUUID } from 'class-validator';
import { StockService } from 'src/Stock/stock.service';
import { CheckStockDto } from 'src/DTOs/checkStock.dto';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(PromotionProduct)
    private readonly promotionProductRepository: Repository<PromotionProduct>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    private readonly stockService: StockService,
    private readonly dataSource: DataSource,
    private readonly unitOfMeasureService: UnitOfMeasureService,
  ) {}

  //---- Estandarizado  -------- con el dto nuevo
  async getAllProducts(
    page: number,
    limit: number,
  ): Promise<ProductResponseDto[]> {
    if (page <= 0 || limit <= 0) {
      throw new BadRequestException(
        'Page and limit must be positive integers.',
      );
    }
    try {
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
        ],
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

  async getProductById(id: string): Promise<Product> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
    try {
      const product = await this.productRepository.findOne({
        where: { id, isActive: true },
        relations: ['categories'],
      });
      if (!product) {
        throw new NotFoundException(`Product not found with  id: ${id}`);
      }
      return product;
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
  async getProductByCode(code: number): Promise<Product> {
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
      return product;
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

  async getProductByName(name: string): Promise<Product> {
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
      return product;
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
      return products;
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
    const queryRunner = this.dataSource.createQueryRunner();
    if (!productToCreate.type) {
      throw new BadRequestException('Product type is required');
    }
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { categories, ingredients, type, ...productData } = productToCreate;
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

  //---- Estandarizado ------- rever con nuevo dto
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

      if (updateData.type === 'product') {
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

  async deleteProduct(id: string): Promise<string> {
    if (!id) {
      throw new BadRequestException('Product id must be provided.');
    }
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
    try {
      const result = await this.productRepository.update(id, {
        isActive: false,
      });
      if (result.affected === 0) {
        throw new NotFoundException(`Product with id ${id} not found.`);
      }
      return 'Product deleted successfully.';
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

  //---- Estandarizado  ----------------con nuevo dto
  async searchProducts(
    name?: string,
    code?: string,
    categories?: string[],
    isActive: boolean = true,
    page: number = 1,
    limit: number = 10,
  ): Promise<ProductResponseDto[]> {
    try {
      if (!name && !code) {
        throw new BadRequestException(
          'At least a name or a code must be provided for search.',
        );
      }

      let filteredProducts: ProductResponseDto[] = [];
      if (categories && categories.length > 0) {
        filteredProducts = await this.getProductsByCategories(categories);
      }

      const offset = (page - 1) * limit;
      const whereConditions: any = { isActive };
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

      if (filteredProducts.length > 0) {
        const productIds = filteredProducts.map((product) => product.id);
        whereConditions.id = In(productIds);
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
        ],
        skip: offset,
        take: limit,
      });

      if (products.length === 0) {
        const searchCriteria = name ? `name: ${name}` : `code: ${code}`;
        throw new NotFoundException(`No products found with ${searchCriteria}`);
      }

      return products;
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

    const promotionWithDetails = await queryRunner.manager.findOne(Product, {
      where: { id: savedPromotion.id },
      relations: [
        'categories',
        'promotionDetails',
        'promotionDetails.product',
        'stock',
        'stock.unitOfMeasure',
      ],
    });

    if (!promotionWithDetails) {
      throw new NotFoundException('Promotion not found after creation');
    }

    return promotionWithDetails;
  }

  private async createCompositeProduct(
    queryRunner: QueryRunner,
    productToCreate: CreateProductDto,
  ): Promise<ProductResponseDto> {
    const { categories, ingredients, ...productData } = productToCreate;
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
      cost: 0,
      categories: categoryEntities,
      unitOfMeasure: unitToCompositeProduct,
    });
    const savedProduct = await queryRunner.manager.save(product);

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
          savedProduct.cost += ingredient.cost * convertedQuantity;
        }

        return queryRunner.manager.save(productIngredient);
      });

      await Promise.all(productIngredients);
      await queryRunner.manager.save(Product, savedProduct);
    }

    const relationsToLoad = ['categories'];
    if (ingredients && ingredients.length > 0) {
      relationsToLoad.push(
        'productIngredients',
        'productIngredients.ingredient',
        'productIngredients.unitOfMeasure',
        'stock',
        'stock.unitOfMeasure',
        'unitOfMeasure',
      );
    }

    const productWithRelations = await queryRunner.manager.findOne(Product, {
      where: { id: savedProduct.id },
      relations: relationsToLoad,
    });

    if (!productWithRelations) {
      throw new NotFoundException('Product not found after creation');
    }

    return productWithRelations;
  }

  private async createSimpleProduct(
    queryRunner,
    productToCreate,
  ): Promise<ProductResponseDto> {
    const { categories, ...productData } = productToCreate;

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
    });

    const savedProduct = await queryRunner.manager.save(product);

    const productWithRelations = await queryRunner.manager.findOne(Product, {
      where: { id: savedProduct.id },
      relations: [
        'categories',
        'stock',
        'stock.unitOfMeasure',
        'unitOfMeasure',
      ],
    });

    if (!productWithRelations) {
      throw new NotFoundException('Product not found after creation');
    }

    await queryRunner.manager.save(Product, productWithRelations);

    return productWithRelations;
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
            where: { name: productData.name },
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

  private async updateNormalProduct(
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
    console.log('update data....', updateData);
    //producto simple
    if (!updateData.ingredients || updateData.ingredients.length === 0) {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: id, isActive: true },
        relations: [
          'categories',
          'productIngredients',
          'productIngredients.ingredient',
          'productIngredients.unitOfMeasure',
          'promotionDetails',
          'promotionDetails.product',
          'stock',
          'stock.unitOfMeasure',
        ],
      });

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

      const updatedProduct = await queryRunner.manager.save(product);

      const productDto = plainToInstance(ProductResponseDto, updatedProduct, {
        excludeExtraneousValues: true,
      });
      return instanceToPlain(productDto) as ProductResponseDto;

      //------- cierre de la actualizacion de producto simple
    } else {
      //producto compuesto
      if (!ingredients) {
        throw new BadRequestException(
          'Ingredients are required for composite products',
        );
      }

      const product = await queryRunner.manager.findOne(Product, {
        where: { id: id, isActive: true },
        relations: [
          'categories',
          'productIngredients',
          'productIngredients.ingredient',
          'productIngredients.unitOfMeasure',
          'promotionDetails',
          'promotionDetails.product',
          'stock',
          'stock.unitOfMeasure',
        ],
      });

      if (!product) {
        throw new NotFoundException(`Product with ID: ${id} not found`);
      }

      Object.assign(product, otherAttributes);
      product.cost = otherAttributes.cost || 0;

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

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const existingIngredientIds = product.productIngredients.map(
        (pi) => (pi.id, console.log('existingIngredientIds...', pi.id)),
      );
      const newIngredientIds = ingredients.map((i) => i.ingredientId);

      const ingredientsToRemove = product.productIngredients.filter(
        (pi) => !newIngredientIds.includes(pi.id),
      );

      await queryRunner.manager.remove(ProductIngredient, ingredientsToRemove);

      const updatedIngredients = await Promise.all(
        ingredients.map(async (ingredientDto) => {
          const ingredient = await queryRunner.manager.findOne(Ingredient, {
            where: { id: ingredientDto.ingredientId },
            relations: ['unitOfMeasure'],
          });

          if (!ingredient) {
            throw new BadRequestException(
              `Ingredient with id ${ingredientDto.ingredientId} does not exist`,
            );
          }
          const unitOfMeasure = await queryRunner.manager.findOne(
            UnitOfMeasure,
            {
              where: { id: ingredientDto.unitOfMeasureId },
            },
          );
          if (!unitOfMeasure) {
            throw new BadRequestException(
              `Unit of measure ${ingredientDto.unitOfMeasureId} does not exist`,
            );
          }

          const convertedQuantity = await this.unitOfMeasureService.convertUnit(
            ingredientDto.unitOfMeasureId,
            ingredient.unitOfMeasure.id,
            ingredientDto.quantityOfIngredient,
          );

          const existing = product.productIngredients.find(
            (pi) => pi.id === ingredientDto.ingredientId,
          );

          if (existing) {
            existing.quantityOfIngredient = convertedQuantity;
            existing.unitOfMeasure = unitOfMeasure;
            product.cost += ingredient.cost * convertedQuantity;
            return queryRunner.manager.save(existing);
          } else {
            const newIngredient = queryRunner.manager.create(
              ProductIngredient,
              {
                product,
                ingredient,
                quantityOfIngredient: convertedQuantity,
                unitOfMeasure,
              },
            );
            product.cost += ingredient.cost * convertedQuantity;
            return queryRunner.manager.save(newIngredient);
          }
        }),
      );

      product.productIngredients = updatedIngredients;
      const updatedProduct = await queryRunner.manager.save(product);

      const productDto = plainToInstance(ProductResponseDto, updatedProduct, {
        excludeExtraneousValues: true,
      });
      return instanceToPlain(productDto) as ProductResponseDto;
    }
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
      ],
    });
    return updatedPromotion;
  }

  async checkProductsStockAvailability(dataToCheck: CheckStockDto) {
    const productId = dataToCheck.productId;
    const quantityToSell = dataToCheck.quantityToSell;
    if (!isUUID(productId)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
    try {
      const product = await this.productRepository.findOne({
        where: { id: productId, isActive: true },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }

      if (product.type === 'promotion') {
        const promotionId = product.id;
        return this.checkStockAvailability(
          promotionId,
          quantityToSell,
          'promotion',
        );
      }

      if (product.type === 'product') {
        const productId = product.id;
        return this.checkStockAvailability(
          productId,
          quantityToSell,
          'product',
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error updating the product',
        error.message,
      );
    }
  }

  // ---------------------------------- todo el conjunto de chequeo --------------------

  private async checkStockAvailability(
    id: string,
    quantityToSell: number,
    type: 'product' | 'promotion',
  ) {
    const entity = await this.getEntityWithRelations(id, type);

    if (!entity) {
      throw new NotFoundException(`${type} not found`);
    }

    if (type === 'product') {
      return this.checkProductStock(entity, quantityToSell);
    } else {
      return this.checkPromotionStock(entity, quantityToSell);
    }
  }

  private async checkProductStock(product: Product, quantityToSell: number) {
    try {
      const productToCheck = product;
      if (!productToCheck) {
        throw new NotFoundException('Product not found');
      }

      if (
        !productToCheck.productIngredients ||
        productToCheck.productIngredients.length === 0
      ) {
        if (!productToCheck.stock) {
          return {
            available: false,
            message: 'Product has no stock information',
          };
        }

        const availableQuantity = productToCheck.stock.quantityInStock;
        if (availableQuantity >= quantityToSell) {
          return { available: true };
        } else {
          return {
            available: false,
            message: `Insufficient stock. Available: ${availableQuantity}, Required: ${quantityToSell}`,
            details: {
              available: availableQuantity,
              required: quantityToSell,
              deficit: quantityToSell - availableQuantity,
            },
          };
        }
      }

      if (
        productToCheck.productIngredients &&
        productToCheck.productIngredients.length > 0
      ) {
        const ingredientChecks = await Promise.all(
          productToCheck.productIngredients.map(async (pi) => {
            const ingredientId = pi.ingredient.id;
            const stockOfIngredient =
              await this.stockService.getStockByIngredientId(ingredientId);
            if (!stockOfIngredient.quantityInStock) {
              return {
                ingredientId: ingredientId,
                ingredientName: stockOfIngredient.ingredient.name,
                available: false,
                message: 'Ingredient has no stock information',
              };
            }

            let requiredQuantity = pi.quantityOfIngredient;

            if (pi.unitOfMeasure?.id !== stockOfIngredient.unitOfMeasure?.id) {
              try {
                requiredQuantity = await this.unitOfMeasureService.convertUnit(
                  pi.unitOfMeasure.id,
                  stockOfIngredient.unitOfMeasure.id,
                  pi.quantityOfIngredient,
                );
              } catch (error) {
                return {
                  ingredientId: stockOfIngredient.ingredient.id,
                  ingredientName: stockOfIngredient.ingredient.name,
                  available: false,
                  message: `Unit conversion error: ${error.message}`,
                };
              }
            }

            const totalRequired = requiredQuantity * quantityToSell;
            const availableQuantity = parseFloat(
              stockOfIngredient.quantityInStock,
            );

            return {
              ingredientId: stockOfIngredient.ingredient.id,
              ingredientName: stockOfIngredient.ingredient.name,
              requiredQuantity: totalRequired,
              availableQuantity: availableQuantity,
              available: availableQuantity >= totalRequired,
              unitOfMeasure: stockOfIngredient.unitOfMeasure.name,
              deficit:
                availableQuantity >= totalRequired
                  ? 0
                  : totalRequired - availableQuantity,
            };
          }),
        );

        const allAvailable = ingredientChecks.every((check) => check.available);

        if (allAvailable) {
          return { available: true };
        } else {
          const insufficientIngredients = ingredientChecks.filter(
            (check) => !check.available,
          );
          return {
            available: false,
            message: 'Insufficient stock for some ingredients',
            details: insufficientIngredients,
          };
        }
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error updating the product',
        error.message,
      );
    }
  }

  private async checkPromotionStock(
    promotion: Product,
    quantityToSell: number,
  ) {
    try {
      if (!promotion) {
        throw new NotFoundException('Promotion not found');
      }

      if (
        !promotion.promotionDetails ||
        promotion.promotionDetails.length === 0
      ) {
        return {
          available: false,
          message: 'Promotion has no associated products',
        };
      }

      const productChecks = await Promise.all(
        promotion.promotionDetails.map(async (pp) => {
          const product = pp.product;
          const requiredQuantity = pp.quantity * quantityToSell;
          if (
            !product.productIngredients ||
            product.productIngredients.length === 0
          ) {
            if (!product.stock) {
              return {
                productId: product.id,
                productName: product.name,
                available: false,
                message: 'Product has no stock information',
              };
            }
            const availableQuantity = product.stock.quantityInStock;
            if (availableQuantity >= requiredQuantity) {
              return {
                productId: product.id,
                productName: product.name,
                available: true,
              };
            } else {
              return {
                productId: product.id,
                productName: product.name,
                available: false,
                message: `Insufficient stock. Available: ${availableQuantity}, Required: ${requiredQuantity}`,
                details: {
                  available: availableQuantity,
                  required: requiredQuantity,
                  deficit: requiredQuantity - availableQuantity,
                },
              };
            }
          }

          const ingredientChecks = await Promise.all(
            product.productIngredients.map(async (pi) => {
              const ingredientId = pi.ingredient.id;
              const stockOfIngredient =
                await this.stockService.getStockByIngredientId(ingredientId);

              if (!stockOfIngredient.quantityInStock) {
                return {
                  ingredientId: ingredientId,
                  ingredientName: stockOfIngredient.ingredient.name,
                  available: false,
                  message: 'Ingredient has no stock information',
                };
              }

              let requiredIngredientQuantity =
                pi.quantityOfIngredient * requiredQuantity;

              if (
                pi.unitOfMeasure?.id !== stockOfIngredient.unitOfMeasure?.id
              ) {
                try {
                  requiredIngredientQuantity =
                    await this.unitOfMeasureService.convertUnit(
                      pi.unitOfMeasure.id,
                      stockOfIngredient.unitOfMeasure.id,
                      pi.quantityOfIngredient * requiredQuantity,
                    );
                } catch (error) {
                  return {
                    ingredientId: stockOfIngredient.ingredient.id,
                    ingredientName: stockOfIngredient.ingredient.name,
                    available: false,
                    message: `Unit conversion error: ${error.message}`,
                  };
                }
              }

              const availableQuantity = parseFloat(
                stockOfIngredient.quantityInStock,
              );

              return {
                ingredientId: stockOfIngredient.ingredient.id,
                ingredientName: stockOfIngredient.ingredient.name,
                requiredQuantity: requiredIngredientQuantity,
                availableQuantity: availableQuantity,
                available: availableQuantity >= requiredIngredientQuantity,
                unitOfMeasure: stockOfIngredient.unitOfMeasure.name,
                deficit:
                  availableQuantity >= requiredIngredientQuantity
                    ? 0
                    : requiredIngredientQuantity - availableQuantity,
              };
            }),
          );

          const allIngredientsAvailable = ingredientChecks.every(
            (check) => check.available,
          );

          return {
            productId: product.id,
            productName: product.name,
            available: allIngredientsAvailable,
            details: allIngredientsAvailable
              ? null
              : {
                  message: 'Insufficient stock for some ingredients',
                  ingredientDetails: ingredientChecks.filter(
                    (check) => !check.available,
                  ),
                },
          };
        }),
      );

      const allProductsAvailable = productChecks.every(
        (check) => check.available,
      );

      if (allProductsAvailable) {
        return { available: true };
      } else {
        const unavailableProducts = productChecks.filter(
          (check) => !check.available,
        );
        return {
          available: false,
          message: 'Insufficient stock for some products in the promotion',
          details: unavailableProducts.map((up) => ({
            productId: up.productId,
            productName: up.productName,
            reason: up.message || 'Insufficient ingredients',
            details: up.details,
          })),
        };
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error checking promotion stock availability',
        error.message,
      );
    }
  }

  private async getEntityWithRelations(
    id: string,
    type: 'product' | 'promotion',
  ) {
    const relations =
      type === 'product'
        ? [
            'productIngredients',
            'productIngredients.ingredient',
            'productIngredients.unitOfMeasure',
            'stock',
            'stock.unitOfMeasure',
          ]
        : [
            'promotionDetails',
            'promotionDetails.product',
            'promotionDetails.product.productIngredients',
            'promotionDetails.product.productIngredients.ingredient',
            'promotionDetails.product.productIngredients.unitOfMeasure',
            'promotionDetails.product.stock',
            'promotionDetails.product.stock.unitOfMeasure',
          ];

    return this.productRepository.findOne({
      where: { id, isActive: true, type },
      relations,
    });
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
      const whereConditions: any = { isActive, type: 'product' };
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

      return products;
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
        where: { type: 'product', isActive: true },
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
}
