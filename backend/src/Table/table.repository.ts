import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Table } from './table.entity';
import { CreateTableDto } from 'src/DTOs/create-table.dto';
import { UpdateTableDto } from 'src/DTOs/update-table.dto';
import { Room } from 'src/Room/room.entity';

@Injectable()
export class TableRepository {
  constructor(
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  async createTable(table: CreateTableDto): Promise<Table> {
    const { roomId, ...tableData } = table;
    try {
      const roomSelected = await this.roomRepository.findOne({
        where: { id: roomId, isActive: true },
      });
      if (!roomSelected) {
        throw new BadRequestException(`Room with ID: ${roomId} not found`);
      }
      const tableCreated = await this.tableRepository.create({
        ...tableData,
        room: roomSelected,
      });
      return await this.tableRepository.save(tableCreated);
    } catch (error) {
      throw new InternalServerErrorException('Error creating the table', error);
    }
  }

  async updateTable(id: string, updateData: UpdateTableDto): Promise<Table> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    try {
      const table = await this.tableRepository.findOne({
        where: { id, isActive: true },
      });
      if (!table) {
        throw new BadRequestException(`Table with ID: ${id} not found`);
      }
      Object.assign(table, updateData);
      return await this.tableRepository.save(table);
    } catch (error) {
      throw new InternalServerErrorException('Error updating the table', error);
    }
  }

  async deleteTable(id: string): Promise<string> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    try {
      const result = await this.tableRepository.update(id, { isActive: false });
      if (result.affected === 0) {
        throw new BadRequestException(`Table with ID: ${id} not found`);
      }
      return 'Table successfully deleted';
    } catch (error) {
      throw new InternalServerErrorException(
        'Error deleting the table.',
        error,
      );
    }
  }

  async getAllTables(page: number, limit: number): Promise<Table[]> {
    if (page <= 0 || limit <= 0) {
      throw new BadRequestException(
        'Page and limit must be positive integers.',
      );
    }
    try {
      return await this.tableRepository.find({
        where: { isActive: true },
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch (error) {
      throw new InternalServerErrorException('Error fetching tables', error);
    }
  }

  async getTableById(id: string): Promise<Table> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    try {
      const table = await this.tableRepository.findOne({
        where: { id, isActive: true },
      });
      if (!table) {
        throw new BadRequestException(`Table with ID: ${id} not found`);
      }
      return table;
    } catch (error) {
      throw new InternalServerErrorException('Error fetching the table', error);
    }
  }
}
