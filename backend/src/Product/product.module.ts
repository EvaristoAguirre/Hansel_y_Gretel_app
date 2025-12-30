import { Module } from '@nestjs/common';
import { ProductController } from './controllers/product.controller';
import { ProductService } from './services/product-service/product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { CategoryModule } from 'src/Category/category.module';
import { Category } from 'src/Category/category.entity';
import { UserModule } from 'src/User/user.module';
import { PromotionProduct } from './entities/promotionProducts.entity';
import { UnitConversion } from 'src/UnitOfMeasure/unitConversion.entity';
import { UnitOfMeasure } from 'src/UnitOfMeasure/unitOfMesure.entity';
import { UnitOfMeasurenModule } from 'src/UnitOfMeasure/unitOfMeasure.module';
import { Stock } from 'src/Stock/stock.entity';
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { ProductAvailableToppingGroup } from 'src/Ingredient/productAvailableToppingsGroup.entity';
import { IngredientModule } from 'src/Ingredient/ingredient.module';
import { StockModule } from 'src/Stock/stock.module';
import { ProductRepository } from './repositories/product.repository';
import { CostCascadeModule } from 'src/CostCascade/cost-cascade.module';
import { PromotionSlotOption } from './entities/promotion-slot-option.entity';
import { PromotionSlot } from './entities/promotion-slot.entity';
import { PromotionSlotAssignment } from './entities/promotion-slot-assignment.entity';
import { PromotionSlotRepository } from './repositories/promotion-slot.repository';
import { PromotionSlotAssignmentRepository } from './repositories/promotion-slot-assignment.repository';
import { PromotionSlotService } from './services/promotion-slot.service';
import { PromotionSlotAssignmentService } from './services/promotion-slot-assignment.service';
import { PromotionSlotController } from './controllers/promotion-slot.controller';
import { ProductReaderService } from './services/product-service/product-reader.service';
import { ProductCreaterService } from './services/product-service/product-creater.service';
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
      PromotionSlot,
      PromotionSlotOption,
      PromotionSlotAssignment,
    ]),
    CategoryModule,
    IngredientModule,
    UnitOfMeasurenModule,
    UserModule,
    StockModule,
    CostCascadeModule,
  ],
  controllers: [ProductController, PromotionSlotController],
  providers: [
    ProductService,
    ProductReaderService,
    ProductCreaterService,
    ProductRepository,
    PromotionSlotRepository,
    PromotionSlotAssignmentRepository,
    PromotionSlotService,
    PromotionSlotAssignmentService,
  ],
  exports: [
    ProductService,
    PromotionSlotService,
    PromotionSlotAssignmentService,
  ],
})
export class ProductModule {}
