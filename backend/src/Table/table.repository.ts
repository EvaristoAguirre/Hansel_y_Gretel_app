import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Table } from './table.entity';
import { CreateTableDto } from 'src/DTOs/create-table.dto';
import { UpdateTableDto } from 'src/DTOs/update-table.dto';
import { Room } from 'src/Room/room.entity';
import { OrderState, TableState } from 'src/Enums/states.enum';
import { LoggerService } from 'src/Monitoring/monitoring-logger.service';

@Injectable()
export class TableRepository {
  private readonly logger = new Logger(TableRepository.name);
  constructor(
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * Método auxiliar para loguear errores con información estructurada
   * Centraliza el formato de logs para este repositorio
   */
  private logError(
    operation: string,
    context: Record<string, any>,
    error: any,
  ) {
    const errorInfo = {
      operation,
      repository: 'TableRepository',
      context,
      timestamp: new Date().toISOString(),
    };
    this.loggerService.error(errorInfo, error);
  }

  async createTable(table: CreateTableDto): Promise<Table> {
    const { roomId, ...tableData } = table;

    const existingTableByName = await this.tableRepository.findOne({
      where: { name: tableData.name },
    });
    if (existingTableByName) {
      throw new ConflictException('Table name already exists');
    }
    try {
      const roomSelected = await this.roomRepository.findOne({
        where: { id: roomId, isActive: true },
      });
      if (!roomSelected) {
        throw new NotFoundException(`Room with ID: ${roomId} not found`);
      }

      const tableCreate = await this.tableRepository.create({
        ...tableData,
        room: roomSelected,
      });
      await this.tableRepository.save(tableCreate);
      const tableFinded = await this.tableRepository.findOne({
        where: { name: tableCreate.name },
        relations: ['room'],
      });
      return tableFinded;
    } catch (error) {
      this.logError(
        'createTable',
        { roomId, tableName: tableData.name },
        error,
      );
      throw error;
    }
  }

  async updateTable(id: string, updateData: UpdateTableDto): Promise<Table> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    try {
      const table = await this.tableRepository.findOne({
        where: { id, isActive: true },
        relations: ['room', 'orders'],
      });
      if (!table) {
        throw new NotFoundException(`Table with ID: ${id} not found`);
      }
      Object.assign(table, updateData);
      await this.tableRepository.save(table);
      const tableUpdated = await this.tableRepository.findOne({
        where: { id: id },
        relations: ['room'],
      });
      return tableUpdated;
    } catch (error) {
      this.logError('updateTable', { id, updateData }, error);
      throw error;
    }
  }

  async deleteTable(id: string): Promise<string> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const tableDeleted = await this.tableRepository.delete(id);
      return id;
    } catch (error) {
      this.logError('deleteTable', { id }, error);
      throw error;
    }
  }

  async getAllTables(page: number, limit: number): Promise<any[]> {
    if (page <= 0 || limit <= 0) {
      throw new BadRequestException(
        'Page and limit must be positive integers.',
      );
    }

    try {
      const tables = await this.tableRepository
        .createQueryBuilder('table')
        .leftJoinAndSelect(
          'table.orders',
          'order',
          'order.state IN (:...states)',
          { states: [OrderState.OPEN, OrderState.PENDING_PAYMENT] },
        )
        .leftJoinAndSelect('table.room', 'room')
        .select(['table', 'order.id', 'order.state', 'room.id', 'room.name'])
        .where('table.isActive = :isActive', { isActive: true })
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      const result = tables.map((table) => ({
        id: table.id,
        name: table.name,
        isActive: table.isActive,
        state: table.state,
        room: {
          id: table.room?.id,
          name: table.room?.name,
        },
        orders: table.orders.map((order) => order.id),
      }));

      return result;
    } catch (error) {
      this.logError('getAllTables', { page, limit }, error);
      throw error;
    }
  }

  async getTableById(id: string): Promise<Table> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }

    try {
      const table = await this.tableRepository.findOne({
        where: { id, isActive: true },
        relations: ['orders'],
      });

      if (!table) {
        throw new NotFoundException(`Table with ID: ${id} not found`);
      }

      table.orders = table.orders.filter(
        (order) =>
          order.state === OrderState.OPEN ||
          order.state === OrderState.PENDING_PAYMENT,
      );

      return table;
    } catch (error) {
      this.logError('getTableById', { id }, error);
      throw error;
    }
  }

  async getTableByName(name: string): Promise<Table> {
    if (!name) {
      throw new BadRequestException('Either name must be provided.');
    }
    try {
      const table = await this.tableRepository.findOne({
        where: { name: ILike(name) },
        relations: ['orders'],
      });
      if (!table) {
        throw new NotFoundException(`Table with ID: ${name} not found`);
      }
      table.orders = table.orders.filter(
        (order) =>
          order.state === OrderState.OPEN ||
          order.state === OrderState.PENDING_PAYMENT,
      );
      return table;
    } catch (error) {
      this.logError('getTableByName', { name }, error);
      throw error;
    }
  }

  async updateTableState(tableId: string, state: TableState) {
    try {
      await this.tableRepository.update(tableId, { state });
    } catch (error) {
      this.logError('updateTableState', { tableId, state }, error);
      throw error;
    }
  }

  async getTablesByRoom(roomId: string): Promise<any[]> {
    if (!roomId) {
      throw new BadRequestException('Either Room ID must be provided.');
    }
    try {
      const tables = await this.tableRepository
        .createQueryBuilder('table')
        .leftJoinAndSelect(
          'table.orders',
          'order',
          'order.state IN (:...states)',
          { states: [OrderState.OPEN, OrderState.PENDING_PAYMENT] },
        )
        .where('table.roomId = :roomId', { roomId })
        .getMany();
      if (!tables) {
        throw new NotFoundException(`Tables with Room ID: ${roomId} not found`);
      }

      const result = tables.map((table) => ({
        id: table.id,
        name: table.name,
        isActive: table.isActive,
        state: table.state,
        orders: table.orders.map((order) => order.id),
      }));

      return result;
    } catch (error) {
      this.logError('getTablesByRoom', { roomId }, error);
      throw error;
    }
  }

  async getAllTablesAvailable(page: number, limit: number): Promise<Table[]> {
    if (page <= 0 || limit <= 0) {
      throw new BadRequestException(
        'Page and limit must be positive integers.',
      );
    }
    try {
      const tables = await this.tableRepository.find({
        where: { state: TableState.AVAILABLE },
      });
      if (!tables || tables.length === 0)
        throw new NotFoundException(
          'There are no tables available for transfer.',
        );
      return tables;
    } catch (error) {
      this.logError('getAllTablesAvailable', { page, limit }, error);
      throw error;
    }
  }
}
