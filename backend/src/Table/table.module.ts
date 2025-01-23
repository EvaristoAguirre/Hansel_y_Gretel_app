import { Module } from '@nestjs/common';
import { TableController } from './table.controller';
import { TableService } from './table.service';
import { Table } from './table.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TableRepository } from './table.repository';
import { Room } from 'src/Room/room.entity';
import { RoomRepository } from 'src/Room/room.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Table, Room])],
  controllers: [TableController],
  providers: [TableService, TableRepository, RoomRepository],
})
export class TableModule {}
