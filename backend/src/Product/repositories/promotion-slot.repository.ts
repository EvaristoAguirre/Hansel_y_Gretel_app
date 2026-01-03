import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { PromotionSlot } from '../entities/promotion-slot.entity';
import { CreatePromotionSlotDto } from '../dtos/create-promotion-slot.dto';
import { UpdatePromotionSlotDto } from '../dtos/update-promotion-slot.dto';

interface FindAllOptions {
  page?: number;
  limit?: number;
  promotionId?: string;
  includeInactive?: boolean;
}

@Injectable()
export class PromotionSlotRepository {
  private readonly logger = new Logger(PromotionSlotRepository.name);
  constructor(
    @InjectRepository(PromotionSlot)
    private readonly promotionSlotRepository: Repository<PromotionSlot>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Crea un nuevo PromotionSlot
   * @param createDto - Datos para crear el slot
   * @param queryRunner - QueryRunner opcional para transacciones externas
   */
  async create(
    createDto: CreatePromotionSlotDto,
    queryRunner?: QueryRunner,
  ): Promise<PromotionSlot> {
    const manager = queryRunner
      ? queryRunner.manager
      : this.promotionSlotRepository.manager;

    try {
      const promotionSlot = manager.create(PromotionSlot, createDto);
      return await manager.save(PromotionSlot, promotionSlot);
    } catch (error) {
      this.logger.error('create', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los PromotionSlots con opciones de filtrado y paginación
   * @param options - Opciones de búsqueda (page, limit, promotionId, includeInactive)
   */
  async findAll(options: FindAllOptions = {}): Promise<PromotionSlot[]> {
    const { page, limit, promotionId, includeInactive = false } = options;

    try {
      const whereCondition: Record<string, any> = {};

      if (promotionId) {
        whereCondition.promotionId = promotionId;
      }

      if (!includeInactive) {
        whereCondition.isActive = true;
      }

      const queryOptions: Record<string, any> = {
        where: whereCondition,
        relations: ['options', 'options.product', 'assignments'],
        order: { createdAt: 'ASC' },
      };

      if (page && limit) {
        queryOptions.skip = (page - 1) * limit;
        queryOptions.take = limit;
      }

      return await this.promotionSlotRepository.find(queryOptions);
    } catch (error) {
      this.logger.error('findAll', error);
      throw error;
    }
  }

  /**
   * Obtiene un PromotionSlot por su ID
   * @param id - ID del slot
   * @param includeDeleted - Si debe incluir registros eliminados (soft delete)
   */
  async findById(
    id: string,
    includeDeleted: boolean = false,
  ): Promise<PromotionSlot | null> {
    try {
      return await this.promotionSlotRepository.findOne({
        where: { id },
        relations: [
          'options',
          'options.product',
          'assignments',
          'assignments.promotion',
        ],
        withDeleted: includeDeleted,
      });
    } catch (error) {
      this.logger.error('findById', error);
      throw error;
    }
  }

  /**
   * Verifica si existe un PromotionSlot por su ID
   * @param id - ID del slot
   */
  async existsById(id: string): Promise<boolean> {
    try {
      const count = await this.promotionSlotRepository.count({
        where: { id },
      });
      return count > 0;
    } catch (error) {
      this.logger.error('existsById', error);
      throw error;
    }
  }

  /**
   * Actualiza un PromotionSlot existente
   * @param id - ID del slot a actualizar
   * @param updateDto - Datos a actualizar
   * @param queryRunner - QueryRunner opcional para transacciones externas
   */
  async update(
    id: string,
    updateDto: UpdatePromotionSlotDto,
    queryRunner?: QueryRunner,
  ): Promise<PromotionSlot> {
    const manager = queryRunner
      ? queryRunner.manager
      : this.promotionSlotRepository.manager;

    try {
      await manager.update(PromotionSlot, id, updateDto);
      return await manager.findOne(PromotionSlot, {
        where: { id },
        relations: ['options', 'options.product'],
      });
    } catch (error) {
      this.logger.error('update', error);
      throw error;
    }
  }

  /**
   * Soft delete de un PromotionSlot
   * @param id - ID del slot a eliminar
   * @param queryRunner - QueryRunner opcional para transacciones externas
   */
  async softDelete(id: string, queryRunner?: QueryRunner): Promise<void> {
    const manager = queryRunner
      ? queryRunner.manager
      : this.promotionSlotRepository.manager;

    try {
      await manager.softDelete(PromotionSlot, id);
    } catch (error) {
      this.logger.error('softDelete', error);
      throw error;
    }
  }

  /**
   * Restaura un PromotionSlot eliminado (soft delete)
   * @param id - ID del slot a restaurar
   * @param queryRunner - QueryRunner opcional para transacciones externas
   */
  async restore(id: string, queryRunner?: QueryRunner): Promise<void> {
    const manager = queryRunner
      ? queryRunner.manager
      : this.promotionSlotRepository.manager;

    try {
      await manager.restore(PromotionSlot, id);
    } catch (error) {
      this.logger.error('restore', error);
      throw error;
    }
  }

  /**
   * Crea un QueryRunner para manejar transacciones desde el servicio
   */
  createQueryRunner(): ReturnType<DataSource['createQueryRunner']> {
    return this.dataSource.createQueryRunner();
  }
}
