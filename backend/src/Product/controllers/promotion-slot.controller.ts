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
import { CreateSlotOptionDto } from '../dtos/create-slot-option.dto';
import { UpdateSlotOptionDto } from '../dtos/update-slot-option.dto';

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
    @Query() options: FindAllOptions,
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

  // Crear opción en un slot
  @Post('option')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async createSlotOption(@Body() createData: CreateSlotOptionDto) {
    return await this.promotionSlotService.createOption(createData);
  }

  // Actualizar opción
  @Patch('option/:optionId')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async updateSlotOption(
    @Param('optionId') optionId: string,
    @Body() updateData: UpdateSlotOptionDto,
  ) {
    return await this.promotionSlotService.updateOption(optionId, updateData);
  }

  // Eliminar opción
  @Delete('option/:optionId')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async deleteSlotOption(@Param('optionId') optionId: string) {
    return await this.promotionSlotService.deleteOption(optionId);
  }

  // Reordenar opciones de un slot
  @Patch(':slotId/options/reorder')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async reorderSlotOptions(
    @Param('slotId') slotId: string,
    @Body() body: { orderArray: string[] },
  ) {
    return await this.promotionSlotService.reorderOptions(
      slotId,
      body.orderArray,
    );
  }

  // Marcar opción como default
  @Patch(':slotId/options/:optionId/set-default')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async setDefaultOption(
    @Param('slotId') slotId: string,
    @Param('optionId') optionId: string,
  ) {
    return await this.promotionSlotService.setDefaultOption(slotId, optionId);
  }
}
