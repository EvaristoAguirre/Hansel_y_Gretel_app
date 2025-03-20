import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { UnitOfMeasure } from 'src/Ingredient/unitOfMesure.entity';
import { UnitConversion } from 'src/Ingredient/unitConversion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UnitOfMeasure, UnitConversion])],
  providers: [SeederService],
})
export class SeederModule {}
