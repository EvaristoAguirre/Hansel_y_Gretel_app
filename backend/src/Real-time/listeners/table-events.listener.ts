import { Injectable } from '@nestjs/common';
import { BroadcastService } from '../broadcast.service';
import { OnEvent } from '@nestjs/event-emitter';
import { Table } from 'src/Table/table.entity';

@Injectable()
export class TableWSListener {
  constructor(private readonly broadcastService: BroadcastService) {}

  @OnEvent('table.created')
  handleTableCreate(event: { table: Table }) {
    this.broadcastService.broadcast('tableCreated', event.table);
  }

  @OnEvent('table.updated')
  handleTableUpdated(event: { table: Table }) {
    this.broadcastService.broadcast('tableUpdated', event.table);
  }

  @OnEvent('table.deleted')
  handleTableDelete(event: { tableId: string }) {
    this.broadcastService.broadcast('tableDeleted', { id: event.tableId });
  }
}
