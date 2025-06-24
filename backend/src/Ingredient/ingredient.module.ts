import { Module } from '@nestjs/common';
import { IngredientController } from './ingredient.controller';
import { IngredientService } from './ingredient.service';
import { IngredientRepository } from './ingredient.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ingredient } from './ingredient.entity';
import { UserModule } from 'src/User/user.module';
import { UnitOfMeasure } from 'src/UnitOfMeasure/unitOfMesure.entity';
import { CostCascadeModule } from 'src/CostCascade/cost-cascade.module';

import { UnitConversion } from 'src/UnitOfMeasure/unitConversion.entity';
import { UnitOfMeasurenModule } from 'src/UnitOfMeasure/unitOfMeasure.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ingredient, UnitConversion, UnitOfMeasure]),
    UserModule,
    CostCascadeModule,
    UnitOfMeasurenModule,
  ],
  controllers: [IngredientController],
  providers: [IngredientService, IngredientRepository],
  exports: [IngredientService],
})
export class IngredientModule {}
