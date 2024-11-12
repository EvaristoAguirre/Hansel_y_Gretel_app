import { Injectable } from '@nestjs/common';
import { ProductRepository } from './product.repository';
import { UUID } from 'crypto';
import { CreateProductDto } from '../DTOs/create-product.dto';
import { UpdateProductDto } from 'src/DTOs/update-product-dto';

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async getAllProducts(page: number, limit: number) {
    return await this.productRepository.getAllProducts(page, limit);
  }

  async getProductById(id: UUID, code: number) {
    return await this.productRepository.getProductById(id, code);
  }

  async createProduct(product: CreateProductDto) {
    return await this.productRepository.createProduct(product);
  }

  async updateProduct(id: string, product: UpdateProductDto) {
    return await this.productRepository.updateProduct(id, product);
  }

  async deleteProduct(id: UUID) {
    return await this.productRepository.deleteProduct(id);
  }
}
