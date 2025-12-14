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
import { ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/Guards/roles.guard';
import { PromotionSlotService } from '../services/promotion-slot-service';
import { UserRole } from 'src/Enums/roles.enum';
import { CreatePromotionSlotDto } from '../dtos/create-promotion-slot.dto';
import { PromotionSlot } from '../entities/promotion-slot.entity';
import { Roles } from 'src/Decorators/roles.decorator';
import { UpdatePromotionSlotDto } from '../dtos/update-promotion-slot.dto';

interface FindAllOptions {
  page?: number;
  limit?: number;
  promotionId?: string;
  includeInactive?: boolean;
}

@ApiTags('Promotion Slot')
@Controller('promotion-slot')
@UseGuards(RolesGuard)
export class PromotionSlotController {
  constructor(private readonly promotionSlotService: PromotionSlotService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async createPromotionSlot(
    @Body() createData: CreatePromotionSlotDto,
  ): Promise<PromotionSlot> {
    return await this.promotionSlotService.create(createData);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  async getAllPromotionSlots(
    options: FindAllOptions,
  ): Promise<PromotionSlot[]> {
    return await this.promotionSlotService.findAll(options);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  async getPromotionSlotById(@Param('id') id: string): Promise<PromotionSlot> {
    return await this.promotionSlotService.findById(id);
  }

  @Get('promotion/:promotionId')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  async getPromotionSlotsByPromotionId(
    @Param('promotionId') promotionId: string,
    @Query('includeInactive') includeInactive: boolean = false,
  ): Promise<PromotionSlot[]> {
    return await this.promotionSlotService.findByPromotionId(
      promotionId,
      includeInactive,
    );
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async updatePromotionSlot(
    @Param('id') id: string,
    @Body() updateData: UpdatePromotionSlotDto,
  ): Promise<PromotionSlot> {
    return await this.promotionSlotService.update(id, updateData);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async deletePromotionSlot(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return await this.promotionSlotService.delete(id);
  }

  @Patch(':id/restore')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async restorePromotionSlot(@Param('id') id: string): Promise<PromotionSlot> {
    return await this.promotionSlotService.restore(id);
  }
}
