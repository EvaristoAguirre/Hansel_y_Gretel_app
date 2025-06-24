import { Module } from '@nestjs/common';
import { IngredientController } from './ingredient.controller';
import { IngredientService } from './ingredient.service';
import { IngredientRepository } from './ingredient.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ingredient } from './ingredient.entity';
import { UserModule } from 'src/User/user.module';
import { UnitOfMeasureService } from 'src/UnitOfMeasure/unitOfMeasure.service';
import { UnitOfMeasure } from 'src/UnitOfMeasure/unitOfMesure.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ingredient,
      // UnitConversion,
      UnitOfMeasure,
      // ProductAvailableToppingGroup,
    ]),
    UserModule,
  ],
  controllers: [IngredientController],
  providers: [IngredientService, IngredientRepository, UnitOfMeasureService],
  exports: [IngredientService],
})
export class IngredientModule {}
