import { forwardRef, Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductRepository } from './product.repository';
import { CategoryModule } from 'src/Category/category.module';
import { CategoryRepository } from 'src/Category/category.repository';
import { Category } from 'src/Category/category.entity';
import { UserModule } from 'src/User/user.module';
import { PromotionProduct } from './promotionProducts.entity';
import { UnitOfMeasureService } from 'src/UnitOfMeasure/unitOfMeasure.service';
import { UnitConversion } from 'src/UnitOfMeasure/unitConversion.entity';
import { UnitOfMeasure } from 'src/UnitOfMeasure/unitOfMesure.entity';
import { UnitOfMeasureRepository } from 'src/UnitOfMeasure/unitOfMeasure.repository';
import { UnitOfMeasurenModule } from 'src/UnitOfMeasure/unitOfMeasure.module';
import { StockService } from 'src/Stock/stock.service';
import { Stock } from 'src/Stock/stock.entity';
import { StockRepository } from 'src/Stock/stock.repository';
import { IngredientRepository } from 'src/Ingredient/ingredient.repository';
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { IngredientService } from 'src/Ingredient/ingredient.service';
import { ProductAvailableToppingGroup } from 'src/Ingredient/productAvailableToppingsGroup.entity';
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
    forwardRef(() => CategoryModule),
    CostCascadeModule,
    UserModule,
    UnitOfMeasurenModule,
  ],
  controllers: [ProductController],
  providers: [
    ProductService,
    ProductRepository,
    CategoryRepository,
    UnitOfMeasureService,
    UnitOfMeasureRepository,
    StockService,
    StockRepository,
    IngredientRepository,
    IngredientService,
  ],
  exports: [ProductService],
})
export class ProductModule {}
