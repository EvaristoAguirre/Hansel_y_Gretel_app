import { Injectable } from '@nestjs/common';
import { TableRepository } from './table.repository';
import { CreateTableDto } from 'src/DTOs/create-table.dto';
import { UpdateTableDto } from 'src/DTOs/update-table.dto';
import { Table } from './table.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TableState } from 'src/Enums/states.enum';

@Injectable()
export class TableService {
  constructor(
    private readonly tableRepository: TableRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createTable(table: CreateTableDto): Promise<Table> {
    const tableCreated = await this.tableRepository.createTable(table);

    this.eventEmitter.emit('table.created', { table: tableCreated });

    return tableCreated;
  }

  async updateTable(id: string, updateData: UpdateTableDto): Promise<Table> {
    const tableUpdated = await this.tableRepository.updateTable(id, updateData);

    this.eventEmitter.emit('table.updated', {
      table: tableUpdated,
    });

    return tableUpdated;
  }

  async deleteTable(id: string): Promise<string> {
    const tableDelete = await this.tableRepository.deleteTable(id);

    this.eventEmitter.emit('table.deleted', {
      tableId: id,
    });

    return tableDelete;
  }

  async getAllTables(page: number, limit: number): Promise<Table[]> {
    return await this.tableRepository.getAllTables(page, limit);
  }

  async getTableById(id: string): Promise<Table> {
    return await this.tableRepository.getTableById(id);
  }

  async getTableByName(name: string): Promise<Table> {
    return this.tableRepository.getTableByName(name);
  }

  async updateTableState(tableId: string, state: TableState) {
    await this.tableRepository.updateTableState(tableId, state);
  }

  async getTablesByRoom(roomId: string): Promise<Table[]> {
    return this.tableRepository.getTablesByRoom(roomId);
  }

  // ------------------- creados porque los necesite en otro servicio
}
