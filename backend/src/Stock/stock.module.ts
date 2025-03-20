import { forwardRef, Module } from '@nestjs/common';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stock } from './stock.entity';
import { Product } from 'src/Product/product.entity';
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { ProductRepository } from 'src/Product/product.repository';
import { IngredientRepository } from 'src/Ingredient/ingredient.repository';
import { StockRepository } from './stock.repository';
import { CategoryRepository } from 'src/Category/category.repository';
import { CategoryModule } from 'src/Category/category.module';
import { Category } from 'src/Category/category.entity';
import { UnitOfMeasure } from 'src/Ingredient/unitOfMesure.entity';
import { UserModule } from 'src/User/user.module';
import { PromotionProduct } from 'src/Product/promotionProducts.entity';
import { ProductIngredient } from 'src/Ingredient/ingredientProduct.entity';
import { IngredientService } from 'src/Ingredient/ingredient.service';
import { UnitConversion } from 'src/Ingredient/unitConversion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Stock,
      Product,
      Ingredient,
      Category,
      UnitOfMeasure,
      PromotionProduct,
      ProductIngredient,
      UnitConversion,
    ]),
    forwardRef(() => CategoryModule),
    UserModule,
  ],
  controllers: [StockController],
  providers: [
    StockService,
    StockRepository,
    ProductRepository,
    IngredientRepository,
    CategoryRepository,
    IngredientService,
  ],
  exports: [],
})
export class StockModule {}
