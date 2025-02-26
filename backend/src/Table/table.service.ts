import { Injectable } from '@nestjs/common';
import { TableRepository } from './table.repository';
import { CreateTableDto } from 'src/DTOs/create-table.dto';
import { UpdateTableDto } from 'src/DTOs/update-table.dto';
import { Table } from './table.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DeleteResult } from 'typeorm';

@Injectable()
export class TableService {
  constructor(
    private readonly tableRepository: TableRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createTable(table: CreateTableDto): Promise<Table> {
    const tableCreated = await this.tableRepository.createTable(table);

    await this.eventEmitter.emit('table.created', { table: tableCreated });
    return tableCreated;
  }

  async updateTable(id: string, updateData: UpdateTableDto): Promise<Table> {
    const tableUpdated = await this.tableRepository.updateTable(id, updateData);
    await this.eventEmitter.emit('table.updated', {
      table: tableUpdated,
    });
    return tableUpdated;
  }

  async deleteTable(id: string): Promise<DeleteResult> {
    const tableDelete = await this.tableRepository.deleteTable(id);
    await this.eventEmitter.emit('table.deleted', {
      table: tableDelete,
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

  async getTableByNumber(number: string): Promise<Table> {
    return this.tableRepository.getTableByNumber(number);
  }
}
