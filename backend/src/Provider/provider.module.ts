import { Module } from '@nestjs/common';
import { ProviderService } from './provider.service';
import { ProviderController } from './provider.controller';
import { Provider } from './provider.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/Product/product.entity';
import { UserModule } from 'src/User/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Provider, Product]), UserModule],
  controllers: [ProviderController],
  providers: [ProviderService],
})
export class ProviderModule {}
