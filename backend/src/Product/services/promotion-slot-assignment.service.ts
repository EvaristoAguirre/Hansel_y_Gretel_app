import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { PromotionSlotAssignmentRepository } from '../repositories/promotion-slot-assignment.repository';
import { PromotionSlotRepository } from '../repositories/promotion-slot.repository';
import { ProductRepository } from '../repositories/product.repository';
import { LoggerService } from '../../Monitoring/monitoring-logger.service';
import { CreatePromotionSlotAssignmentDto } from '../dtos/create-promotion-slot-assignment.dto';
import { UpdatePromotionSlotAssignmentDto } from '../dtos/update-promotion-slot-assignment.dto';
import { PromotionSlotAssignment } from '../entities/promotion-slot-assignment.entity';

@Injectable()
export class PromotionSlotAssignmentService {
  constructor(
    private readonly assignmentRepository: PromotionSlotAssignmentRepository,
    private readonly slotRepository: PromotionSlotRepository,
    private readonly productRepository: ProductRepository,
    private readonly loggerService: LoggerService,
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
   * Valida que un slot exista
   */
  private async validateSlotExists(slotId: string): Promise<void> {
    const slot = await this.slotRepository.findById(slotId);
    if (!slot) {
      throw new NotFoundException(`Slot with ID ${slotId} not found.`);
    }
  }

  /**
   * Crea una nueva asignación de slot a promoción
   */
  async create(
    promotionId: string,
    createDto: CreatePromotionSlotAssignmentDto,
  ): Promise<PromotionSlotAssignment> {
    this.validateUUID(promotionId, 'promotionId');
    this.validateUUID(createDto.slotId, 'slotId');

    if (createDto.quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1.');
    }

    const queryRunner = this.assignmentRepository.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validar que la promoción y el slot existan
      await this.validatePromotionExists(promotionId);
      await this.validateSlotExists(createDto.slotId);

      // Verificar que no exista ya una asignación entre este slot y esta promoción
      const existing = await this.assignmentRepository.exists(
        promotionId,
        createDto.slotId,
      );
      if (existing) {
        throw new BadRequestException(
          `Slot ${createDto.slotId} is already assigned to promotion ${promotionId}.`,
        );
      }

      // Crear la asignación
      const assignment = await this.assignmentRepository.create(
        {
          ...createDto,
          promotionId,
        },
        queryRunner,
      );

      await queryRunner.commitTransaction();
      return assignment;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof HttpException) {
        throw error;
      }

      this.loggerService.error(
        {
          operation: 'create',
          service: 'PromotionSlotAssignmentService',
          context: { promotionId, createDto },
        },
        error,
      );
      throw new InternalServerErrorException(
        'Error creating promotion slot assignment.',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Obtiene todas las asignaciones de una promoción
   */
  async findByPromotionId(
    promotionId: string,
  ): Promise<PromotionSlotAssignment[]> {
    this.validateUUID(promotionId, 'promotionId');

    try {
      await this.validatePromotionExists(promotionId);
      return await this.assignmentRepository.findByPromotionId(promotionId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.loggerService.error(
        {
          operation: 'findByPromotionId',
          service: 'PromotionSlotAssignmentService',
          context: { promotionId },
        },
        error,
      );
      throw new InternalServerErrorException(
        'Error fetching slot assignments by promotion.',
        error.message,
      );
    }
  }

  /**
   * Obtiene todas las asignaciones de un slot
   */
  async findBySlotId(slotId: string): Promise<PromotionSlotAssignment[]> {
    this.validateUUID(slotId, 'slotId');

    try {
      await this.validateSlotExists(slotId);
      return await this.assignmentRepository.findBySlotId(slotId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.loggerService.error(
        {
          operation: 'findBySlotId',
          service: 'PromotionSlotAssignmentService',
          context: { slotId },
        },
        error,
      );
      throw new InternalServerErrorException(
        'Error fetching slot assignments by slot.',
        error.message,
      );
    }
  }

  /**
   * Actualiza una asignación
   */
  async update(
    id: string,
    updateDto: UpdatePromotionSlotAssignmentDto,
  ): Promise<PromotionSlotAssignment> {
    this.validateUUID(id);

    if (Object.keys(updateDto).length === 0) {
      throw new BadRequestException('No update data provided.');
    }

    if (updateDto.quantity !== undefined && updateDto.quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1.');
    }

    const queryRunner = this.assignmentRepository.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existing = await this.assignmentRepository.findById(id);
      if (!existing) {
        throw new NotFoundException(
          `Slot assignment with ID ${id} not found.`,
        );
      }

      const updated = await this.assignmentRepository.update(
        id,
        updateDto,
        queryRunner,
      );

      await queryRunner.commitTransaction();
      return updated;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof HttpException) {
        throw error;
      }

      this.loggerService.error(
        {
          operation: 'update',
          service: 'PromotionSlotAssignmentService',
          context: { id, updateDto },
        },
        error,
      );
      throw new InternalServerErrorException(
        'Error updating slot assignment.',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Elimina una asignación
   */
  async delete(id: string): Promise<{ message: string }> {
    this.validateUUID(id);

    const queryRunner = this.assignmentRepository.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existing = await this.assignmentRepository.findById(id);
      if (!existing) {
        throw new NotFoundException(
          `Slot assignment with ID ${id} not found.`,
        );
      }

      await this.assignmentRepository.delete(id, queryRunner);

      await queryRunner.commitTransaction();
      return { message: `Slot assignment with ID ${id} deleted successfully.` };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof HttpException) {
        throw error;
      }

      this.loggerService.error(
        {
          operation: 'delete',
          service: 'PromotionSlotAssignmentService',
          context: { id },
        },
        error,
      );
      throw new InternalServerErrorException(
        'Error deleting slot assignment.',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }
}

