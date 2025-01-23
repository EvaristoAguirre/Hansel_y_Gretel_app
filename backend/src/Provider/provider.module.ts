import { Module } from '@nestjs/common';
import { ProviderService } from './provider.service';
import { ProviderController } from './provider.controller';
import { Provider } from './provider.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/Product/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Provider, Product])],
  controllers: [ProviderController],
  providers: [ProviderService],
})
export class ProviderModule {}
