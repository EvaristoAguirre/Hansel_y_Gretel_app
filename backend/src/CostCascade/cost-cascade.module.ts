import { Module } from '@nestjs/common';
import { CostCascadeService } from './cost-cascade.service';

@Module({
  imports: [],
  providers: [CostCascadeService],
  exports: [CostCascadeService],
})
export class CostCascadeModule {}
