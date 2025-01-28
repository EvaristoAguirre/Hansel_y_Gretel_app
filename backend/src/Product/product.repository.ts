import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { DataSource, In, Repository } from 'typeorm';
import { CreateProductDto } from 'src/DTOs/create-product.dto';
import { UpdateProductDto } from 'src/DTOs/update-product-dto';
import { Category } from 'src/Category/category.entity';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
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
        relations: ['categories'],
      });
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
    console.log(code);
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
      throw new Error('At least one category ID must be provided.');
    }
    try {
      return await this.dataSource
        .createQueryBuilder(Product, 'product')
        .innerJoin('product.categories', 'category')
        .where('category.id IN (:...categories)', { categories })
        .groupBy('product.id')
        .having('COUNT(DISTINCT category.id) = :numCategories', {
          numCategories: categories.length,
        })
        .getMany();
    } catch (error) {
      console.error('error in get...', error);
      throw new InternalServerErrorException(
        'An error occurred while fetching products. Please try again.',
        error.message,
      );
    }
  }

  async createProduct(productToCreate: CreateProductDto): Promise<Product> {
    const { categories, ...productData } = productToCreate;

    try {
      let categoryEntities: Category[] = [];
      if (categories && categories.length > 0) {
        categoryEntities = await this.categoryRepository.find({
          where: { id: In(categories), isActive: true },
        });
        if (categoryEntities.length !== categories.length) {
          throw new BadRequestException('Some categories do not exist');
        }
      }
      const product = this.productRepository.create({
        ...productData,
        categories: categoryEntities,
      });
      return await this.productRepository.save(product);
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
        relations: ['categories'],
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
}
