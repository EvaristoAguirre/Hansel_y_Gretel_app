import { Module } from '@nestjs/common';
import { DailyCashService } from './daily-cash.service';
import { DailyCashController } from './daily-cash.controller';
import { DailyCashRepository } from './daily-cash.repository';
import { DailyCash } from './daily-cash.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([DailyCash])],
  controllers: [DailyCashController],
  providers: [DailyCashService, DailyCashRepository],
})
export class DailyCashModule {}
