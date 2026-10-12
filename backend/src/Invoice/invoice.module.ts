import { Module } from '@nestjs/common';
import { AfipConfig } from './afip-config';

@Module({
  providers: [AfipConfig],
  exports: [AfipConfig],
})
export class InvoiceModule {}
