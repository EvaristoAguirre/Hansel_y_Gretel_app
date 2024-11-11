import { Injectable } from '@nestjs/common';
import { ProductRepository } from './product.repository';
import { UUID } from 'crypto';

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async getAllProducts(page: number, limit: number) {
    return await this.productRepository.getAllProducts(page, limit);
  }

  async getProductById(id: UUID, code: number) {
    return await this.productRepository.getProductById(id, code);
  }
}
