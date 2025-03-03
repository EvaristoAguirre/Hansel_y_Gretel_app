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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Stock,
      Product,
      Ingredient,
      Category,
      UnitOfMeasure,
    ]),
    forwardRef(() => CategoryModule),
  ],
  controllers: [StockController],
  providers: [
    StockService,
    StockRepository,
    ProductRepository,
    IngredientRepository,
    CategoryRepository,
  ],
  exports: [],
})
export class StockModule {}
