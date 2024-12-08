import { Injectable } from '@nestjs/common';
import { TableRepository } from './table.repository';
import { CreateTableDto } from 'src/DTOs/create-table.dto';
import { UpdateTableDto } from 'src/DTOs/update-table.dto';
import { Table } from './table.entity';

@Injectable()
export class TableService {
  constructor(private readonly tableRepository: TableRepository) {}

  async createTable(table: CreateTableDto): Promise<Table> {
    return await this.tableRepository.createTable(table);
  }

  async updateTable(id: string, updateData: UpdateTableDto): Promise<Table> {
    return await this.tableRepository.updateTable(id, updateData);
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
