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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RolesGuard } from 'src/Guards/roles.guard';
import { PromotionSlotService } from '../services/promotion-slot.service';
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
@ApiBearerAuth()
@Controller('promotion-slot')
@UseGuards(RolesGuard)
export class PromotionSlotController {
  constructor(private readonly promotionSlotService: PromotionSlotService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  @ApiOperation({
    summary: 'Crear un nuevo slot de promoción',
    description:
      'Crea un slot (espacio) dentro de una promoción donde los clientes podrán elegir productos. Por ejemplo: "Torta", "Bebida", "Acompañamiento".',
  })
  @ApiBody({
    type: CreatePromotionSlotDto,
    description: 'Datos para crear el slot de promoción',
    examples: {
      example1: {
        summary: 'Slot de tortas',
        value: {
          promotionId: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Torta',
          description: 'Selecciona tu torta favorita',
          quantity: 1,
          displayOrder: 1,
          isOptional: false,
        },
      },
      example2: {
        summary: 'Slot de bebidas',
        value: {
          promotionId: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Bebida caliente',
          description: 'Elige una bebida caliente',
          quantity: 2,
          displayOrder: 2,
          isOptional: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Slot de promoción creado exitosamente',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174001',
        promotionId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Torta',
        description: 'Selecciona tu torta favorita',
        quantity: 1,
        displayOrder: 1,
        isOptional: false,
        isActive: true,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
        deletedAt: null,
        options: [],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async createPromotionSlot(
    @Body() createData: CreatePromotionSlotDto,
  ): Promise<PromotionSlot> {
    return await this.promotionSlotService.create(createData);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  @ApiOperation({
    summary: 'Obtener todos los slots de promoción',
    description:
      'Lista todos los slots de promoción con opciones de paginación y filtrado.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página (empieza en 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad de resultados por página',
    example: 10,
  })
  @ApiQuery({
    name: 'promotionId',
    required: false,
    type: String,
    description: 'Filtrar por ID de promoción específica',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Incluir slots inactivos en los resultados',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de slots de promoción',
    schema: {
      example: [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          promotionId: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Torta',
          description: 'Selecciona tu torta favorita',
          quantity: 1,
          displayOrder: 1,
          isOptional: false,
          isActive: true,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
          deletedAt: null,
          options: [
            {
              id: '123e4567-e89b-12d3-a456-426614174010',
              slotId: '123e4567-e89b-12d3-a456-426614174001',
              productId: '123e4567-e89b-12d3-a456-426614174100',
              isDefault: true,
              extraCost: 0,
              displayOrder: 1,
              isActive: true,
            },
          ],
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getAllPromotionSlots(
    @Query() options: FindAllOptions,
  ): Promise<PromotionSlot[]> {
    return await this.promotionSlotService.findAll(options);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  @ApiOperation({
    summary: 'Obtener slot de promoción por ID',
    description:
      'Obtiene los detalles de un slot específico incluyendo sus opciones.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID del slot de promoción',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiResponse({
    status: 200,
    description: 'Slot de promoción encontrado',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174001',
        promotionId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Torta',
        description: 'Selecciona tu torta favorita',
        quantity: 1,
        displayOrder: 1,
        isOptional: false,
        isActive: true,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
        deletedAt: null,
        options: [
          {
            id: '123e4567-e89b-12d3-a456-426614174010',
            slotId: '123e4567-e89b-12d3-a456-426614174001',
            productId: '123e4567-e89b-12d3-a456-426614174100',
            isDefault: true,
            extraCost: 0,
            displayOrder: 1,
            isActive: true,
            product: {
              id: '123e4567-e89b-12d3-a456-426614174100',
              name: 'Torta de Chocolate',
              price: 5000,
            },
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Slot no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getPromotionSlotById(@Param('id') id: string): Promise<PromotionSlot> {
    return await this.promotionSlotService.findById(id);
  }

  @Get('promotion/:promotionId')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  @ApiOperation({
    summary: 'Obtener slots por ID de promoción',
    description:
      'Obtiene todos los slots asociados a una promoción específica.',
  })
  @ApiParam({
    name: 'promotionId',
    type: String,
    description: 'ID de la promoción',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Incluir slots inactivos',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de slots de la promoción',
    schema: {
      example: [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          promotionId: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Torta',
          description: 'Selecciona tu torta favorita',
          quantity: 1,
          displayOrder: 1,
          isOptional: false,
          isActive: true,
          options: [],
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          promotionId: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Bebida',
          description: 'Elige tu bebida',
          quantity: 1,
          displayOrder: 2,
          isOptional: true,
          isActive: true,
          options: [],
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
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
  @ApiOperation({
    summary: 'Actualizar un slot de promoción',
    description:
      'Actualiza los datos de un slot existente. Todos los campos son opcionales.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID del slot a actualizar',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiBody({
    type: UpdatePromotionSlotDto,
    description: 'Datos a actualizar del slot',
    examples: {
      example1: {
        summary: 'Actualizar nombre y descripción',
        value: {
          name: 'Torta Premium',
          description: 'Selecciona tu torta premium favorita',
        },
      },
      example2: {
        summary: 'Cambiar cantidad y orden',
        value: {
          quantity: 2,
          displayOrder: 3,
        },
      },
      example3: {
        summary: 'Desactivar slot',
        value: {
          isActive: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Slot actualizado exitosamente',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174001',
        promotionId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Torta Premium',
        description: 'Selecciona tu torta premium favorita',
        quantity: 1,
        displayOrder: 1,
        isOptional: false,
        isActive: true,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T11:45:00.000Z',
        deletedAt: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Slot no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async updatePromotionSlot(
    @Param('id') id: string,
    @Body() updateData: UpdatePromotionSlotDto,
  ): Promise<PromotionSlot> {
    return await this.promotionSlotService.update(id, updateData);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  @ApiOperation({
    summary: 'Eliminar un slot de promoción (soft delete)',
    description:
      'Elimina lógicamente un slot. No se elimina de la base de datos, solo se marca como eliminado.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID del slot a eliminar',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiResponse({
    status: 200,
    description: 'Slot eliminado exitosamente',
    schema: {
      example: {
        message: 'Slot de promoción eliminado exitosamente',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Slot no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async deletePromotionSlot(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return await this.promotionSlotService.delete(id);
  }

  @Patch(':id/restore')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  @ApiOperation({
    summary: 'Restaurar un slot de promoción eliminado',
    description:
      'Restaura un slot que fue eliminado previamente (soft delete).',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID del slot a restaurar',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiResponse({
    status: 200,
    description: 'Slot restaurado exitosamente',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174001',
        promotionId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Torta',
        description: 'Selecciona tu torta favorita',
        quantity: 1,
        displayOrder: 1,
        isOptional: false,
        isActive: true,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T12:00:00.000Z',
        deletedAt: null,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Slot no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async restorePromotionSlot(@Param('id') id: string): Promise<PromotionSlot> {
    return await this.promotionSlotService.restore(id);
  }

  // Crear opción en un slot
  @Post('option')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  @ApiOperation({
    summary: 'Crear una opción de producto en un slot',
    description:
      'Agrega un producto como opción disponible dentro de un slot. Por ejemplo, agregar "Torta de Chocolate" como opción del slot "Torta".',
  })
  @ApiBody({
    type: CreateSlotOptionDto,
    description: 'Datos de la opción a crear',
    examples: {
      example1: {
        summary: 'Opción sin costo extra (default)',
        value: {
          slotId: '123e4567-e89b-12d3-a456-426614174001',
          productId: '123e4567-e89b-12d3-a456-426614174100',
          isDefault: true,
          extraCost: 0,
          displayOrder: 1,
        },
      },
      example2: {
        summary: 'Opción premium con costo adicional',
        value: {
          slotId: '123e4567-e89b-12d3-a456-426614174001',
          productId: '123e4567-e89b-12d3-a456-426614174101',
          isDefault: false,
          extraCost: 500,
          displayOrder: 2,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Opción creada exitosamente',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174010',
        slotId: '123e4567-e89b-12d3-a456-426614174001',
        productId: '123e4567-e89b-12d3-a456-426614174100',
        isDefault: true,
        extraCost: 0,
        displayOrder: 1,
        isActive: true,
        product: {
          id: '123e4567-e89b-12d3-a456-426614174100',
          name: 'Torta de Chocolate',
          price: 5000,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Slot o producto no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async createSlotOption(@Body() createData: CreateSlotOptionDto) {
    return await this.promotionSlotService.createOption(createData);
  }

  // Actualizar opción
  @Patch('option/:optionId')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  @ApiOperation({
    summary: 'Actualizar una opción de slot',
    description:
      'Actualiza los datos de una opción existente. Todos los campos son opcionales.',
  })
  @ApiParam({
    name: 'optionId',
    type: String,
    description: 'ID de la opción a actualizar',
    example: '123e4567-e89b-12d3-a456-426614174010',
  })
  @ApiBody({
    type: UpdateSlotOptionDto,
    description: 'Datos a actualizar de la opción',
    examples: {
      example1: {
        summary: 'Cambiar costo extra',
        value: {
          extraCost: 1000,
        },
      },
      example2: {
        summary: 'Cambiar producto y orden',
        value: {
          productId: '123e4567-e89b-12d3-a456-426614174102',
          displayOrder: 3,
        },
      },
      example3: {
        summary: 'Marcar como default',
        value: {
          isDefault: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Opción actualizada exitosamente',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174010',
        slotId: '123e4567-e89b-12d3-a456-426614174001',
        productId: '123e4567-e89b-12d3-a456-426614174100',
        isDefault: true,
        extraCost: 1000,
        displayOrder: 1,
        isActive: true,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Opción no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async updateSlotOption(
    @Param('optionId') optionId: string,
    @Body() updateData: UpdateSlotOptionDto,
  ) {
    return await this.promotionSlotService.updateOption(optionId, updateData);
  }

  // Eliminar opción
  @Delete('option/:optionId')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  @ApiOperation({
    summary: 'Eliminar una opción de slot',
    description:
      'Elimina una opción de producto de un slot. Esta operación es permanente.',
  })
  @ApiParam({
    name: 'optionId',
    type: String,
    description: 'ID de la opción a eliminar',
    example: '123e4567-e89b-12d3-a456-426614174010',
  })
  @ApiResponse({
    status: 200,
    description: 'Opción eliminada exitosamente',
    schema: {
      example: {
        message: 'Opción eliminada exitosamente',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Opción no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async deleteSlotOption(@Param('optionId') optionId: string) {
    return await this.promotionSlotService.deleteOption(optionId);
  }

  // Reordenar opciones de un slot
  @Patch(':slotId/options/reorder')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  @ApiOperation({
    summary: 'Reordenar opciones de un slot',
    description:
      'Cambia el orden de visualización de las opciones en un slot. El array debe contener todos los IDs de opciones en el nuevo orden.',
  })
  @ApiParam({
    name: 'slotId',
    type: String,
    description: 'ID del slot',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiBody({
    description: 'Array con los IDs de las opciones en el nuevo orden',
    schema: {
      type: 'object',
      properties: {
        orderArray: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array de IDs de opciones en el orden deseado',
        },
      },
      required: ['orderArray'],
    },
    examples: {
      example1: {
        summary: 'Reordenar 3 opciones',
        value: {
          orderArray: [
            '123e4567-e89b-12d3-a456-426614174012',
            '123e4567-e89b-12d3-a456-426614174010',
            '123e4567-e89b-12d3-a456-426614174011',
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Opciones reordenadas exitosamente',
    schema: {
      example: {
        message: 'Opciones reordenadas exitosamente',
        slot: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Torta',
          options: [
            {
              id: '123e4567-e89b-12d3-a456-426614174012',
              displayOrder: 1,
            },
            {
              id: '123e4567-e89b-12d3-a456-426614174010',
              displayOrder: 2,
            },
            {
              id: '123e4567-e89b-12d3-a456-426614174011',
              displayOrder: 3,
            },
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Slot no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
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
  @ApiOperation({
    summary: 'Establecer opción por defecto',
    description:
      'Marca una opción como la selección por defecto en un slot. Automáticamente desmarca cualquier otra opción que estuviera como default.',
  })
  @ApiParam({
    name: 'slotId',
    type: String,
    description: 'ID del slot',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiParam({
    name: 'optionId',
    type: String,
    description: 'ID de la opción a marcar como default',
    example: '123e4567-e89b-12d3-a456-426614174010',
  })
  @ApiResponse({
    status: 200,
    description: 'Opción marcada como default exitosamente',
    schema: {
      example: {
        message: 'Opción marcada como default exitosamente',
        option: {
          id: '123e4567-e89b-12d3-a456-426614174010',
          slotId: '123e4567-e89b-12d3-a456-426614174001',
          productId: '123e4567-e89b-12d3-a456-426614174100',
          isDefault: true,
          extraCost: 0,
          displayOrder: 1,
          isActive: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'La opción no pertenece al slot especificado',
  })
  @ApiResponse({ status: 404, description: 'Slot u opción no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async setDefaultOption(
    @Param('slotId') slotId: string,
    @Param('optionId') optionId: string,
  ) {
    return await this.promotionSlotService.setDefaultOption(slotId, optionId);
  }
}
