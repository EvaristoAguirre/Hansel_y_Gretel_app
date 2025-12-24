import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { isUUID } from 'class-validator';
import { PromotionSlotRepository } from '../repositories/promotion-slot.repository';
import { ProductRepository } from '../repositories/product.repository';
import { LoggerService } from '../../Monitoring/monitoring-logger.service';
import { CreatePromotionSlotDto } from '../dtos/create-promotion-slot.dto';
import { UpdatePromotionSlotDto } from '../dtos/update-promotion-slot.dto';
import { CreateSlotOptionDto } from '../dtos/create-slot-option.dto';
import { UpdateSlotOptionDto } from '../dtos/update-slot-option.dto';
import { PromotionSlot } from '../entities/promotion-slot.entity';
import { PromotionSlotOption } from '../entities/promotion-slot-option.entity';
import { PromotionSlotAssignmentService } from './promotion-slot-assignment.service';

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
    private readonly assignmentService: PromotionSlotAssignmentService,
    @InjectRepository(PromotionSlotOption)
    private readonly promotionSlotOptionRepository: Repository<PromotionSlotOption>,
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
    // Validar campos requeridos
    if (!createDto.name || createDto.name.trim() === '') {
      throw new BadRequestException('Name is required and cannot be empty.');
    }

    // Validar formato del promotionId solo si se proporciona
    if (createDto.promotionId) {
      this.validateUUID(createDto.promotionId, 'promotionId');
    }

    const queryRunner = this.promotionSlotRepository.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validar que la promoción exista solo si se proporciona
      if (createDto.promotionId) {
        await this.validatePromotionExists(createDto.promotionId);
      }

      // Crear el slot (sin promotionId, quantity, displayOrder, isOptional)
      const slotData = {
        name: createDto.name,
        description: createDto.description,
      };

      const promotionSlot = await this.promotionSlotRepository.create(
        slotData,
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
   * Obtiene todos los slots de una promoción específica a través de las asignaciones
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

      // Obtener asignaciones de la promoción
      const assignments = await this.assignmentService.findByPromotionId(
        promotionId,
      );

      // Extraer los slots de las asignaciones
      const slots = assignments.map((assignment) => assignment.slot);

      // Filtrar por isActive si es necesario
      if (!includeInactive) {
        return slots.filter((slot) => slot.isActive);
      }

      return slots;
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

  // ==================== MÉTODOS PARA OPCIONES DE SLOTS ====================

  /**
   * Crea una nueva opción para un slot
   * @param createDto - Datos para crear la opción
   */
  async createOption(
    createDto: CreateSlotOptionDto,
  ): Promise<PromotionSlotOption> {
    // Validar formato de IDs
    this.validateUUID(createDto.slotId, 'slotId');
    this.validateUUID(createDto.productId, 'productId');

    // Validar campos numéricos
    if (createDto.extraCost < 0) {
      throw new BadRequestException('Extra cost cannot be negative.');
    }

    if (createDto.displayOrder < 0) {
      throw new BadRequestException('Display order cannot be negative.');
    }

    const queryRunner = this.promotionSlotRepository.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validar que el slot exista
      const slot = await queryRunner.manager.findOne(PromotionSlot, {
        where: { id: createDto.slotId, isActive: true },
      });

      if (!slot) {
        throw new NotFoundException(
          `Promotion slot with ID ${createDto.slotId} not found.`,
        );
      }

      // Validar que el producto exista y esté activo
      const product = await this.productRepository.getProductById(
        createDto.productId,
      );

      if (!product) {
        throw new NotFoundException(
          `Product with ID ${createDto.productId} not found.`,
        );
      }

      // Validar que el producto NO sea una promoción (evitar recursión)
      if (product.type === 'promotion') {
        throw new BadRequestException(
          `Cannot add promotion "${product.name}" as a slot option. Only regular products are allowed.`,
        );
      }

      // Si la nueva opción debe ser default, desmarcar otras opciones default del mismo slot
      if (createDto.isDefault) {
        await queryRunner.manager.update(
          PromotionSlotOption,
          { slotId: createDto.slotId, isDefault: true },
          { isDefault: false },
        );
      }

      // Crear la opción
      const option = queryRunner.manager.create(PromotionSlotOption, {
        ...createDto,
        isActive: true,
      });

      const savedOption = await queryRunner.manager.save(
        PromotionSlotOption,
        option,
      );

      await queryRunner.commitTransaction();

      // Retornar opción con relaciones
      return await this.promotionSlotOptionRepository.findOne({
        where: { id: savedOption.id },
        relations: ['product', 'slot'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof HttpException) {
        throw error;
      }

      this.logError('createOption', { createDto }, error);
      throw new InternalServerErrorException(
        'Error creating slot option.',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Actualiza una opción existente de un slot
   * @param optionId - ID de la opción a actualizar
   * @param updateDto - Datos a actualizar
   */
  async updateOption(
    optionId: string,
    updateDto: UpdateSlotOptionDto,
  ): Promise<PromotionSlotOption> {
    this.validateUUID(optionId, 'optionId');

    // Validar que hay datos para actualizar
    if (Object.keys(updateDto).length === 0) {
      throw new BadRequestException('No update data provided.');
    }

    // Validar campos numéricos si se proporcionan
    if (updateDto.extraCost !== undefined && updateDto.extraCost < 0) {
      throw new BadRequestException('Extra cost cannot be negative.');
    }

    if (updateDto.displayOrder !== undefined && updateDto.displayOrder < 0) {
      throw new BadRequestException('Display order cannot be negative.');
    }

    const queryRunner = this.promotionSlotRepository.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar que la opción existe
      const existingOption = await queryRunner.manager.findOne(
        PromotionSlotOption,
        {
          where: { id: optionId, isActive: true },
          relations: ['slot'],
        },
      );

      if (!existingOption) {
        throw new NotFoundException(
          `Slot option with ID ${optionId} not found.`,
        );
      }

      // Si se actualiza el producto, validar que exista y no sea promoción
      if (updateDto.productId) {
        this.validateUUID(updateDto.productId, 'productId');

        const product = await this.productRepository.getProductById(
          updateDto.productId,
        );

        if (!product) {
          throw new NotFoundException(
            `Product with ID ${updateDto.productId} not found.`,
          );
        }

        if (product.type === 'promotion') {
          throw new BadRequestException(
            `Cannot add promotion "${product.name}" as a slot option. Only regular products are allowed.`,
          );
        }
      }

      // Si cambia isDefault a true, desmarcar otras opciones del mismo slot
      if (updateDto.isDefault === true && !existingOption.isDefault) {
        await queryRunner.manager.update(
          PromotionSlotOption,
          {
            slotId: existingOption.slotId,
            isDefault: true,
            id: Not(optionId),
          },
          { isDefault: false },
        );
      }

      // Actualizar la opción
      await queryRunner.manager.update(
        PromotionSlotOption,
        optionId,
        updateDto,
      );

      await queryRunner.commitTransaction();

      // Retornar opción actualizada con relaciones
      return await this.promotionSlotOptionRepository.findOne({
        where: { id: optionId },
        relations: ['product', 'slot'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof HttpException) {
        throw error;
      }

      this.logError('updateOption', { optionId, updateDto }, error);
      throw new InternalServerErrorException(
        'Error updating slot option.',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Elimina una opción de un slot (soft delete)
   * @param optionId - ID de la opción a eliminar
   */
  async deleteOption(optionId: string): Promise<{ message: string }> {
    this.validateUUID(optionId, 'optionId');

    const queryRunner = this.promotionSlotRepository.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar que la opción existe
      const existingOption = await queryRunner.manager.findOne(
        PromotionSlotOption,
        {
          where: { id: optionId, isActive: true },
        },
      );

      if (!existingOption) {
        throw new NotFoundException(
          `Slot option with ID ${optionId} not found.`,
        );
      }

      // Validar que quede al menos una opción activa en el slot
      const activeOptionsCount = await queryRunner.manager.count(
        PromotionSlotOption,
        {
          where: { slotId: existingOption.slotId, isActive: true },
        },
      );

      if (activeOptionsCount <= 1) {
        throw new BadRequestException(
          'Cannot delete the last active option of a slot. At least one option must remain active.',
        );
      }

      // Si era la opción default, marcar otra como default automáticamente
      if (existingOption.isDefault) {
        // Buscar otra opción activa del mismo slot
        const otherOption = await queryRunner.manager.findOne(
          PromotionSlotOption,
          {
            where: {
              slotId: existingOption.slotId,
              isActive: true,
              id: Not(optionId),
            },
            order: { displayOrder: 'ASC' },
          },
        );

        if (otherOption) {
          await queryRunner.manager.update(
            PromotionSlotOption,
            otherOption.id,
            { isDefault: true },
          );
        }
      }

      // Soft delete de la opción (marcar como inactiva)
      await queryRunner.manager.update(PromotionSlotOption, optionId, {
        isActive: false,
      });

      await queryRunner.commitTransaction();

      return {
        message: `Slot option with ID ${optionId} deleted successfully.`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof HttpException) {
        throw error;
      }

      this.logError('deleteOption', { optionId }, error);
      throw new InternalServerErrorException(
        'Error deleting slot option.',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Reordena las opciones de un slot
   * @param slotId - ID del slot
   * @param orderArray - Array de IDs de opciones en el orden deseado
   */
  async reorderOptions(slotId: string, orderArray: string[]): Promise<void> {
    this.validateUUID(slotId, 'slotId');

    if (!orderArray || orderArray.length === 0) {
      throw new BadRequestException('Order array must not be empty.');
    }

    // Validar que todos los IDs sean UUID válidos
    for (const id of orderArray) {
      this.validateUUID(id, 'Option ID in order array');
    }

    const queryRunner = this.promotionSlotRepository.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar que el slot existe
      const slot = await queryRunner.manager.findOne(PromotionSlot, {
        where: { id: slotId, isActive: true },
      });

      if (!slot) {
        throw new NotFoundException(
          `Promotion slot with ID ${slotId} not found.`,
        );
      }

      // Obtener todas las opciones activas del slot
      const slotOptions = await queryRunner.manager.find(PromotionSlotOption, {
        where: { slotId, isActive: true },
      });

      // Validar que todos los IDs en el array pertenecen al slot
      const slotOptionIds = slotOptions.map((opt) => opt.id);
      for (const optionId of orderArray) {
        if (!slotOptionIds.includes(optionId)) {
          throw new BadRequestException(
            `Option with ID ${optionId} does not belong to slot ${slotId} or is not active.`,
          );
        }
      }

      // Validar que todos los IDs del slot están en el array
      if (orderArray.length !== slotOptions.length) {
        throw new BadRequestException(
          `Order array must include all active options of the slot. Expected ${slotOptions.length}, got ${orderArray.length}.`,
        );
      }

      // Actualizar displayOrder de cada opción según el índice en el array
      for (let i = 0; i < orderArray.length; i++) {
        await queryRunner.manager.update(PromotionSlotOption, orderArray[i], {
          displayOrder: i,
        });
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof HttpException) {
        throw error;
      }

      this.logError('reorderOptions', { slotId, orderArray }, error);
      throw new InternalServerErrorException(
        'Error reordering slot options.',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Marca una opción específica como default en un slot
   * @param slotId - ID del slot
   * @param optionId - ID de la opción a marcar como default
   */
  async setDefaultOption(
    slotId: string,
    optionId: string,
  ): Promise<PromotionSlotOption> {
    this.validateUUID(slotId, 'slotId');
    this.validateUUID(optionId, 'optionId');

    const queryRunner = this.promotionSlotRepository.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar que el slot existe
      const slot = await queryRunner.manager.findOne(PromotionSlot, {
        where: { id: slotId, isActive: true },
      });

      if (!slot) {
        throw new NotFoundException(
          `Promotion slot with ID ${slotId} not found.`,
        );
      }

      // Verificar que la opción existe y pertenece al slot
      const option = await queryRunner.manager.findOne(PromotionSlotOption, {
        where: { id: optionId, slotId, isActive: true },
      });

      if (!option) {
        throw new NotFoundException(
          `Slot option with ID ${optionId} not found in slot ${slotId} or is not active.`,
        );
      }

      // Desmarcar todas las opciones del slot como default
      await queryRunner.manager.update(
        PromotionSlotOption,
        { slotId, isDefault: true },
        { isDefault: false },
      );

      // Marcar la opción especificada como default
      await queryRunner.manager.update(PromotionSlotOption, optionId, {
        isDefault: true,
      });

      await queryRunner.commitTransaction();

      // Retornar la opción actualizada con relaciones
      return await this.promotionSlotOptionRepository.findOne({
        where: { id: optionId },
        relations: ['product', 'slot'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof HttpException) {
        throw error;
      }

      this.logError('setDefaultOption', { slotId, optionId }, error);
      throw new InternalServerErrorException(
        'Error setting default option.',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }
}
