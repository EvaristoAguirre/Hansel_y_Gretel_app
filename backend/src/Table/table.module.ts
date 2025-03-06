import { Module } from '@nestjs/common';
import { TableController } from './table.controller';
import { TableService } from './table.service';
import { Table } from './table.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TableRepository } from './table.repository';
import { Room } from 'src/Room/room.entity';
import { RoomRepository } from 'src/Room/room.repository';
import { UserModule } from 'src/User/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Table, Room]), UserModule],
  controllers: [TableController],
  providers: [TableService, TableRepository, RoomRepository],
})
export class TableModule {}
