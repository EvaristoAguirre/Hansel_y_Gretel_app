import { Module } from '@nestjs/common';
import { IngredientController } from './ingredient.controller';
import { IngredientService } from './ingredient.service';
import { IngredientRepository } from './ingredient.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ingredient } from './ingredient.entity';
import { UnitOfMeasure } from './unitOfMesure.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ingredient, UnitOfMeasure])],
  controllers: [IngredientController],
  providers: [IngredientService, IngredientRepository],
  exports: [],
})
export class IngredientModule {}
