import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { CategoryModule } from 'src/Category/category.module';
import { Category } from 'src/Category/category.entity';
import { UserModule } from 'src/User/user.module';
import { PromotionProduct } from './promotionProducts.entity';
import { UnitConversion } from 'src/UnitOfMeasure/unitConversion.entity';
import { UnitOfMeasure } from 'src/UnitOfMeasure/unitOfMesure.entity';
import { UnitOfMeasurenModule } from 'src/UnitOfMeasure/unitOfMeasure.module';
import { Stock } from 'src/Stock/stock.entity';
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { ProductAvailableToppingGroup } from 'src/Ingredient/productAvailableToppingsGroup.entity';
import { IngredientModule } from 'src/Ingredient/ingredient.module';
import { StockModule } from 'src/Stock/stock.module';
import { ProductRepository } from './product.repository';
import { CostCascadeModule } from 'src/CostCascade/cost-cascade.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Category,
      PromotionProduct,
      UnitConversion,
      UnitOfMeasure,
      Stock,
      Ingredient,
      ProductAvailableToppingGroup,
    ]),
    CategoryModule,
    IngredientModule,
    UnitOfMeasurenModule,
    UserModule,
    StockModule,
    CostCascadeModule,
  ],
  controllers: [ProductController],
  providers: [ProductService, ProductRepository],
  exports: [ProductService],
})
export class ProductModule {}
