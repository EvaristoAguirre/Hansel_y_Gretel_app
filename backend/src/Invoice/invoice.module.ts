import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/Order/entities/order.entity';
import { AfipConfig } from './afip-config';
import { AfipToken } from './afip-token.entity';
import { ArcaClient } from './arca-client';
import { createArcaClient } from './arca-client.factory';
import { Invoice } from './invoice.entity';
import { InvoiceService } from './invoice.service';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, AfipToken, Order])],
  providers: [
    AfipConfig,
    InvoiceService,
    {
      provide: ArcaClient,
      useFactory: (config: AfipConfig) => createArcaClient(config.settings),
      inject: [AfipConfig],
    },
  ],
  exports: [AfipConfig, ArcaClient, InvoiceService],
})
export class InvoiceModule {}
