import { Injectable } from '@nestjs/common';
import { CostCascadeService } from 'src/CostCascade/cost-cascade.service';
import { ProductResponseDto } from 'src/DTOs/productResponse.dto';
import { LoggerService } from 'src/Monitoring/monitoring-logger.service';
import { UpdateProductDto } from 'src/Product/dtos/update-product-dto';
import { ProductRepository } from 'src/Product/repositories/product.repository';

@Injectable()
export class ProductUpdaterService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly monitoringLogger: LoggerService,
    private readonly costCascadeService: CostCascadeService,
  ) {}

  // ------- rta en string sin decimales y punto de mil
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
      typeof updateData.baseCost === 'number' &&
      updateData.baseCost !== currentProduct.baseCost
    ) {
      const cascadeResult =
        await this.costCascadeService.updateSimpleProductCostAndCascade(
          productUpdated.id,
          updateData.baseCost,
        );
      if (cascadeResult.success) {
        this.monitoringLogger.log({
          message: 'Cost cascade updated successfully',
          productId: productUpdated.id,
          promotionsAffected: cascadeResult.updatedPromotions,
        });
      } else {
        this.monitoringLogger.error('Cost cascade failed', {
          productId: productUpdated.id,
          error: cascadeResult.message,
        });
      }
    }

    if (
      currentProduct.type === 'product' &&
      Number(productUpdated.cost) !== Number(currentProduct.cost)
    ) {
      const cascadeResult =
        await this.costCascadeService.updateSimpleProductCostAndCascade(
          productUpdated.id,
          updateData.baseCost,
        );
      if (cascadeResult.success) {
        this.monitoringLogger.log({
          message: 'Cost cascade updated successfully',
          productId: productUpdated.id,
          promotionsAffected: cascadeResult.updatedPromotions,
        });
      } else {
        this.monitoringLogger.error('Cost cascade failed', {
          productId: productUpdated.id,
          error: cascadeResult.message,
        });
      }
    }

    return productUpdated;
  }
}
