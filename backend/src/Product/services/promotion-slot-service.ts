import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { PromotionSlotRepository } from '../repositories/promotion-slot.repository';
import { ProductRepository } from '../repositories/product.repository';
import { LoggerService } from '../../Monitoring/monitoring-logger.service';
import { CreatePromotionSlotDto } from '../dtos/create-promotion-slot.dto';
import { UpdatePromotionSlotDto } from '../dtos/update-promotion-slot.dto';
import { PromotionSlot } from '../entities/promotion-slot.entity';

interface FindAllOptions {
  page?: number;
  limit?: number;
  promotionId?: string;
  includeInactive?: boolean;
}

@Injectable()
export class PromotionSlotService {
  constructor(
    private readonly promotionSlotRepository: PromotionSlotRepository,
    private readonly productRepository: ProductRepository,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * Método auxiliar para loguear errores con información estructurada
   */
  private logError(
    operation: string,
    context: Record<string, any>,
    error: any,
  ): void {
    const errorInfo = {
      operation,
      service: 'PromotionSlotService',
      context,
      timestamp: new Date().toISOString(),
    };
    this.loggerService.error(errorInfo, error);
  }

  /**
   * Valida que un ID tenga formato UUID válido
   */
  private validateUUID(id: string, fieldName: string = 'ID'): void {
    if (!id) {
      throw new BadRequestException(`${fieldName} must be provided.`);
    }
    if (!isUUID(id)) {
      throw new BadRequestException(
        `Invalid ${fieldName} format. Must be a valid UUID.`,
      );
    }
  }

  /**
   * Valida que una promoción exista
   */
  private async validatePromotionExists(promotionId: string): Promise<void> {
    const exists = await this.productRepository.existsById(
      promotionId,
      'promotion',
    );
    if (!exists) {
      throw new NotFoundException(
        `Promotion with ID ${promotionId} not found.`,
      );
    }
  }

  /**
   * Crea un nuevo PromotionSlot
   * @param createDto - Datos para crear el slot
   */
  async create(createDto: CreatePromotionSlotDto): Promise<PromotionSlot> {
    // Validar formato del promotionId
    this.validateUUID(createDto.promotionId, 'promotionId');

    // Validar campos requeridos
    if (!createDto.name || createDto.name.trim() === '') {
      throw new BadRequestException('Name is required and cannot be empty.');
    }

    if (createDto.quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1.');
    }

    if (createDto.displayOrder < 0) {
      throw new BadRequestException('Display order cannot be negative.');
    }

    const queryRunner = this.promotionSlotRepository.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validar que la promoción exista
      await this.validatePromotionExists(createDto.promotionId);

      // Crear el slot
      const promotionSlot = await this.promotionSlotRepository.create(
        createDto,
        queryRunner,
      );

      await queryRunner.commitTransaction();
      return promotionSlot;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof HttpException) {
        throw error;
      }

      this.logError('create', { createDto }, error);
      throw new InternalServerErrorException(
        'Error creating promotion slot.',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Obtiene todos los PromotionSlots con opciones de filtrado y paginación flexible
   * @param options - Opciones de búsqueda (page, limit, promotionId, includeInactive)
   */
  async findAll(options: FindAllOptions = {}): Promise<PromotionSlot[]> {
    try {
      // Validar paginación si se proporciona
      if (options.page !== undefined || options.limit !== undefined) {
        if (options.page !== undefined && options.page <= 0) {
          throw new BadRequestException('Page must be a positive integer.');
        }
        if (options.limit !== undefined && options.limit <= 0) {
          throw new BadRequestException('Limit must be a positive integer.');
        }
        // Si se proporciona uno, se debe proporcionar el otro
        if (
          (options.page !== undefined && options.limit === undefined) ||
          (options.page === undefined && options.limit !== undefined)
        ) {
          throw new BadRequestException(
            'Both page and limit must be provided for pagination.',
          );
        }
      }

      // Validar promotionId si se proporciona
      if (options.promotionId) {
        this.validateUUID(options.promotionId, 'promotionId');
      }

      return await this.promotionSlotRepository.findAll(options);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logError('findAll', { options }, error);
      throw new InternalServerErrorException(
        'Error fetching promotion slots.',
        error.message,
      );
    }
  }

  /**
   * Obtiene un PromotionSlot por su ID
   * @param id - ID del slot
   */
  async findById(id: string): Promise<PromotionSlot> {
    this.validateUUID(id);

    try {
      const promotionSlot = await this.promotionSlotRepository.findById(id);

      if (!promotionSlot) {
        throw new NotFoundException(`Promotion slot with ID ${id} not found.`);
      }

      return promotionSlot;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logError('findById', { id }, error);
      throw new InternalServerErrorException(
        'Error fetching promotion slot.',
        error.message,
      );
    }
  }

  /**
   * Obtiene todos los slots de una promoción específica
   * @param promotionId - ID de la promoción
   * @param includeInactive - Si debe incluir slots inactivos
   */
  async findByPromotionId(
    promotionId: string,
    includeInactive: boolean = false,
  ): Promise<PromotionSlot[]> {
    this.validateUUID(promotionId, 'promotionId');

    try {
      // Validar que la promoción exista
      await this.validatePromotionExists(promotionId);

      return await this.promotionSlotRepository.findByPromotionId(
        promotionId,
        includeInactive,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logError(
        'findByPromotionId',
        { promotionId, includeInactive },
        error,
      );
      throw new InternalServerErrorException(
        'Error fetching promotion slots by promotion.',
        error.message,
      );
    }
  }

  /**
   * Actualiza un PromotionSlot existente
   * @param id - ID del slot a actualizar
   * @param updateDto - Datos a actualizar
   */
  async update(
    id: string,
    updateDto: UpdatePromotionSlotDto,
  ): Promise<PromotionSlot> {
    this.validateUUID(id);

    // Validar que hay datos para actualizar
    if (Object.keys(updateDto).length === 0) {
      throw new BadRequestException('No update data provided.');
    }

    // Validar campos si se proporcionan
    if (updateDto.name !== undefined && updateDto.name.trim() === '') {
      throw new BadRequestException('Name cannot be empty.');
    }

    if (updateDto.quantity !== undefined && updateDto.quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1.');
    }

    if (updateDto.displayOrder !== undefined && updateDto.displayOrder < 0) {
      throw new BadRequestException('Display order cannot be negative.');
    }

    const queryRunner = this.promotionSlotRepository.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar que el slot existe
      const existingSlot = await this.promotionSlotRepository.findById(id);
      if (!existingSlot) {
        throw new NotFoundException(`Promotion slot with ID ${id} not found.`);
      }

      // Actualizar el slot
      const updatedSlot = await this.promotionSlotRepository.update(
        id,
        updateDto,
        queryRunner,
      );

      await queryRunner.commitTransaction();
      return updatedSlot;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof HttpException) {
        throw error;
      }

      this.logError('update', { id, updateDto }, error);
      throw new InternalServerErrorException(
        'Error updating promotion slot.',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Elimina (soft delete) un PromotionSlot
   * @param id - ID del slot a eliminar
   */
  async delete(id: string): Promise<{ message: string }> {
    this.validateUUID(id);

    const queryRunner = this.promotionSlotRepository.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar que el slot existe
      const existingSlot = await this.promotionSlotRepository.findById(id);
      if (!existingSlot) {
        throw new NotFoundException(`Promotion slot with ID ${id} not found.`);
      }

      // Soft delete del slot
      await this.promotionSlotRepository.softDelete(id, queryRunner);

      await queryRunner.commitTransaction();
      return { message: `Promotion slot with ID ${id} deleted successfully.` };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof HttpException) {
        throw error;
      }

      this.logError('delete', { id }, error);
      throw new InternalServerErrorException(
        'Error deleting promotion slot.',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Restaura un PromotionSlot eliminado (soft delete)
   * @param id - ID del slot a restaurar
   */
  async restore(id: string): Promise<PromotionSlot> {
    this.validateUUID(id);

    const queryRunner = this.promotionSlotRepository.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar que el slot existe (incluyendo eliminados)
      const existingSlot = await this.promotionSlotRepository.findById(
        id,
        true,
      );
      if (!existingSlot) {
        throw new NotFoundException(`Promotion slot with ID ${id} not found.`);
      }

      if (!existingSlot.deletedAt) {
        throw new BadRequestException(
          `Promotion slot with ID ${id} is not deleted.`,
        );
      }

      // Restaurar el slot
      await this.promotionSlotRepository.restore(id, queryRunner);

      await queryRunner.commitTransaction();

      // Obtener el slot restaurado
      return await this.promotionSlotRepository.findById(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof HttpException) {
        throw error;
      }

      this.logError('restore', { id }, error);
      throw new InternalServerErrorException(
        'Error restoring promotion slot.',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }
}
