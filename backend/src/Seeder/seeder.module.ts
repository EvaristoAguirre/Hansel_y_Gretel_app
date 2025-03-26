import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { UnitConversion } from 'src/UnitOfMeasure/unitConversion.entity';
import { UnitOfMeasure } from 'src/UnitOfMeasure/unitOfMesure.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UnitOfMeasure, UnitConversion])],
  providers: [SeederService],
})
export class SeederModule {}
