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
import { PromotionSlotAssignmentService } from '../services/promotion-slot-assignment.service';
import { UserRole } from 'src/Enums/roles.enum';
import { CreatePromotionSlotDto } from '../dtos/create-promotion-slot.dto';
import { PromotionSlot } from '../entities/promotion-slot.entity';
import { Roles } from 'src/Decorators/roles.decorator';
import { UpdatePromotionSlotDto } from '../dtos/update-promotion-slot.dto';
import { CreateSlotOptionDto } from '../dtos/create-slot-option.dto';
import { UpdateSlotOptionDto } from '../dtos/update-slot-option.dto';
import { CreatePromotionSlotAssignmentDto } from '../dtos/create-promotion-slot-assignment.dto';
import { UpdatePromotionSlotAssignmentDto } from '../dtos/update-promotion-slot-assignment.dto';
import { PromotionSlotAssignment } from '../entities/promotion-slot-assignment.entity';

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
  constructor(
    private readonly promotionSlotService: PromotionSlotService,
    private readonly assignmentService: PromotionSlotAssignmentService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  @ApiOperation({
    summary: 'Crear un nuevo slot de promoción',
    description:
      'Crea un slot (espacio) reutilizable donde los clientes podrán elegir productos. El slot puede crearse sin promoción y asignarse después. Por ejemplo: "Torta", "Bebida", "Acompañamiento".',
  })
  @ApiBody({
    type: CreatePromotionSlotDto,
    description: 'Datos para crear el slot de promoción',
    examples: {
      example1: {
        summary: 'Slot de tortas (sin promoción)',
        value: {
          name: 'Porción de Torta',
          description: 'Selecciona tu torta favorita',
        },
      },
      example2: {
        summary: 'Slot de bebidas (sin promoción)',
        value: {
          name: 'Bebida caliente',
          description: 'Elige una bebida caliente',
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
        name: 'Porción de Torta',
        description: 'Selecciona tu torta favorita',
        isActive: true,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
        deletedAt: null,
        options: [],
        assignments: [],
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

  // ==================== ENDPOINTS PARA ASIGNACIONES ====================

  @Post('assignment/:promotionId')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  @ApiOperation({
    summary: 'Asignar un slot a una promoción',
    description:
      'Asigna un slot existente a una promoción con cantidad e indicador de opcionalidad específicos.',
  })
  @ApiParam({
    name: 'promotionId',
    type: String,
    description: 'ID de la promoción',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: CreatePromotionSlotAssignmentDto,
    description: 'Datos para asignar el slot a la promoción',
    examples: {
      example1: {
        summary: 'Asignar slot con cantidad 1',
        value: {
          slotId: '123e4567-e89b-12d3-a456-426614174001',
          quantity: 1,
          isOptional: false,
        },
      },
      example2: {
        summary: 'Asignar slot con cantidad 2',
        value: {
          slotId: '123e4567-e89b-12d3-a456-426614174001',
          quantity: 2,
          isOptional: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Slot asignado a la promoción exitosamente',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174010',
        promotionId: '123e4567-e89b-12d3-a456-426614174000',
        slotId: '123e4567-e89b-12d3-a456-426614174001',
        quantity: 2,
        isOptional: false,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Promoción o slot no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async createAssignment(
    @Param('promotionId') promotionId: string,
    @Body() createData: CreatePromotionSlotAssignmentDto,
  ): Promise<PromotionSlotAssignment> {
    return await this.assignmentService.create(promotionId, createData);
  }

  @Get('assignment/promotion/:promotionId')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  @ApiOperation({
    summary: 'Obtener asignaciones de slots por promoción',
    description:
      'Obtiene todas las asignaciones de slots asociadas a una promoción específica.',
  })
  @ApiParam({
    name: 'promotionId',
    type: String,
    description: 'ID de la promoción',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de asignaciones de slots de la promoción',
    schema: {
      example: [
        {
          id: '123e4567-e89b-12d3-a456-426614174010',
          promotionId: '123e4567-e89b-12d3-a456-426614174000',
          slotId: '123e4567-e89b-12d3-a456-426614174001',
          quantity: 2,
          isOptional: false,
          slot: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Porción de Torta',
            description: 'Selecciona tu torta favorita',
            options: [],
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getAssignmentsByPromotion(
    @Param('promotionId') promotionId: string,
  ): Promise<PromotionSlotAssignment[]> {
    return await this.assignmentService.findByPromotionId(promotionId);
  }

  @Get('assignment/slot/:slotId')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  @ApiOperation({
    summary: 'Obtener asignaciones de un slot',
    description:
      'Obtiene todas las promociones a las que está asignado un slot específico.',
  })
  @ApiParam({
    name: 'slotId',
    type: String,
    description: 'ID del slot',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de asignaciones del slot',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getAssignmentsBySlot(
    @Param('slotId') slotId: string,
  ): Promise<PromotionSlotAssignment[]> {
    return await this.assignmentService.findBySlotId(slotId);
  }

  @Patch('assignment/:id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  @ApiOperation({
    summary: 'Actualizar una asignación de slot',
    description:
      'Actualiza la cantidad o el indicador de opcionalidad de una asignación existente.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID de la asignación a actualizar',
    example: '123e4567-e89b-12d3-a456-426614174010',
  })
  @ApiBody({
    type: UpdatePromotionSlotAssignmentDto,
    description: 'Datos a actualizar de la asignación',
    examples: {
      example1: {
        summary: 'Cambiar cantidad',
        value: {
          quantity: 3,
        },
      },
      example2: {
        summary: 'Cambiar a opcional',
        value: {
          isOptional: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Asignación actualizada exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Asignación no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async updateAssignment(
    @Param('id') id: string,
    @Body() updateData: UpdatePromotionSlotAssignmentDto,
  ): Promise<PromotionSlotAssignment> {
    return await this.assignmentService.update(id, updateData);
  }

  @Delete('assignment/:id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  @ApiOperation({
    summary: 'Eliminar una asignación de slot',
    description:
      'Elimina la asignación de un slot a una promoción. El slot y la promoción no se eliminan.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID de la asignación a eliminar',
    example: '123e4567-e89b-12d3-a456-426614174010',
  })
  @ApiResponse({
    status: 200,
    description: 'Asignación eliminada exitosamente',
    schema: {
      example: {
        message:
          'Slot assignment with ID 123e4567-e89b-12d3-a456-426614174010 deleted successfully.',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Asignación no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async deleteAssignment(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return await this.assignmentService.delete(id);
  }
}
