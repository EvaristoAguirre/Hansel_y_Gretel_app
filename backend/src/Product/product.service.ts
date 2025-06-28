/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from '../DTOs/create-product.dto';
import { UpdateProductDto } from 'src/DTOs/update-product-dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProductResponseDto } from 'src/DTOs/productResponse.dto';
import { CheckStockDto } from 'src/DTOs/checkStock.dto';
import { Product } from './product.entity';
import { ProductRepository } from 'src/Product/product.repository';
import { ProductMapper } from './productMapper';
import { isUUID } from 'class-validator';
import { StockService } from 'src/Stock/stock.service';
import { UnitOfMeasureService } from 'src/UnitOfMeasure/unitOfMeasure.service';
import { CostCascadeService } from 'src/CostCascade/cost-cascade.service';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly stockService: StockService,
    private readonly unitOfMeasureService: UnitOfMeasureService,
    private readonly costCascadeService: CostCascadeService,
  ) {}

  async getAllProducts(
    page: number,
    limit: number,
  ): Promise<ProductResponseDto[]> {
    try {
      const products = await this.productRepository.getAllProducts(page, limit);
      return ProductMapper.toResponseDtoArray(products);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      throw new InternalServerErrorException(
        'Error fetching the products',
        error.message,
      );
    }
  }

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
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error fetching the product',
        error.message,
      );
    }
  }

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
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error fetching the product',
        error.message,
      );
    }
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

    this.eventEmitter.emit('product.created', {
      product: productCreated,
    });
    return productCreated;
  }

  async updateProduct(
    id: string,
    updateData: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const currentProduct = await this.productRepository.getProductById(id);

    const productUpdated = await this.productRepository.updateProduct(
      id,
      updateData,
    );

    if (
      currentProduct.type === 'simple' &&
      typeof updateData.cost === 'number' &&
      updateData.cost !== currentProduct.cost
    ) {
      console.log(
        `⚙️ Detected cost change in simple product ${id}. Triggering cascade...`,
      );
      const cascadeResult =
        await this.costCascadeService.updateSimpleProductCostAndCascade(
          productUpdated.id,
          updateData.cost,
        );
      if (cascadeResult.success) {
        console.log(`📦 Producto ${id} actualizado. Promociones afectadas:`);
        for (const promoId of cascadeResult.updatedPromotions) {
          console.log(`🎁 -> Promoción recalculada: ${promoId}`);
        }
      } else {
        console.error(
          `⚠️ Falló la cascada de costos para producto ${id}: ${cascadeResult.message}`,
        );
      }
    }

    this.eventEmitter.emit('product.updated', {
      product: productUpdated,
    });

    return productUpdated;
  }

  async deleteProduct(id: string) {
    if (!id) {
      throw new BadRequestException('Product id must be provided.');
    }
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
    try {
      const productDeleted = await this.productRepository.deleteProduct(id);

      this.eventEmitter.emit('product.deleted', {
        product: productDeleted,
      });

      return productDeleted;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error fetching the product',
        error.message,
      );
    }
  }

  async searchProducts(
    name?: string,
    code?: string,
    categories?: string[],
    isActive?: boolean,
    page?: number,
    limit?: number,
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

  async checkProductsStockAvailability(
    dataToCheck: CheckStockDto,
  ): Promise<any> {
    const { productId, quantityToSell } = dataToCheck;

    if (!isUUID(productId)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }

    const product = await this.productRepository.getProductById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.type === 'promotion') {
      const promotion = await this.productRepository.getProductWithRelations(
        productId,
        'promotion',
      );
      return this.checkPromotionStock(promotion, quantityToSell);
    } else {
      const product = await this.productRepository.getProductWithRelations(
        productId,
        'product',
      );
      return this.checkProductStock(product, quantityToSell);
    }
  }

  private async checkProductStock(
    product: Product,
    quantityToSell: number,
  ): Promise<any> {
    if (!product.productIngredients?.length) {
      // Producto simple sin ingredientes
      if (!product.stock) {
        return {
          available: false,
          message: 'El producto no tiene información de stock',
        };
      }

      const available = product.stock.quantityInStock;
      return available >= quantityToSell
        ? { available: true }
        : {
            available: false,
            message: `Stock insuficiente. Disponible: ${available}, Requerido: ${quantityToSell}`,
            details: {
              available,
              required: quantityToSell,
              deficit: quantityToSell - available,
            },
          };
    }

    // Producto compuesto
    const checks = await Promise.all(
      product.productIngredients.map(async (pi) => {
        const ingredientStock = await this.stockService.getStockByIngredientId(
          pi.ingredient.id,
        );

        if (!ingredientStock.quantityInStock) {
          return {
            available: false,
            ingredientId: pi.ingredient.id,
            ingredientName: pi.ingredient.name,
            message: 'El ingrediente no tiene información de stock',
          };
        }

        let requiredQuantity = pi.quantityOfIngredient;

        if (pi.unitOfMeasure?.id !== ingredientStock.unitOfMeasure?.id) {
          requiredQuantity = await this.unitOfMeasureService.convertUnit(
            pi.unitOfMeasure.id,
            ingredientStock.unitOfMeasure.id,
            requiredQuantity,
          );
        }

        const totalRequired = requiredQuantity * quantityToSell;
        const available = Number(ingredientStock.quantityInStock);

        return {
          available: available >= totalRequired,
          ingredientId: pi.ingredient.id,
          ingredientName: pi.ingredient.name,
          requiredQuantity: totalRequired,
          availableQuantity: available,
          deficit: available >= totalRequired ? 0 : totalRequired - available,
          unitOfMeasure: ingredientStock.unitOfMeasure.name,
        };
      }),
    );

    const allAvailable = checks.every((r) => r.available);

    return allAvailable
      ? { available: true }
      : {
          available: false,
          message: 'Stock insuficiente para algunos ingredientes',
          details: checks.filter((r) => !r.available),
        };
  }

  // private async checkPromotionStock(
  //   promotion: Product,
  //   quantityToSell: number,
  // ): Promise<any> {
  //   if (!promotion.promotionDetails?.length) {
  //     return {
  //       available: false,
  //       message: 'Promotion has no associated products',
  //     };
  //   }

  //   const checks = await Promise.all(
  //     promotion.promotionDetails.map(async (pp) => {
  //       const product = pp.product;
  //       const requiredQty = pp.quantity * quantityToSell;

  //       if (!product.productIngredients?.length) {
  //         // Producto simple sin ingredientes
  //         const stock = product.stock;
  //         if (!stock) {
  //           return {
  //             available: false,
  //             productId: product.id,
  //             productName: product.name,
  //             message: 'El producto no tiene información de stock',
  //           };
  //         }

  //         const available = stock.quantityInStock;
  //         return available >= requiredQty
  //           ? {
  //               available: true,
  //               productId: product.id,
  //               productName: product.name,
  //             }
  //           : {
  //               available: false,
  //               productId: product.id,
  //               productName: product.name,
  //               message: `Stock insuficiente. Disponible: ${available}, Requerido: ${requiredQty}`,
  //               details: {
  //                 available,
  //                 required: requiredQty,
  //                 deficit: requiredQty - available,
  //               },
  //             };
  //       }

  //       // Producto con ingredientes
  //       const ingredientChecks = await Promise.all(
  //         product.productIngredients.map(async (pi) => {
  //           const stock = await this.stockService.getStockByIngredientId(
  //             pi.ingredient.id,
  //           );

  //           if (!stock.quantityInStock) {
  //             return {
  //               available: false,
  //               ingredientId: pi.ingredient.id,
  //               ingredientName: pi.ingredient.name,
  //               message: 'El ingrediente no tiene información de stock',
  //             };
  //           }

  //           let required = pi.quantityOfIngredient * requiredQty;

  //           if (pi.unitOfMeasure?.id !== stock.unitOfMeasure?.id) {
  //             required = await this.unitOfMeasureService.convertUnit(
  //               pi.unitOfMeasure.id,
  //               stock.unitOfMeasure.id,
  //               required,
  //             );
  //           }

  //           const available = Number(stock.quantityInStock);

  //           return {
  //             available: available >= required,
  //             ingredientId: pi.ingredient.id,
  //             ingredientName: pi.ingredient.name,
  //             requiredQuantity: required,
  //             availableQuantity: available,
  //             deficit: available >= required ? 0 : required - available,
  //             unitOfMeasure: stock.unitOfMeasure.name,
  //           };
  //         }),
  //       );

  //       const allIngredientsOk = ingredientChecks.every((c) => c.available);

  //       return {
  //         available: allIngredientsOk,
  //         productId: product.id,
  //         productName: product.name,
  //         ...(allIngredientsOk
  //           ? {}
  //           : {
  //               message: 'Stock insuficiente para algunos ingredientes',
  //               details: ingredientChecks.filter((c) => !c.available),
  //             }),
  //       };
  //     }),
  //   );

  //   const allProductsAvailable = checks.every((c) => c.available);

  //   return allProductsAvailable
  //     ? { available: true }
  //     : {
  //         available: false,
  //         message: 'Stock insuficiente para algunos productos de la promoción',
  //         details: checks.filter((c) => !c.available),
  //       };
  // }

  private async checkPromotionStock(
    promotion: Product,
    quantityToSell: number,
  ) {
    try {
      if (!promotion) {
        throw new NotFoundException('Promotion not found');
      }

      if (
        !promotion.promotionDetails ||
        promotion.promotionDetails.length === 0
      ) {
        return {
          available: false,
          message: 'Promotion has no associated products',
        };
      }

      const productChecks = await Promise.all(
        promotion.promotionDetails.map(async (pp) => {
          const product = pp.product;

          const requiredQuantity = pp.quantity * quantityToSell;
          if (
            !product.productIngredients ||
            product.productIngredients.length === 0
          ) {
            if (!product.stock) {
              return {
                productId: product.id,
                productName: product.name,
                available: false,
                message: 'El producto no cuenta con información de stock',
              };
            }
            const availableQuantity = product.stock.quantityInStock;
            if (availableQuantity >= requiredQuantity) {
              return {
                productId: product.id,
                productName: product.name,
                available: true,
              };
            } else {
              return {
                productId: product.id,
                productName: product.name,
                available: false,
                message: `Stock insuficiente. Disponible: ${availableQuantity}, Requerido: ${requiredQuantity}`,
                details: {
                  available: availableQuantity,
                  required: requiredQuantity,
                  deficit: requiredQuantity - availableQuantity,
                },
              };
            }
          }

          const ingredientChecks = await Promise.all(
            product.productIngredients.map(async (pi) => {
              const ingredientId = pi.ingredient.id;
              const stockOfIngredient =
                await this.stockService.getStockByIngredientId(ingredientId);

              if (!stockOfIngredient.quantityInStock) {
                return {
                  ingredientId: ingredientId,
                  ingredientName: stockOfIngredient.ingredient.name,
                  available: false,
                  message: 'El ingrediente no tiene información de stock',
                };
              }

              let requiredIngredientQuantity =
                pi.quantityOfIngredient * requiredQuantity;

              if (
                pi.unitOfMeasure?.id !== stockOfIngredient.unitOfMeasure?.id
              ) {
                try {
                  requiredIngredientQuantity =
                    await this.unitOfMeasureService.convertUnit(
                      pi.unitOfMeasure.id,
                      stockOfIngredient.unitOfMeasure.id,
                      pi.quantityOfIngredient * requiredQuantity,
                    );
                } catch (error) {
                  return {
                    ingredientId: stockOfIngredient.ingredient.id,
                    ingredientName: stockOfIngredient.ingredient.name,
                    available: false,
                    message: `Unit conversion error: ${error.message}`,
                  };
                }
              }

              const availableQuantity = parseFloat(
                stockOfIngredient.quantityInStock,
              );

              return {
                ingredientId: stockOfIngredient.ingredient.id,
                ingredientName: stockOfIngredient.ingredient.name,
                requiredQuantity: requiredIngredientQuantity,
                availableQuantity: availableQuantity,
                available: availableQuantity >= requiredIngredientQuantity,
                unitOfMeasure: stockOfIngredient.unitOfMeasure.name,
                deficit:
                  availableQuantity >= requiredIngredientQuantity
                    ? 0
                    : requiredIngredientQuantity - availableQuantity,
              };
            }),
          );

          const allIngredientsAvailable = ingredientChecks.every(
            (check) => check.available,
          );

          return {
            productId: product.id,
            productName: product.name,
            available: allIngredientsAvailable,
            details: allIngredientsAvailable
              ? null
              : {
                  message: 'Stock insuficiente para algunos ingredientes',
                  ingredientDetails: ingredientChecks.filter(
                    (check) => !check.available,
                  ),
                },
          };
        }),
      );

      const allProductsAvailable = productChecks.every(
        (check) => check.available,
      );

      if (allProductsAvailable) {
        return { available: true };
      } else {
        const unavailableProducts = productChecks.filter(
          (check) => !check.available,
        );
        return {
          available: false,
          message:
            'Stock insuficiente para algunos productos de esta promoción',
          details: unavailableProducts.map((up) => ({
            productId: up.productId,
            productName: up.productName,
            reason: up.message || 'Ingrediente insuficiente',
            details: up.details,
          })),
        };
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error checking promotion stock availability',
        error.message,
      );
    }
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
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error fetching the product',
        error.message,
      );
    }
  }
}
