import { Module } from '@nestjs/common';
import { IngredientController } from './ingredient.controller';
import { IngredientService } from './ingredient.service';
import { IngredientRepository } from './ingredient.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ingredient } from './ingredient.entity';
import { UserModule } from 'src/User/user.module';
import { UnitOfMeasureService } from 'src/UnitOfMeasure/unitOfMeasure.service';
import { UnitOfMeasure } from 'src/UnitOfMeasure/unitOfMesure.entity';
import { CostCascadeModule } from 'src/CostCascade/cost-cascade.module';
import { CostCascadeService } from 'src/CostCascade/cost-cascade.service';
import { UnitOfMeasureRepository } from 'src/UnitOfMeasure/unitOfMeasure.repository';
import { UnitConversion } from 'src/UnitOfMeasure/unitConversion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ingredient,
      UnitConversion,
      UnitOfMeasure,
      // ProductAvailableToppingGroup,
    ]),
    UserModule,
    CostCascadeModule,
  ],
  controllers: [IngredientController],
  providers: [
    IngredientService,
    IngredientRepository,
    UnitOfMeasureService,
    UnitOfMeasureRepository,
    CostCascadeService,
  ],
  exports: [IngredientService],
})
export class IngredientModule {}
