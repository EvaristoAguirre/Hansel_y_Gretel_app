import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitConversion } from './unitConversion.entity';
import { UnitOfMeasure } from './unitOfMesure.entity';
import { UnitOfMeasureService } from './unitOfMeasure.service';
import { UnitOfMeasureRepository } from './unitOfMeasure.repository';
import { UnitOfMeasureController } from './unitOfMeasure.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UnitConversion, UnitOfMeasure])],
  providers: [UnitOfMeasureService, UnitOfMeasureRepository],
  controllers: [UnitOfMeasureController],
  exports: [UnitOfMeasureService],
})
export class UnitOfMeasurenModule {}
