import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { ProductIngredient } from 'src/Ingredient/ingredientProduct.entity';
import { PromotionProduct } from 'src/Product/promotionProducts.entity';
import { DataSource, In, QueryRunner } from 'typeorm';
import { Logger } from '@nestjs/common';

import { CostCascadeResult } from './cost-cascade.type';
import { ProductService } from 'src/Product/product.service';

@Injectable()
export class CostCascadeService {
  private readonly logger = new Logger(CostCascadeService.name);
  constructor(
    private readonly productService: ProductService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async updateIngredientCostAndCascade(
    ingredientId: string,
    newCost: number,
    externalQueryRunner?: QueryRunner,
  ): Promise<CostCascadeResult> {
    this.logger.log(
      `🔁 Iniciando cascada de costo para ingrediente ${ingredientId} con nuevo costo ${newCost}`,
    );

    const queryRunner =
      externalQueryRunner ?? this.dataSource.createQueryRunner();
    const isExternal = !!externalQueryRunner;

    if (!isExternal) {
      await queryRunner.connect();
      await queryRunner.startTransaction();
    }
    const updatedProducts = new Set<string>();
    const updatedPromotions = new Set<string>();

    try {
      // 1. Actualizar costo del ingrediente
      await queryRunner.manager.update(Ingredient, ingredientId, {
        cost: newCost,
      });
      this.logger.log(
        `✅ Ingrediente ${ingredientId} actualizado con nuevo costo: ${newCost}`,
      );

      // -------------------------- llamo a productService.calculateCompoundProductsCost

      // 2. Productos compuestos afectados
      const productIngredients = await queryRunner.manager.find(
        ProductIngredient,
        {
          where: { ingredient: { id: ingredientId } },
          relations: ['product', 'ingredient', 'unitOfMeasure'],
        },
      );

      for (const pi of productIngredients) {
        const productId = pi.product.id;
        const updatedProductId =
          await this.productService.calculateCompoundProductsCost(
            productId,
            queryRunner,
          );
        this.logger.log(
          `🧮 Producto afectado por ingrediente ${ingredientId}: ${productId}`,
        );

        updatedProducts.add(updatedProductId);
      }
      // ----------------------------------------- cierro la parte de producto compuesto

      // -------------------------Actualizo Promociones que incluyen productos recien actualizados

      if (updatedProducts.size > 0) {
        const productIds = Array.from(updatedProducts);
        const promoLinks = await queryRunner.manager.find(PromotionProduct, {
          where: { product: { id: In(productIds) } },
          relations: ['promotion', 'product'],
        });

        for (const link of promoLinks) {
          const promotionId = link.promotion.id;
          updatedPromotions.add(promotionId);
        }

        for (const promotionId of updatedPromotions) {
          await this.productService.calculatePromotionCost(
            promotionId,
            queryRunner,
          );
        }
      }

      if (!isExternal) await queryRunner.commitTransaction();
      this.logger.log(`✅ Cascada finalizada para ingrediente ${ingredientId}`);

      return {
        success: true,
        updatedProducts: Array.from(updatedProducts),
        updatedPromotions: Array.from(updatedPromotions),
      };
    } catch (error) {
      if (!isExternal) await queryRunner.rollbackTransaction();

      this.logger.error(
        `❌ Error durante la cascada de costo del ingrediente ${ingredientId}: ${error.message}`,
      );

      return {
        success: false,
        updatedProducts: Array.from(updatedProducts),
        updatedPromotions: Array.from(updatedPromotions),
        message: error.message,
      };
    } finally {
      if (!isExternal) await queryRunner.release();
    }
  }
}

// 3. Productos simples o compuestos con toppings pagos
//   const toppingLinks = await queryRunner.manager.find(
//     ProductAvailableToppingGroup,
//     {
//       where: {
//         ingredient: { id: ingredientId },
//         settings: { chargeExtra: true },
//       },
//       relations: ['product', 'ingredient'],
//     },
//   );

//   for (const link of toppingLinks) {
//     const productId = link.product.id;
//     const newToppingCost = await this.calculateToppingCost(
//       productId,
//       queryRunner,
//     );
//     await queryRunner.manager.update(Product, productId, {
//       cost: newToppingCost,
//     });
//     updatedProducts.add(productId);
//   }
