import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductRepository } from './product.repository';
import { CreateProductDto } from '../DTOs/create-product.dto';
import { UpdateProductDto } from 'src/DTOs/update-product-dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProductResponseDto } from 'src/DTOs/productResponse.dto';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getAllProducts(
    page: number,
    limit: number,
  ): Promise<ProductResponseDto[]> {
    return await this.productRepository.getAllProducts(page, limit);
  }

  async getProductById(id: string) {
    return await this.productRepository.getProductById(id);
  }
  async getProductByCode(code: number) {
    return await this.productRepository.getProductByCode(code);
  }

  async getProductByName(name: string) {
    return this.productRepository.getProductByName(name);
  }

  async getProductsByCategories(
    categories: string[],
  ): Promise<ProductResponseDto[]> {
    const products =
      await this.productRepository.getProductsByCategories(categories);
    if (products.length === 0) {
      throw new NotFoundException(
        `No products found for the given categories: ${categories.join(', ')}`,
      );
    }
    return products;
  }

  async createProduct(
    productToCreate: CreateProductDto,
  ): Promise<ProductResponseDto> {
    const productCreated =
      await this.productRepository.createProduct(productToCreate);

    await this.eventEmitter.emit('product.created', {
      product: productCreated,
    });
    return productCreated;
  }

  async updateProduct(
    id: string,
    updateData: UpdateProductDto,
  ): Promise<ProductResponseDto> {
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

  async searchProducts(
    name?: string,
    code?: string,
    categories?: string[],
    isActive?: boolean,
    page: number = 1,
    limit: number = 10,
  ): Promise<ProductResponseDto[]> {
    return this.productRepository.searchProducts(
      name,
      code,
      categories,
      isActive,
      page,
      limit,
    );
  }

  async searchProductsToPromotion(
    isActive: boolean,
    page: number,
    limit: number,
    name?: string,
    code?: number,
  ): Promise<ProductResponseDto[]> {
    return this.productRepository.searchProductsToPromotion(
      isActive,
      page,
      limit,
      name,
      code,
    );
  }

  async getSimpleAndCompositeProducts(page: number, limit: number) {
    return this.productRepository.getSimpleAndCompositeProducts(page, limit);
  }
}
