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
      return await this.dataSource
        .createQueryBuilder(Product, 'product')
        .innerJoin('product.categories', 'category')
        .where('category.id IN (:...categories)', {
          categories,
          isActive: true,
        })
        .groupBy('product.id')
        .having('COUNT(DISTINCT category.id) = :numCategories', {
          numCategories: categories.length,
        })
        .getMany();
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        'An error occurred while fetching products. Please try again.',
        error.message,
      );
    }
  }

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

  async updateProduct(
    id: string,
    updateData: UpdateProductDto,
  ): Promise<Product> {
    if (!id) {
      throw new BadRequestException('Product ID must be provided.');
    }

    const { categories, ...otherAttributes } = updateData;
    const categoriesIds = categories;
    try {
      const product = await this.productRepository.findOne({
        where: { id: id, isActive: true },
        relations: [
          'categories',
          'productIngredients',
          'productIngredients.ingredient',
        ],
      });

      if (!product) {
        throw new NotFoundException(`Product with ID: ${id} not found`);
      }

      Object.assign(product, otherAttributes);

      if (categoriesIds) {
        if (categoriesIds.length > 0) {
          const categories = await this.categoryRepository.find({
            where: { id: In(categoriesIds), isActive: true },
          });

          const foundIds = categories.map((cat) => cat.id);
          const invalidIds = categoriesIds.filter(
            (id) => !foundIds.includes(id),
          );
          if (invalidIds.length > 0) {
            throw new BadRequestException(
              `Invalid category IDs: ${invalidIds.join(', ')}`,
            );
          }

          product.categories = categories;
        } else {
          product.categories = [];
        }
      }

      return await this.productRepository.save(product);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error updating the product.',
        error.message,
      );
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

  async searchProducts(
    name?: string,
    code?: string,
    categories?: string[],
    isActive: boolean = true,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Product[]; total: number }> {
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

      const [products, total] = await this.productRepository.findAndCount({
        where: whereConditions,
        relations: [
          'categories',
          'productIngredients',
          'productIngredients.ingredient',
        ],
        skip: offset,
        take: limit,
      });

      if (products.length === 0) {
        const searchCriteria = name ? `name: ${name}` : `code: ${code}`;
        throw new NotFoundException(`No products found with ${searchCriteria}`);
      }

      return { data: products, total };
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
