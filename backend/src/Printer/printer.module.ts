import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrinterController } from './printer.controller';
import { PrinterService } from './printer.service';
import { UserModule } from 'src/User/user.module';
import { Order } from 'src/Order/entities/order.entity';

@Module({
  imports: [UserModule, TypeOrmModule.forFeature([Order])],
  controllers: [PrinterController],
  providers: [PrinterService],
  exports: [PrinterService],
})
export class PrinterModule {}
