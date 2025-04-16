import { Module } from '@nestjs/common';
import { IngredientController } from './ingredient.controller';
import { IngredientService } from './ingredient.service';
import { IngredientRepository } from './ingredient.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ingredient } from './ingredient.entity';
import { UserModule } from 'src/User/user.module';
import { UnitOfMeasureService } from 'src/UnitOfMeasure/unitOfMeasure.service';
import { UnitConversion } from 'src/UnitOfMeasure/unitConversion.entity';
import { UnitOfMeasure } from 'src/UnitOfMeasure/unitOfMesure.entity';
import { UnitOfMeasureRepository } from 'src/UnitOfMeasure/unitOfMeasure.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ingredient, UnitConversion, UnitOfMeasure]),
    UserModule,
  ],
  controllers: [IngredientController],
  providers: [
    IngredientService,
    IngredientRepository,
    UnitOfMeasureService,
    UnitOfMeasureRepository,
  ],
  exports: [IngredientService],
})
export class IngredientModule {}
