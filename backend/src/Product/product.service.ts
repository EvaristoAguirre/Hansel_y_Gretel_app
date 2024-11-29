import { Injectable } from '@nestjs/common';
import { ProductRepository } from './product.repository';
import { CreateProductDto } from '../DTOs/create-product.dto';
import { UpdateProductDto } from 'src/DTOs/update-product-dto';
import { Product } from './product.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getAllProducts(page: number, limit: number) {
    return await this.productRepository.getAllProducts(page, limit);
  }

  async getProductById(id: string) {
    return await this.productRepository.getProductById(id);
  }
  async getProductByCode(code: number) {
    return await this.productRepository.getProductByCode(code);
  }

  async createProduct(productToCreate: CreateProductDto): Promise<Product> {
    const productCreated =
      await this.productRepository.createProduct(productToCreate);

    await this.eventEmitter.emit('product.created', {
      product: productCreated,
    });
    return productCreated;
  }

  async updateProduct(id: string, updateData: UpdateProductDto) {
    const productUpdated = await this.productRepository.updateProduct(
      id,
      updateData,
    );
    await this.eventEmitter.emit('product.updated', {
      product: productUpdated,
    });
    return productUpdated;
  }

  async deleteProduct(id: string) {
    const productDeleted = await this.productRepository.deleteProduct(id);
    await this.eventEmitter.emit('product.deleted', {
      product: productDeleted,
    });
    return productDeleted;
  }
}
