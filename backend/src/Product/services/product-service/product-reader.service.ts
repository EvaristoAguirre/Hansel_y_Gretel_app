import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductRepository } from '../../repositories/product.repository';
import { LoggerService } from 'src/Monitoring/monitoring-logger.service';
import { ProductResponseDto } from 'src/DTOs/productResponse.dto';
import { ProductOrderingResponseDto } from 'src/DTOs/productOrderingResponse.dto';
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

  async searchForOrdering(
    name?: string,
    code?: string,
    categories?: string[],
    limit: number = 10,
  ): Promise<ProductOrderingResponseDto[]> {
    const products = await this.productRepository.searchForOrdering(
      name,
      code,
      categories,
      limit,
    );

    const formatter = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    const formatterStock = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

    return products.map((product): ProductOrderingResponseDto => ({
      id: product.id,
      code: product.code,
      name: product.name,
      description: product.description,
      price: formatter.format(Number(product.price)),
      type: product.type as 'product' | 'promotion' | 'simple',
      allowsToppings: product.allowsToppings ?? false,
      categories: (product.categories ?? []).map((c) => ({
        id: c.id,
        name: c.name,
      })),
      stock: product.stock
        ? {
            quantityInStock: formatterStock.format(
              Number(product.stock.quantityInStock),
            ),
            minimumStock: formatterStock.format(
              Number(product.stock.minimumStock),
            ),
          }
        : null,
      availableToppingGroups: (product.availableToppingGroups ?? []).map(
        (group) => ({
          id: group.toppingGroup?.id ?? null,
          name: group.toppingGroup?.name ?? '',
          settings: group.settings,
          quantityOfTopping: group.quantityOfTopping,
          unitOfMeasure: group.unitOfMeasure
            ? {
                id: group.unitOfMeasure.id,
                name: group.unitOfMeasure.name,
                abbreviation: group.unitOfMeasure.abbreviation,
              }
            : null,
          toppings: (group.toppingGroup?.toppings ?? []).map((t) => ({
            id: t.id,
            name: t.name,
          })),
        }),
      ),
      promotionSlotAssignments: (product.promotionSlotAssignments ?? [])
        .filter((a) => a.slot !== null)
        .map((assignment) => ({
          quantity: assignment.quantity,
          isOptional: assignment.isOptional,
          slot: {
            id: assignment.slot.id,
            name: assignment.slot.name,
            description: assignment.slot.description,
            options: (assignment.slot.options ?? []).map((opt) => ({
              id: opt.id,
              extraCost: opt.extraCost,
              isActive: opt.isActive,
              product: opt.product
                ? {
                    id: opt.product.id,
                    name: opt.product.name,
                    price: formatter.format(Number(opt.product.price)),
                    type: opt.product.type,
                  }
                : null,
            })),
          },
        })),
    }));
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
