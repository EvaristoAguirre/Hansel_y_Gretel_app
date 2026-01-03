import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { isUUID } from 'class-validator';
import { PromotionSlotRepository } from '../repositories/promotion-slot.repository';
import { ProductRepository } from '../repositories/product.repository';
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
  private readonly logger = new Logger(PromotionSlotService.name);
  constructor(
    private readonly promotionSlotRepository: PromotionSlotRepository,
    private readonly productRepository: ProductRepository,
    private readonly assignmentService: PromotionSlotAssignmentService,
    @InjectRepository(PromotionSlotOption)
    private readonly promotionSlotOptionRepository: Repository<PromotionSlotOption>,
  ) {}

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
  private async validatePromotionExists(promotionId: string) {
    const exists = await this.productRepository.existsById(
      promotionId,
      'promotion',
    );
    if (!exists) {
      throw new NotFoundException(
        `Promotion with ID ${promotionId} not found.`,
      );
    }
    return exists;
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

    const queryRunner = this.promotionSlotRepository.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Crear el slot (sin promotionId, quantity, displayOrder, isOptional)
      const slotData = {
        name: createDto.name,
        description: createDto.description,
      };

      const promotionSlot = await this.promotionSlotRepository.create(
        slotData,
        queryRunner,
      );

      // Validar y crear opciones de productos para el slot
      if (createDto.productIds && createDto.productIds.length > 0) {
        // Validar que no haya IDs duplicados
        const uniqueProductIds = [...new Set(createDto.productIds)];
        if (uniqueProductIds.length !== createDto.productIds.length) {
          throw new BadRequestException(
            'Duplicate product IDs are not allowed.',
          );
        }

        // Validar y crear cada opción de producto
        for (const productId of uniqueProductIds) {
          // Validar formato UUID (ya validado por DTO, pero por seguridad)
          this.validateUUID(productId, 'productId');

          // Validar que el producto exista
          const product =
            await this.productRepository.getProductById(productId);
          if (!product) {
            throw new NotFoundException(
              `Product with ID ${productId} not found.`,
            );
          }

          // Validar que el producto NO sea una promoción (evitar recursión)
          if (product.type === 'promotion') {
            throw new BadRequestException(
              `Cannot add promotion "${product.name}" as a slot option. Only regular products are allowed.`,
            );
          }

          // Validar que el producto esté activo
          if (!product.isActive) {
            throw new BadRequestException(
              `Product with ID ${productId} is not active.`,
            );
          }

          // Crear la opción del slot usando el queryRunner
          const option = queryRunner.manager.create(PromotionSlotOption, {
            slotId: promotionSlot.id,
            productId: productId,
            isDefault: false,
            extraCost: 0,
            displayOrder: 0,
            isActive: true,
          });

          await queryRunner.manager.save(PromotionSlotOption, option);
        }
      }

      // Cargar el slot con sus relaciones usando el queryRunner antes del commit
      const promotionSlotWithOptions = await queryRunner.manager.findOne(
        PromotionSlot,
        {
          where: { id: promotionSlot.id },
          relations: [
            'options',
            'options.product',
            'assignments',
            'assignments.promotion',
          ],
        },
      );

      if (!promotionSlotWithOptions) {
        throw new Error('Error loading created promotion slot.');
      }

      await queryRunner.commitTransaction();
      return promotionSlotWithOptions;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      this.logger.error('createPromotionSlot', error);
      throw error;
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
        await this.validatePromotionExists(options.promotionId);
      }
      return await this.promotionSlotRepository.findAll(options);
    } catch (error) {
      this.logger.error('findAllPromotionSlots', error);
      throw error;
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
      this.logger.error('findPromotionSlotById', error);
      throw error;
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
      const assignments =
        await this.assignmentService.findByPromotionId(promotionId);

      // Extraer los slots de las asignaciones
      const slots = assignments.map((assignment) => assignment.slot);

      // Filtrar por isActive si es necesario
      if (!includeInactive) {
        return slots.filter((slot) => slot.isActive);
      }

      return slots;
    } catch (error) {
      this.logger.error('findByPromotionId', error);
      throw error;
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

      this.logger.error('updatePromotionSlot', error);
      throw error;
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

      this.logger.error('deletePromotionSlot', error);
      throw error;
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

      this.logger.error('restorePromotionSlot', error);
      throw error;
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

      this.logger.error('createOption', error);
      throw error;
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

      this.logger.error('updateOption', error);
      throw error;
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
      this.logger.error('deleteOption', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
