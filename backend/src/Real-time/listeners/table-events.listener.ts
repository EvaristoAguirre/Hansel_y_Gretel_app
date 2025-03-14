// import { Injectable } from '@nestjs/common';
// import { BroadcastService } from '../broadcast.service';
// import { OnEvent } from '@nestjs/event-emitter';
// import { Table } from 'src/Table/table.entity';

// @Injectable()
// export class TableWSListener {
//   constructor(private readonly broadcastService: BroadcastService) {}

//   @OnEvent('table.created')
//   handleTableCreate(event: { table: Table }) {
//     this.broadcastService.broadcast('tableCreated', event.table);
//   }

//   @OnEvent('table.updated')
//   handleTableUpdated(event: { table: Table }) {
//     this.broadcastService.broadcast('tableUpdated', event.table);
//   }

//   @OnEvent('table.deleted')
//   handleTableDelete(event: { table: Table }) {
//     this.broadcastService.broadcast('tableDelete', event.table);
//   }
// }

import { Injectable } from "@nestjs/common";
import { BroadcastService } from "../broadcast.service";
import { OnEvent } from "@nestjs/event-emitter";
import { Table } from "src/Table/table.entity";

@Injectable()
export class TableWSListener {
  constructor(private readonly broadcastService: BroadcastService) {}

  @OnEvent("table.created")
  handleTableCreate(event: { table: Table }) {
    console.log("🟢 Evento recibido: table.created", event.table);
    this.broadcastService.broadcast("tableCreated", event.table);
  }

  @OnEvent("table.updated")
  handleTableUpdated(event: { table: Table }) {
    console.log("🟡 Evento recibido: table.updated", event.table);
    this.broadcastService.broadcast("tableUpdated", event.table);
  }

  @OnEvent("table.deleted")
  handleTableDelete(event: { table: Table }) {
    console.log("🔴 Evento recibido: table.deleted", event.table);
    this.broadcastService.broadcast("tableDeleted", event.table);
  }
}
