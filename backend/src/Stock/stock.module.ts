import { forwardRef, Module } from '@nestjs/common';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stock } from './stock.entity';
import { Product } from 'src/Product/entities/product.entity';
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { StockRepository } from './stock.repository';
import { CategoryModule } from 'src/Category/category.module';
import { Category } from 'src/Category/category.entity';
import { UserModule } from 'src/User/user.module';
import { PromotionProduct } from 'src/Product/entities/promotionProducts.entity';
import { ProductIngredient } from 'src/Ingredient/ingredientProduct.entity';
import { UnitConversion } from 'src/UnitOfMeasure/unitConversion.entity';
import { UnitOfMeasure } from 'src/UnitOfMeasure/unitOfMesure.entity';
import { ProductModule } from 'src/Product/product.module';
import { IngredientModule } from 'src/Ingredient/ingredient.module';
import { UnitOfMeasurenModule } from 'src/UnitOfMeasure/unitOfMeasure.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Stock,
      Product,
      Ingredient,
      Category,
      PromotionProduct,
      ProductIngredient,
      UnitConversion,
      UnitOfMeasure,
    ]),
    forwardRef(() => CategoryModule),
    forwardRef(() => ProductModule),
    UserModule,
    IngredientModule,
    UnitOfMeasurenModule,
  ],
  controllers: [StockController],
  providers: [StockRepository, StockService],
  exports: [StockService],
})
export class StockModule {}
