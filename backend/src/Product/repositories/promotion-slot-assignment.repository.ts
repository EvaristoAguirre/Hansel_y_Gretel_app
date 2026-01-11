import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { PromotionSlotAssignment } from '../entities/promotion-slot-assignment.entity';
import { CreatePromotionSlotAssignmentDto } from '../dtos/create-promotion-slot-assignment.dto';
import { UpdatePromotionSlotAssignmentDto } from '../dtos/update-promotion-slot-assignment.dto';

@Injectable()
export class PromotionSlotAssignmentRepository {
  private readonly logger = new Logger(PromotionSlotAssignmentRepository.name);
  constructor(
    @InjectRepository(PromotionSlotAssignment)
    private readonly promotionSlotAssignmentRepository: Repository<PromotionSlotAssignment>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Crea una nueva asignación de slot a promoción
   */
  async create(
    createDto: CreatePromotionSlotAssignmentDto & { promotionId: string },
    queryRunner?: QueryRunner,
  ): Promise<PromotionSlotAssignment> {
    const manager = queryRunner
      ? queryRunner.manager
      : this.promotionSlotAssignmentRepository.manager;

    try {
      const assignment = manager.create(PromotionSlotAssignment, createDto);
      return await manager.save(PromotionSlotAssignment, assignment);
    } catch (error) {
      this.logger.error('create', error);
      throw error;
    }
  }

  /**
   * Obtiene una asignación por ID
   */
  async findById(id: string): Promise<PromotionSlotAssignment | null> {
    try {
      return await this.promotionSlotAssignmentRepository.findOne({
        where: { id },
        relations: ['promotion', 'slot', 'slot.options'],
      });
    } catch (error) {
      this.logger.error('findById', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las asignaciones de una promoción
   */
  async findByPromotionId(
    promotionId: string,
  ): Promise<PromotionSlotAssignment[]> {
    try {
      return await this.promotionSlotAssignmentRepository.find({
        where: { promotionId },
        relations: ['slot', 'slot.options', 'slot.options.product'],
        order: { createdAt: 'ASC' },
      });
    } catch (error) {
      this.logger.error('findByPromotionId', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las asignaciones de un slot
   */
  async findBySlotId(slotId: string): Promise<PromotionSlotAssignment[]> {
    try {
      return await this.promotionSlotAssignmentRepository.find({
        where: { slotId },
        relations: ['promotion'],
      });
    } catch (error) {
      this.logger.error('findBySlotId', error);
      throw error;
    }
  }

  /**
   * Verifica si ya existe una asignación entre un slot y una promoción
   */
  async exists(
    promotionId: string,
    slotId: string,
  ): Promise<PromotionSlotAssignment | null> {
    try {
      return await this.promotionSlotAssignmentRepository.findOne({
        where: { promotionId, slotId },
      });
    } catch (error) {
      this.logger.error('exists', error);
      throw error;
    }
  }

  /**
   * Actualiza una asignación
   */
  async update(
    id: string,
    updateDto: UpdatePromotionSlotAssignmentDto,
    queryRunner?: QueryRunner,
  ): Promise<PromotionSlotAssignment> {
    const manager = queryRunner
      ? queryRunner.manager
      : this.promotionSlotAssignmentRepository.manager;

    try {
      await manager.update(PromotionSlotAssignment, id, updateDto);
      const updated = await manager.findOne(PromotionSlotAssignment, {
        where: { id },
        relations: ['promotion', 'slot', 'slot.options'],
      });
      if (!updated) {
        throw new Error('Assignment not found after update');
      }
      return updated;
    } catch (error) {
      this.logger.error('update', error);
      throw error;
    }
  }

  /**
   * Elimina una asignación
   */
  async delete(id: string, queryRunner?: QueryRunner): Promise<void> {
    const manager = queryRunner
      ? queryRunner.manager
      : this.promotionSlotAssignmentRepository.manager;

    try {
      await manager.delete(PromotionSlotAssignment, id);
    } catch (error) {
      this.logger.error('delete', error);
      throw error;
    }
  }

  /**
   * Crea un QueryRunner para transacciones
   */
  createQueryRunner(): QueryRunner {
    return this.dataSource.createQueryRunner();
  }
}
