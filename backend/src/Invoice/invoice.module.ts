import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AfipConfig } from './afip-config';
import { AfipToken } from './afip-token.entity';
import { ArcaClient } from './arca-client';
import { createArcaClient } from './arca-client.factory';
import { Invoice } from './invoice.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, AfipToken])],
  providers: [
    AfipConfig,
    {
      provide: ArcaClient,
      useFactory: (config: AfipConfig) => createArcaClient(config.settings),
      inject: [AfipConfig],
    },
  ],
  exports: [AfipConfig, ArcaClient],
})
export class InvoiceModule {}
