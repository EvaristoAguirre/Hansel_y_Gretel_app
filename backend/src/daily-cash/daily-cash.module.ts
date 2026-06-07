import { Module } from '@nestjs/common';
import { DailyCashService } from './daily-cash.service';
import { DailyCashController } from './daily-cash.controller';
import { DailyCashRepository } from './daily-cash.repository';
import { DailyCash } from './daily-cash.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashMovement } from './cash-movement.entity';
import { TableModule } from 'src/Table/table.module';

@Module({
  imports: [TypeOrmModule.forFeature([DailyCash, CashMovement]), TableModule],
  controllers: [DailyCashController],
  providers: [DailyCashService, DailyCashRepository],
  exports: [DailyCashService],
})
export class DailyCashModule {}
