import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { Repository } from 'typeorm';
import { UUID } from 'crypto';

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
}
