import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { ProductIngredient } from 'src/Ingredient/ingredientProduct.entity';
import { PromotionProduct } from 'src/Product/promotionProducts.entity';
import { DataSource, In, QueryRunner } from 'typeorm';
import { Logger } from '@nestjs/common';
import { CostCascadeResult } from 'src/Types/cost-cascade.type';
import { Product } from 'src/Product/product.entity';
import { isUUID } from 'class-validator';
import { UnitOfMeasureService } from 'src/UnitOfMeasure/unitOfMeasure.service';

@Injectable()
export class CostCascadeService {
  private readonly logger = new Logger(CostCascadeService.name);
  constructor(
    private readonly unitOfMeasureService: UnitOfMeasureService,
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
        const updatedProductId = await this.calculateCompoundProductsCost(
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
          await this.calculatePromotionCost(promotionId, queryRunner);
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

  async calculateCompoundProductsCost(
    productId: string,
    queryRunner?: QueryRunner,
  ): Promise<string> {
    if (!productId || !isUUID(productId)) {
      throw new BadRequestException(
        'Invalid ingredient ID format. Is not posible to calculate the cost',
      );
    }

    const qr = queryRunner ?? this.dataSource.createQueryRunner();
    let releaseQR = false;

    if (!queryRunner) {
      await qr.connect();
      await qr.startTransaction();
      releaseQR = true;
    }

    try {
      // ----revisar las relaciones cargadas en el metodo de este repo con las del repo de producto

      const product = await this.getProductWithRelations(qr, productId);

      // ----revisar las relaciones cargadas en el metodo de este repo con las del repo de producto

      let newCost = 0;

      for (const productIngredient of product.productIngredients) {
        const quantity = await this.unitOfMeasureService.convertUnit(
          productIngredient.unitOfMeasure.id,
          productIngredient.ingredient.unitOfMeasure.id,
          productIngredient.quantityOfIngredient,
        );
        newCost += productIngredient.ingredient.cost * quantity;
      }

      product.cost = newCost;

      this.logger.log(
        `📦 Producto compuesto ${product.id} recalculado. Nuevo costo: ${newCost}`,
      );

      await qr.manager.save(product);

      if (releaseQR) await qr.commitTransaction();

      return product.id;
    } catch (error) {
      if (releaseQR) await qr.rollbackTransaction();
      throw error;
    } finally {
      if (releaseQR) await qr.release();
    }
  }

  async calculatePromotionCost(promotionId: string, queryRunner?: QueryRunner) {
    this.logger.log(`📊 Iniciando cálculo de promoción ${promotionId}`);

    if (!promotionId || !isUUID(promotionId)) {
      throw new BadRequestException(
        'Invalid promotion ID format. Is not posible to calculate the cost',
      );
    }
    const qr = queryRunner ?? this.dataSource.createQueryRunner();
    let releaseQR = false;

    if (!queryRunner) {
      await qr.connect();
      await qr.startTransaction();
      releaseQR = true;
    }

    try {
      // 1. Obtener todos los productos asociados a la promoción
      const promoProducts = await qr.manager.find(PromotionProduct, {
        where: { promotion: { id: promotionId } },
        relations: ['product', 'promotion'],
      });

      if (promoProducts.length === 0) {
        throw new NotFoundException(
          `No products found in promotion ${promotionId}`,
        );
      }

      // 2. Calcular el costo total
      let totalCost = 0;
      for (const item of promoProducts) {
        const quantity = item.quantity ?? 1;
        const productCost = item.product.cost ?? 0;
        totalCost += productCost * quantity;
      }

      // 3. Actualizar el costo en la entidad Product (que representa la promoción)
      await qr.manager.update(Product, promotionId, {
        cost: totalCost,
      });

      if (releaseQR) await qr.commitTransaction();
      this.logger.log(
        `🎁 Promoción ${promotionId} recalculada. Nuevo costo total: ${totalCost}`,
      );

      return totalCost;
    } catch (error) {
      if (releaseQR) await qr.rollbackTransaction();
      throw error;
    } finally {
      if (releaseQR) await qr.release();
    }
  }

  async updateSimpleProductCostAndCascade(
    productId: string,
    newCost: number,
    externalQueryRunner?: QueryRunner,
  ): Promise<CostCascadeResult> {
    this.logger.log(
      `🔁 Iniciando cascada de costo para producto simple ${productId} con nuevo costo ${newCost}`,
    );
    if (!productId || !isUUID(productId)) {
      throw new BadRequestException('Invalid product ID format');
    }

    const queryRunner =
      externalQueryRunner ?? this.dataSource.createQueryRunner();
    const isExternal = !!externalQueryRunner;

    if (!isExternal) {
      await queryRunner.connect();
      await queryRunner.startTransaction();
    }

    const updatedPromotions = new Set<string>();

    try {
      // // 1. Actualizar costo del producto simple
      // await queryRunner.manager.update(Product, productId, {
      //   cost: newCost,
      // });
      // this.logger.log(
      //   `✅ Producto simple ${productId} actualizado con nuevo costo: ${newCost}`,
      // );

      // 2. Buscar promociones afectadas
      const promoLinks = await queryRunner.manager.find(PromotionProduct, {
        where: { product: { id: productId } },
        relations: ['promotion', 'product'],
      });

      for (const link of promoLinks) {
        updatedPromotions.add(link.promotion.id);
      }

      for (const promotionId of updatedPromotions) {
        await this.calculatePromotionCost(promotionId, queryRunner);
      }

      if (!isExternal) await queryRunner.commitTransaction();

      this.logger.log(
        `✅ Cascada finalizada para producto simple ${productId}`,
      );

      return {
        success: true,
        updatedProducts: [productId],
        updatedPromotions: Array.from(updatedPromotions),
      };
    } catch (error) {
      if (!isExternal) await queryRunner.rollbackTransaction();

      this.logger.error(
        `❌ Error durante la cascada de producto simple ${productId}: ${error.message}`,
      );

      return {
        success: false,
        updatedProducts: [productId],
        updatedPromotions: Array.from(updatedPromotions),
        message: error.message,
      };
    } finally {
      if (!isExternal) await queryRunner.release();
    }
  }

  private async getProductWithRelations(
    queryRunner: QueryRunner,
    productId: string,
  ): Promise<Product> {
    const product = await queryRunner.manager.findOne(Product, {
      where: { id: productId },
      relations: [
        'productIngredients',
        'productIngredients.ingredient',
        'productIngredients.unitOfMeasure',
        'productIngredients.ingredient.unitOfMeasure',
      ],
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    return product;
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
