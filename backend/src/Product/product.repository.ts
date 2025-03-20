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
import { UnitOfMeasure } from 'src/Ingredient/unitOfMesure.entity';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { PromotionProduct } from './promotionProducts.entity';
import { CreatePromotionDto } from 'src/DTOs/create-promotion.dto';
import { ProductResponseDto } from 'src/DTOs/productResponse.dto';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(PromotionProduct)
    private readonly promotionProductRepository: Repository<PromotionProduct>,
    @InjectRepository(UnitOfMeasure)
    private readonly unitOfMeasureRepository: Repository<UnitOfMeasure>,
    private readonly dataSource: DataSource,
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
        where: { code: code, isActive: true },
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
        const product = await this.createNormalProduct(
          queryRunner,
          productToCreate,
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
    const { name, code, description, price, categories, products } =
      createPromotionDto;

    let categoryEntities: Category[] = [];
    if (categories && categories.length > 0) {
      categoryEntities = await queryRunner.manager.find(Category, {
        where: { id: In(categories), isActive: true },
      });
      if (categoryEntities.length !== categories.length) {
        throw new BadRequestException('Some categories do not exist');
      }
    }

    const promotion = queryRunner.manager.create(Product, {
      name,
      code,
      cost: 0,
      description,
      price,
      type: 'promotion',
      categories: categoryEntities,
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

  private async createNormalProduct(
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

    const product = queryRunner.manager.create(Product, {
      ...productData,
      cost: 0,
      categories: categoryEntities,
    });
    const savedProduct = await queryRunner.manager.save(product);

    if (ingredients && ingredients.length > 0) {
      const productIngredients = ingredients.map(async (ingredientDto) => {
        const ingredient = await queryRunner.manager.findOne(Ingredient, {
          where: { id: ingredientDto.ingredientId },
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

        const productIngredient = queryRunner.manager.create(
          ProductIngredient,
          {
            product: savedProduct,
            ingredient,
            quantityOfIngredient: ingredientDto.quantityOfIngredient,
            unitOfMeasure,
          },
        );

        if (ingredient.cost) {
          savedProduct.cost +=
            ingredient.cost * ingredientDto.quantityOfIngredient;
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

  private async checkProductUniqueness(
    queryRunner: QueryRunner,
    productData: Partial<Product>,
  ): Promise<void> {
    try {
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

      const existingProductByName = await queryRunner.manager.findOne(Product, {
        where: { name: productData.name },
      });
      if (existingProductByName) {
        throw new ConflictException('Product name already exists');
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
    const { categories, ingredients, ...otherAttributes } = updateData;

    const product = await queryRunner.manager.findOne(Product, {
      where: { id: id, isActive: true },
      relations: [
        'categories',
        'productIngredients',
        'productIngredients.ingredient',
        'productIngredients.unitOfMeasure',
        'stock',
        'stock.unitOfMeasure',
      ],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID: ${id} not found`);
    }

    Object.assign(product, otherAttributes);

    product.cost = 0;

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

    if (ingredients) {
      if (!product.productIngredients) {
        product.productIngredients = [];
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const existingIngredientIds = product.productIngredients.map(
        (pi) => pi.ingredient.id,
      );
      const newIngredientIds = ingredients.map((i) => i.ingredientId);

      const ingredientsToRemove = product.productIngredients.filter(
        (pi) => !newIngredientIds.includes(pi.ingredient.id),
      );

      await queryRunner.manager.remove(ProductIngredient, ingredientsToRemove);

      const updatedIngredients = await Promise.all(
        ingredients.map(async (ingredientDto) => {
          const ingredient = await queryRunner.manager.findOne(Ingredient, {
            where: { id: ingredientDto.ingredientId },
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

          const existingProductIngredient = product.productIngredients.find(
            (pi) => pi.ingredient.id === ingredientDto.ingredientId,
          );

          if (existingProductIngredient) {
            existingProductIngredient.quantityOfIngredient =
              ingredientDto.quantityOfIngredient;
            existingProductIngredient.unitOfMeasure = unitOfMeasure;
            return queryRunner.manager.save(existingProductIngredient);
          } else {
            const productIngredient = queryRunner.manager.create(
              ProductIngredient,
              {
                product,
                ingredient,
                quantityOfIngredient: ingredientDto.quantityOfIngredient,
                unitOfMeasure,
              },
            );
            return queryRunner.manager.save(productIngredient);
          }
        }),
      );

      product.productIngredients = updatedIngredients;

      for (const ingredientDto of ingredients) {
        const ingredient = await queryRunner.manager.findOne(Ingredient, {
          where: { id: ingredientDto.ingredientId },
        });
        if (ingredient && ingredient.cost) {
          product.cost += ingredient.cost * ingredientDto.quantityOfIngredient;
        }
      }
    }

    const updatedProduct = await queryRunner.manager.save(product);

    const productDto = plainToInstance(ProductResponseDto, updatedProduct, {
      excludeExtraneousValues: true,
    });

    return instanceToPlain(productDto) as ProductResponseDto;
  }

  private async updatePromotion(
    queryRunner: QueryRunner,
    id: string,
    updateData: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const { categories, products, ...otherAttributes } = updateData;

    const promotion = await queryRunner.manager.findOne(Product, {
      where: { id: id, isActive: true },
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
}
