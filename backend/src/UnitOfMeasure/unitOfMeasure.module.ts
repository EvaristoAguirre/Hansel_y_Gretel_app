import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitConversion } from './unitConversion.entity';
import { UnitOfMeasure } from './unitOfMesure.entity';
import { UnitOfMeasureService } from './unitOfMeasure.service';
import { UnitOfMeasureRepository } from './unitOfMeasure.repository';
import { UnitOfMeasureController } from './unitOfMeasure.controller';
import { UserModule } from 'src/User/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UnitConversion, UnitOfMeasure]),
    UserModule,
  ],
  providers: [UnitOfMeasureService, UnitOfMeasureRepository],
  controllers: [UnitOfMeasureController],
  exports: [UnitOfMeasureService],
})
export class UnitOfMeasurenModule {}
