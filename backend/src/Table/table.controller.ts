import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { TableService } from './table.service';
import { CreateTableDto } from 'src/DTOs/create-table.dto';
import { Table } from './table.entity';
import { UpdateTableDto } from 'src/DTOs/update-table.dto';

@Controller('tables')
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Post()
  createTable(@Body() table: CreateTableDto): Promise<Table> {
    return this.tableService.createTable(table);
  }

  @Put(':id')
  updateTable(
    @Param('id') id: string,
    @Body() updateData: UpdateTableDto,
  ): Promise<Table> {
    console.log(id);
    console.log(updateData);
    return this.tableService.updateTable(id, updateData);
  }

  @Delete(':id')
  deleteTable(@Param('id') id: string): Promise<string> {
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
}
