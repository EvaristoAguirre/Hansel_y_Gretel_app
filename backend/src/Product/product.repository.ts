import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { In, Repository } from 'typeorm';
import { UUID } from 'crypto';
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

  async getAllProducts(page: number, limit: number) {
    return await this.productRepository.find({
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async getProductById(id: UUID, code: number) {
    if (id) {
      return await this.productRepository.findOne({
        where: { id },
        relations: ['categories'],
      });
    }
    if (code) {
      return await this.productRepository.findOne({
        where: { code },
        relations: ['categories'],
      });
    }
  }

  async createProduct(productToCreate: CreateProductDto): Promise<Product> {
    const { categories, ...productData } = productToCreate;

    let categoryEntities: Category[] = [];
    if (categories && categories.length > 0) {
      categoryEntities = await this.categoryRepository.find({
        where: { id: In(categories) },
      });
    }
    const product = this.productRepository.create({
      ...productData,
      categories: categoryEntities,
    });
    return await this.productRepository.save(product);
  }

  async updateProduct(id: string, productToUpdate: UpdateProductDto) {
    const { categories, ...productData } = productToUpdate;
    let categoryEntities: Category[] = [];
    if (categories && categories.length > 0) {
      categoryEntities = await this.categoryRepository.find({
        where: { id: In(categories) },
      });
    }
    await this.productRepository.update(id, {
      ...productData,
      categories: categoryEntities,
    });
    return await this.productRepository.findOneOrFail({ where: { id } });
  }

  async deleteProduct(id: string) {
    return await this.productRepository.delete(id);
  }

  // async getProductsByCategories(categoryIds: string[]): Promise<Product[]> {
  //   return await this.productRepository
  //     .createQueryBuilder('product')
  //     .innerJoin('product.categories', 'category')
  //     .where('category.id IN (:...categoryIds)', { categoryIds })
  //     .groupBy('product.id')
  //     .having('COUNT(product.id) = :numCategories', { numCategories: categoryIds.length })
  //     .getMany();
  // }
}
