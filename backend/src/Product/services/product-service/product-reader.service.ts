import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductRepository } from '../../repositories/product.repository';
import { LoggerService } from 'src/Monitoring/monitoring-logger.service';
import { ProductResponseDto } from 'src/DTOs/productResponse.dto';
import { ProductMapper } from 'src/Product/productMapper';
import { isUUID } from 'class-validator';
import { Product } from 'src/Product/entities/product.entity';
import { Logger } from '@nestjs/common';

@Injectable()
export class ProductReaderService {
  private readonly logger = new Logger(ProductReaderService.name);
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly monitoringLogger: LoggerService,
  ) {}

  // ------- rta en string sin decimales y punto de mil
  async getAllProducts(
    page: number,
    limit: number,
  ): Promise<ProductResponseDto[]> {
    try {
      const products = await this.productRepository.getAllProducts(page, limit);
      return ProductMapper.toResponseDtoArray(products);
    } catch (error) {
      this.logger.error('getAllProducts', error);
      throw error;
    }
  }

  // ------- rta en string sin decimales y punto de mil
  async getProductById(id: string): Promise<ProductResponseDto> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
    try {
      const product = await this.productRepository.getProductById(id);
      return ProductMapper.toResponseDto(product);
    } catch (error) {
      this.logger.error('getProductByIdToAnotherService', error);
      throw error;
    }
  }

  // ---------- CUIDADO QUE ESTE ES PARA OTRO SERVICIO
  async getProductByIdToAnotherService(id: string): Promise<Product> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
    try {
      const product =
        await this.productRepository.getProductByIdToAnotherService(id);
      return product;
    } catch (error) {
      this.logger.error('getProductByIdToAnotherService', error);
      throw error;
    }
  }

  // ------- rta en string sin decimales y punto de mil
  async getProductByCode(code: number): Promise<ProductResponseDto> {
    return await this.productRepository.getProduct({ code });
  }

  // ------- rta en string sin decimales y punto de mil
  async getProductByName(name: string): Promise<ProductResponseDto> {
    return this.productRepository.getProduct({ name });
  }

  // ------- rta en string sin decimales y punto de mil
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

  // ------- rta en string sin decimales y punto de mil
  async searchProducts(
    name?: string,
    code?: string,
    categories?: string[],
    isActive?: boolean,
    page?: number,
    limit?: number,
    type?: string,
  ): Promise<ProductResponseDto[]> {
    return this.productRepository.searchProducts(
      name,
      code,
      categories,
      isActive,
      page,
      limit,
      type,
    );
  }

  // ------- rta en string sin decimales y punto de mil
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

  // ------- rta en string sin decimales y punto de mil
  async getSimpleAndCompositeProducts(
    page: number,
    limit: number,
  ): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.getSimpleAndCompositeProducts(
      page,
      limit,
    );
    return ProductMapper.toResponseDtoArray(products);
  }

  async getProductsWithStock(): Promise<Product[]> {
    return this.productRepository.getProductsWithStock();
  }

  async getPromotionProductsToAnotherService(promotionId: string) {
    if (!promotionId) {
      throw new BadRequestException('Either ID must be provided.');
    }
    if (!isUUID(promotionId)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
    try {
      return await this.productRepository.getPromotionProductsToAnotherService(
        promotionId,
      );
    } catch (error) {
      this.logger.error('getPromotionProductsToAnotherService', error);
      throw error;
    }
  }
}
