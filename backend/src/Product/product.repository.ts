import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { Repository } from 'typeorm';
import { UUID } from 'crypto';
import { CreateProductDto } from 'src/DTOs/create-product.dto';
import { UpdateProductDto } from 'src/DTOs/update-product-dto';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
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
      });
    }
    if (code) {
      return await this.productRepository.findOne({
        where: { code },
      });
    }
  }

  async createProduct(product: CreateProductDto) {
    return await this.productRepository.create(product);
  }

  async updateProduct(id: string, product: UpdateProductDto) {
    return await this.productRepository.update(id, product);
  }

  async deleteProduct(id: string) {
    return await this.productRepository.delete(id);
  }
}
