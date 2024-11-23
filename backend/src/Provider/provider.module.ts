import { Module } from '@nestjs/common';
import { ProviderService } from './provider.service';
import { ProviderController } from './provider.controller';

@Module({
  controllers: [ProviderController],
  providers: [ProviderService],
})
export class ProviderModule {}
