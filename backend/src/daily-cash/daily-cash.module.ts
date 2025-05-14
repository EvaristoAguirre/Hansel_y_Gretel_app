import { Module } from '@nestjs/common';
import { DailyCashService } from './daily-cash.service';
import { DailyCashController } from './daily-cash.controller';

@Module({
  controllers: [DailyCashController],
  providers: [DailyCashService],
})
export class DailyCashModule {}
