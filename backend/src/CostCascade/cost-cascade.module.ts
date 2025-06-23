import { forwardRef, Module } from '@nestjs/common';
import { CostCascadeService } from './cost-cascade.service';
import { ProductModule } from 'src/Product/product.module';
import { ProductService } from 'src/Product/product.service';

@Module({
  imports: [forwardRef(() => ProductModule)],
  providers: [CostCascadeService, ProductService],
  exports: [CostCascadeService],
})
export class CostCascadeModule {}
