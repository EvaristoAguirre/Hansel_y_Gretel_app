import { Module } from '@nestjs/common';
import { CostCascadeService } from './cost-cascade.service';
import { UnitOfMeasurenModule } from 'src/UnitOfMeasure/unitOfMeasure.module';

@Module({
  imports: [UnitOfMeasurenModule],
  providers: [CostCascadeService],
  exports: [CostCascadeService],
})
export class CostCascadeModule {}
