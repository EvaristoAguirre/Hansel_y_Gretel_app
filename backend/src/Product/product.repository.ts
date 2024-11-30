import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { In, QueryFailedError, Repository } from 'typeorm';
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
  ) {}

  async getAllProducts(page: number, limit: number): Promise<Product[]> {
    if (page <= 0 || limit <= 0) {
      throw new BadRequestException(
        'Page and limit must be positive integers.',
      );
    }
    try {
      return await this.productRepository.find({
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch (error) {
      throw new InternalServerErrorException('Error fetching products', error);
    }
  }

  async getProductById(id: string): Promise<Product> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }

    try {
      const product = await this.productRepository.findOne({
        where: { id },
        relations: ['categories'],
      });
      if (!product) {
        throw new NotFoundException(`Product not found with  id: ${id}`);
      }
      return product;
    } catch (error) {
      throw new InternalServerErrorException(
        'Error fetching the product',
        error,
      );
    }
  }
  async getProductByCode(code: number): Promise<Product> {
    if (!code) {
      throw new BadRequestException('Either code must be provided.');
    }

    try {
      const product = await this.productRepository.findOneBy({ code });

      if (!product) {
        throw new NotFoundException(`Product not found with  code: ${code}`);
      }
      return product;
    } catch (error) {
      throw new InternalServerErrorException(
        'Error fetching the product',
        error,
      );
    }
  }

  async getProductsByCategories(categoryIds: string[]): Promise<Product[]> {
    if (!categoryIds || categoryIds.length === 0) {
      throw new BadRequestException(
        'At least one category ID must be provided.',
      );
    }

    try {
      const products = await this.productRepository
        .createQueryBuilder('product')
        .innerJoin('product.categories', 'category')
        .where('category.id IN (:...categoryIds)', { categoryIds })
        .groupBy('product.id')
        .having('COUNT(product.id) = :numCategories', {
          numCategories: categoryIds.length,
        })
        .getMany();

      if (products.length === 0) {
        throw new NotFoundException(
          `No products found for the given categories: ${categoryIds.join(', ')}`,
        );
      }

      return products;
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw new InternalServerErrorException(
          'Database query failed. Please check the query syntax or data integrity.',
        );
      }
      throw new InternalServerErrorException(
        'An unexpected error occurred while fetching products.',
      );
    }
  }

  async createProduct(productToCreate: CreateProductDto): Promise<Product> {
    const { categories, ...productData } = productToCreate;

    try {
      let categoryEntities: Category[] = [];
      if (categories && categories.length > 0) {
        categoryEntities = await this.categoryRepository.find({
          where: { id: In(categories) },
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
      throw new InternalServerErrorException(
        'Error creating the product.',
        error,
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
    const { categoriesIds, ...otherAttributes } = updateData;

    try {
      const product = await this.productRepository.findOne({
        where: { id: id },
        relations: ['categories'],
      });

      if (!product) {
        throw new Error(`Product with ID: ${id} not found`);
      }
      Object.assign(product, otherAttributes);

      if (categoriesIds && categoriesIds.length > 0) {
        const categoriesFinded = await this.categoryRepository.find({
          where: { id: In(categoriesIds), isActive: true },
        });

        if (categoriesFinded.length === 0) {
          throw new Error('No valid categories found');
        }
        product.categories = categoriesFinded;
      }
      return this.productRepository.save(product);
    } catch (error) {
      throw new InternalServerErrorException(
        'Error updating the product.',
        error,
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
      throw new InternalServerErrorException(
        'Error deleting the product.',
        error,
      );
    }
  }
}
