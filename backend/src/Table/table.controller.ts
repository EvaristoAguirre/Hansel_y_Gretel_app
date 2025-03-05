import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TableService } from './table.service';
import { CreateTableDto } from 'src/DTOs/create-table.dto';
import { Table } from './table.entity';
import { UpdateTableDto } from 'src/DTOs/update-table.dto';
import { DeleteResult } from 'typeorm';
import { Roles } from 'src/Decorators/roles.decorator';
import { UserRole } from 'src/Enums/roles.enum';
import { RolesGuard } from 'src/Guards/roles.guard';

@Controller('tables')
@UseGuards(RolesGuard)
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  createTable(@Body() table: CreateTableDto): Promise<Table> {
    return this.tableService.createTable(table);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  updateTable(
    @Param('id') id: string,
    @Body() updateData: UpdateTableDto,
  ): Promise<Table> {
    return this.tableService.updateTable(id, updateData);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  deleteTable(@Param('id') id: string): Promise<DeleteResult> {
    return this.tableService.deleteTable(id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  getAllTables(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<Table[]> {
    return this.tableService.getAllTables(page, limit);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  getTableById(@Param('id') id: string): Promise<Table> {
    return this.tableService.getTableById(id);
  }

  @Get('by-name/:name')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async getTableByName(@Param('name') name: string): Promise<Table> {
    return this.tableService.getTableByName(name);
  }

  @Get('by-number/:number')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async getTableByNumber(@Param('number') number: string): Promise<Table> {
    return this.tableService.getTableByNumber(number);
  }
}
