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
import { DataSource, ILike, In, Raw, Repository } from 'typeorm';
import { CreateProductDto } from 'src/DTOs/create-product.dto';
import { UpdateProductDto } from 'src/DTOs/update-product-dto';
import { Category } from 'src/Category/category.entity';
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { ProductIngredient } from 'src/Ingredient/ingredientProduct.entity';
import { UnitOfMeasure } from 'src/Ingredient/unitOfMesure.entity';
import { ProductResponseDto } from 'src/DTOs/updateProductResponse.dto';
import { instanceToPlain, plainToInstance } from 'class-transformer';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(UnitOfMeasure)
    private readonly unitOfMeasureRepository: Repository<UnitOfMeasure>,
    private readonly dataSource: DataSource,
  ) {}

  //---- Estandarizado
  async getAllProducts(page: number, limit: number): Promise<Product[]> {
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

  async getProductsByCategories(categories: string[]): Promise<Product[]> {
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
        .where((qb) => {
          // Subconsulta para verificar que el producto tenga todas las categorías
          const subQuery = qb
            .subQuery()
            .select('pc.productId')
            .from('product_categories_category', 'pc')
            .where('pc.categoryId IN (:...categories)', { categories })
            .groupBy('pc.productId')
            .having('COUNT(pc.categoryId) = :numCategories', {
              numCategories: categories.length,
            })
            .getQuery();
          return `product.id IN ${subQuery}`;
        })
        .andWhere('product.isActive = :isActive', { isActive: true })
        .getMany();
      // Transformar la respuesta usando DTOs
      return products;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        'An error occurred while fetching products. Please try again.',
        error.message,
      );
    }
  }

  //---- Estandarizado
  async createProduct(productToCreate: CreateProductDto): Promise<Product> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { categories, ingredients, ...productData } = productToCreate;

      const existingProductByCode = await queryRunner.manager.findOne(Product, {
        where: { code: productData.code },
      });
      if (existingProductByCode) {
        throw new ConflictException('Product code already exists');
      }

      const existingProductByName = await queryRunner.manager.findOne(Product, {
        where: { name: productData.name },
      });
      if (existingProductByName) {
        throw new ConflictException('Product name already exists');
      }

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

          const productIngredient = queryRunner.manager.create(
            ProductIngredient,
            {
              product: savedProduct,
              ingredient,
              quantityOfIngredient: ingredientDto.quantityOfIngredient,
              unitOfMeasure,
            },
          );

          return queryRunner.manager.save(productIngredient);
        });

        await Promise.all(productIngredients);
      }

      const relationsToLoad = ['categories'];

      if (ingredients && ingredients.length > 0) {
        relationsToLoad.push(
          'productIngredients',
          'productIngredients.ingredient',
          'productIngredients.unitOfMeasure',
        );
      }

      const productWithRelations = await queryRunner.manager.findOne(Product, {
        where: { id: savedProduct.id },
        relations: relationsToLoad,
      });

      if (!productWithRelations) {
        throw new NotFoundException('Product not found after creation');
      }

      await queryRunner.commitTransaction();

      return productWithRelations;
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

  //---- Estandarizado
  async updateProduct(
    id: string,
    updateData: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { categories, ingredients, ...otherAttributes } = updateData;

      const product = await queryRunner.manager.findOne(Product, {
        where: { id: id, isActive: true },
        relations: [
          'categories',
          'productIngredients',
          'productIngredients.ingredient',
          'productIngredients.unitOfMeasure',
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

        await queryRunner.manager.remove(
          ProductIngredient,
          ingredientsToRemove,
        );

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
      }

      const updatedProduct = await queryRunner.manager.save(product);

      await queryRunner.commitTransaction();

      const productDto = plainToInstance(ProductResponseDto, updatedProduct, {
        excludeExtraneousValues: true,
      });

      const plainProduct = instanceToPlain(productDto);

      return plainProduct as ProductResponseDto;
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

  //---- Estandarizado
  async searchProducts(
    name?: string,
    code?: string,
    categories?: string[],
    isActive: boolean = true,
    page: number = 1,
    limit: number = 10,
  ): Promise<Product[]> {
    try {
      if (!name && !code) {
        throw new BadRequestException(
          'At least a name or a code must be provided for search.',
        );
      }

      let filteredProducts: Product[] = [];
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
}
