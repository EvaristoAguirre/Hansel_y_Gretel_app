import { Module } from '@nestjs/common';
import { AfipConfig } from './afip-config';
import { ArcaClient } from './arca-client';
import { createArcaClient } from './arca-client.factory';

@Module({
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
