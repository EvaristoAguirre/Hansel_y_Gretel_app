import { Module } from '@nestjs/common';
import { TableController } from './table.controller';
import { TableService } from './table.service';
import { Table } from './table.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TableRepository } from './table.repository';
import { Room } from 'src/Room/room.entity';
import { UserModule } from 'src/User/user.module';
import { RoomModule } from 'src/Room/room.module';

@Module({
  imports: [TypeOrmModule.forFeature([Table, Room]), UserModule, RoomModule],
  controllers: [TableController],
  providers: [TableService, TableRepository],
  exports: [TableService],
})
export class TableModule {}
