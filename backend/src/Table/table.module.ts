import { Module } from '@nestjs/common';
import { TableController } from './table.controller';
import { TableService } from './table.service';
import { Table } from './table.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TableRepository } from './table.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Table])],
  controllers: [TableController],
  providers: [TableService, TableRepository],
})
export class TableModule {}
