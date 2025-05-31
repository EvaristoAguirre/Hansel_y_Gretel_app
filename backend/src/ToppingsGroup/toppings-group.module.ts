import { ProductModule } from 'src/Product/product.module';
import { ToppingsGroupsController } from './toppings-group.controller';
import { IngredientModule } from 'src/Ingredient/ingredient.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { Product } from 'src/Product/product.entity';
import { ToppingsGroup } from './toppings-group.entity';
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { ToppingsGroupsService } from './toppings-group.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ToppingsGroup, Product, Ingredient]),
    ProductModule,
    IngredientModule,
  ],
  controllers: [ToppingsGroupsController],
  providers: [ToppingsGroupsService],
  exports: [ToppingsGroupsService],
})
export class ToppingsGroupsModule {}
