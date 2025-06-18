// import { Injectable } from '@nestjs/common';
// import { InjectDataSource } from '@nestjs/typeorm';
// import { DataSource, In, QueryRunner } from 'typeorm';
// import { Ingredient } from 'src/ingredients/entities/ingredient.entity';
// import { Product } from 'src/products/entities/product.entity';
// import { ProductIngredient } from 'src/products/entities/product-ingredient.entity';
// import { PromotionProduct } from 'src/promotions/entities/promotion-product.entity';
// import { ProductAvailableToppingGroup } from 'src/products/entities/product-available-topping-group.entity';

// @Injectable()
// export class CostCascadeService {
//   constructor(
//     @InjectDataSource()
//     private readonly dataSource: DataSource,
//   ) {}

//   async updateIngredientCostAndCascade(ingredientId: string, newCost: number): Promise<void> {
//     const queryRunner = this.dataSource.createQueryRunner();
//     await queryRunner.connect();
//     await queryRunner.startTransaction();

//     try {
//       // 1. Actualizar costo del ingrediente
//       await queryRunner.manager.update(Ingredient, ingredientId, { cost: newCost });

//       const updatedProducts = new Set<string>();

//       // 2. Productos compuestos afectados
//       const productIngredients = await queryRunner.manager.find(ProductIngredient, {
//         where: { ingredient: { id: ingredientId } },
//         relations: ['product', 'ingredient', 'unitOfMeasure'],
//       });

//       for (const pi of productIngredients) {
//         const productId = pi.product.id;
//         const newProductCost = await this.calculateCompoundCost(productId, queryRunner);
//         await queryRunner.manager.update(Product, productId, { cost: newProductCost });
//         updatedProducts.add(productId);
//       }

//       // 3. Productos simples o compuestos con toppings pagos
//       const toppingLinks = await queryRunner.manager.find(ProductAvailableToppingGroup, {
//         where: {
//           ingredient: { id: ingredientId },
//           settings: { chargeExtra: true },
//         },
//         relations: ['product', 'ingredient'],
//       });

//       for (const link of toppingLinks) {
//         const productId = link.product.id;
//         const newToppingCost = await this.calculateToppingCost(productId, queryRunner);
//         await queryRunner.manager.update(Product, productId, { cost: newToppingCost });
//         updatedProducts.add(productId);
//       }

//       // 4. Promociones que incluyen productos actualizados
//       if (updatedProducts.size > 0) {
//         const productIds = Array.from(updatedProducts);
//         const promoLinks = await queryRunner.manager.find(PromotionProduct, {
//           where: { product: { id: In(productIds) } },
//           relations: ['promotion', 'product'],
//         });

//         const updatedPromotions = new Set<string>();
//         for (const link of promoLinks) {
//           const promoId = link.promotion.id;
//           if (!updatedPromotions.has(promoId)) {
//             const newPromoCost = await this.calculatePromotionCost(promoId, queryRunner);
//             await queryRunner.manager.update(Product, promoId, { cost: newPromoCost });
//             updatedPromotions.add(promoId);
//           }
//         }
//       }

//       await queryRunner.commitTransaction();
//     } catch (error) {
//       await queryRunner.rollbackTransaction();
//       throw error;
//     } finally {
//       await queryRunner.release();
//     }
//   }

//   // ==== Métodos auxiliares con QueryRunner ====

//   private async calculateCompoundCost(productId: string, qr: QueryRunner): Promise<number> {
//     const ingredients = await qr.manager.find(ProductIngredient, {
//       where: { product: { id: productId } },
//       relations: ['ingredient', 'unitOfMeasure'],
//     });

//     let total = 0;
//     for (const item of ingredients) {
//       const cost = item.ingredient.cost ?? 0;
//       total += cost * item.quantityOfIngredient;
//     }

//     return total;
//   }

//   private async calculateToppingCost(productId: string, qr: QueryRunner): Promise<number> {
//     const product = await qr.manager.findOne(Product, { where: { id: productId } });

//     const toppingLinks = await qr.manager.find(ProductAvailableToppingGroup, {
//       where: {
//         product: { id: productId },
//         settings: { chargeExtra: true },
//       },
//       relations: ['ingredient'],
//     });

//     let extra = 0;
//     for (const topping of toppingLinks) {
//       extra += topping.ingredient.cost ?? 0;
//     }

//     return (product?.cost ?? 0) + extra;
//   }

//   private async calculatePromotionCost(promoId: string, qr: QueryRunner): Promise<number> {
//     const items = await qr.manager.find(PromotionProduct, {
//       where: { promotion: { id: promoId } },
//       relations: ['product'],
//     });

//     let total = 0;
//     for (const item of items) {
//       total += (item.product.cost ?? 0) * item.quantity;
//     }

//     return total;
//   }
// }
// ---------------------
// CostCascadeService
// await this.ingredientService.updateCost(ingredientId, newCost, qr);
// const affectedProductIds = await this.productService.updateProductsByIngredient(ingredientId, qr);
// const toppingProductIds = await this.productService.updateToppingProducts(ingredientId, qr);
// const allAffectedProducts = [...new Set([...affectedProductIds, ...toppingProductIds])];

// await this.promotionService.updatePromotionsByProducts(allAffectedProducts, qr);

// ---------------------

// @Injectable()
// export class ProductService {
//   async updateProductsByIngredient(ingredientId: string, qr: QueryRunner): Promise<string[]> {
//     const affected: string[] = [];
//     // lógica igual que antes pero encapsulada
//     return affected;
//   }

//   async updateToppingProducts(ingredientId: string, qr: QueryRunner): Promise<string[]> {
//     const affected: string[] = [];
//     // lógica igual que antes pero encapsulada
//     return affected;
//   }

//   async calculateCompoundCost(...) { ... }
//   async calculateToppingCost(...) { ... }
// }
// ---------------------
// @Injectable()
// export class PromotionService {
//   async updatePromotionsByProducts(productIds: string[], qr: QueryRunner): Promise<void> {
//     // buscar promociones que contienen productos
//     // calcular y actualizar costos
//   }

//   async calculatePromotionCost(...) { ... }
// }
