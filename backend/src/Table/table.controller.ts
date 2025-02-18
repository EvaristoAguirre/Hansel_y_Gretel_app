import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TableService } from './table.service';
import { CreateTableDto } from 'src/DTOs/create-table.dto';
import { Table } from './table.entity';
import { UpdateTableDto } from 'src/DTOs/update-table.dto';
import { DeleteResult } from 'typeorm';

@Controller('tables')
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Post()
  createTable(@Body() table: CreateTableDto): Promise<Table> {
    return this.tableService.createTable(table);
  }

  @Patch(':id')
  updateTable(
    @Param('id') id: string,
    @Body() updateData: UpdateTableDto,
  ): Promise<Table> {
    return this.tableService.updateTable(id, updateData);
  }

  @Delete(':id')
  deleteTable(@Param('id') id: string): Promise<DeleteResult> {
    return this.tableService.deleteTable(id);
  }

  @Get()
  getAllTables(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<Table[]> {
    return this.tableService.getAllTables(page, limit);
  }

  @Get(':id')
  getTableById(@Param('id') id: string): Promise<Table> {
    return this.tableService.getTableById(id);
  }

  @Get('by-name/:name')
  async getTableByName(@Param('name') name: string): Promise<Table> {
    return this.tableService.getTableByName(name);
  }

  @Get('by-number/:number')
  async getTableByNumber(@Param('number') number: string): Promise<Table> {
    return this.tableService.getTableByNumber(number);
  }
}
