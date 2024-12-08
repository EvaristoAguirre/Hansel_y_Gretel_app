import { Injectable } from '@nestjs/common';
import { TableRepository } from './table.repository';
import { CreateTableDto } from 'src/DTOs/create-table.dto';
import { UpdateTableDto } from 'src/DTOs/update-table.dto';
import { Table } from './table.entity';
import EventEmitter2 from 'eventemitter2';

@Injectable()
export class TableService {
  constructor(
    private readonly tableRepository: TableRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createTable(table: CreateTableDto): Promise<Table> {
    return await this.tableRepository.createTable(table);
  }

  async updateTable(id: string, updateData: UpdateTableDto): Promise<Table> {
    const tableUpdated = await this.tableRepository.updateTable(id, updateData);
    await this.eventEmitter.emit('table.updated', {
      table: tableUpdated,
    });
    return tableUpdated;
  }

  async deleteTable(id: string): Promise<string> {
    return await this.tableRepository.deleteTable(id);
  }

  async getAllTables(page: number, limit: number): Promise<Table[]> {
    return await this.tableRepository.getAllTables(page, limit);
  }

  async getTableById(id: string): Promise<Table> {
    return await this.tableRepository.getTableById(id);
  }
}
