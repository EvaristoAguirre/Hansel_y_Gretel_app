import { ProductModule } from 'src/Product/product.module';
import { SauceGroupsController } from './sauce-group.controller';
import { IngredientModule } from 'src/Ingredient/ingredient.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { Product } from 'src/Product/product.entity';
import { SauceGroup } from './sauce-group.entity';
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { SauceGroupsService } from './sauce-group.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SauceGroup, Product, Ingredient]),
    ProductModule,
    IngredientModule,
  ],
  controllers: [SauceGroupsController],
  providers: [SauceGroupsService],
  exports: [SauceGroupsService],
})
export class SauceGroupsModule {}
