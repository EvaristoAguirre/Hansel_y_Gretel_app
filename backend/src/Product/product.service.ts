import { Injectable } from '@nestjs/common';
import { ProductRepository } from './product.repository';
import { CreateProductDto } from '../DTOs/create-product.dto';
import { UpdateProductDto } from 'src/DTOs/update-product-dto';
import { Product } from './product.entity';

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async getAllProducts(page: number, limit: number) {
    return await this.productRepository.getAllProducts(page, limit);
  }

  async getProductById(id: string, code: number) {
    return await this.productRepository.getProductById(id, code);
  }

  async createProduct(productToCreate: CreateProductDto): Promise<Product> {
    return await this.productRepository.createProduct(productToCreate);
  }

  async updateProduct(id: string, updateData: UpdateProductDto) {
    return await this.productRepository.updateProduct(id, updateData);
  }

  async deleteProduct(id: string) {
    return await this.productRepository.deleteProduct(id);
  }
}
