import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ToppingsGroupsService } from './toppings-group.service';
import { Roles } from 'src/Decorators/roles.decorator';
import { UserRole } from 'src/Enums/roles.enum';
import { ToppingsGroup } from './toppings-group.entity';
import { CreateToppingsGroupDto } from 'src/DTOs/create-toppings-group.dto';
import { UpdateToppingsGroupDto } from 'src/DTOs/update-toppings-group.dto';

@ApiTags('Grupos de Toppings')
@ApiBearerAuth('JWT-auth')
@Controller('toppings-group')
export class ToppingsGroupsController {
  constructor(private readonly toppingsGroupsService: ToppingsGroupsService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear grupo de toppings',
    description:
      'Crea un nuevo grupo de toppings (ej: Tipos de Leche, Extras dulces). Requiere rol ADMIN o ENCARGADO.',
  })
  @ApiBody({
    type: CreateToppingsGroupDto,
    description: 'Datos del grupo de toppings',
    examples: {
      ejemplo: {
        value: {
          name: 'Tipos de Leche',
          description: 'Opciones de leche para bebidas',
          toppings: [
            'uuid-leche-entera',
            'uuid-leche-descremada',
            'uuid-leche-almendra',
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Grupo creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  createToppingsGroup(
    @Body() createData: CreateToppingsGroupDto,
  ): Promise<ToppingsGroup> {
    return this.toppingsGroupsService.createToppingsGroup(createData);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar grupo de toppings',
    description:
      'Actualiza los datos de un grupo de toppings existente. Requiere rol ADMIN o ENCARGADO.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID del grupo a actualizar',
  })
  @ApiBody({ type: UpdateToppingsGroupDto, description: 'Datos a actualizar' })
  @ApiResponse({ status: 200, description: 'Grupo actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Grupo no encontrado' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  updateToppingsGroup(
    @Param('id') id: string,
    @Body() updateData: UpdateToppingsGroupDto,
  ): Promise<ToppingsGroup> {
    return this.toppingsGroupsService.updateToppingsGroup(id, updateData);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los grupos de toppings',
    description:
      'Devuelve todos los grupos de toppings con sus toppings asociados',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de grupos obtenida exitosamente',
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  getAllToppingsGroups(): Promise<ToppingsGroup[]> {
    return this.toppingsGroupsService.getAllToppingsGroups();
  }

  @Get('without-toppings')
  @ApiOperation({
    summary: 'Obtener grupos sin detalle de toppings',
    description:
      'Devuelve solo la información básica de los grupos (sin los toppings incluidos)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de grupos obtenida exitosamente',
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  getAllToppingsGroupsWithoutToppings(): Promise<ToppingsGroup[]> {
    return this.toppingsGroupsService.getAllToppingsGroupsWithoutToppings();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener grupo por ID',
    description: 'Devuelve un grupo de toppings específico con sus toppings',
  })
  @ApiParam({ name: 'id', type: String, description: 'UUID del grupo' })
  @ApiResponse({ status: 200, description: 'Grupo encontrado' })
  @ApiResponse({ status: 404, description: 'Grupo no encontrado' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  getToppingsGroupById(@Param('id') id: string): Promise<ToppingsGroup> {
    return this.toppingsGroupsService.getToppingsGroupById(id);
  }

  @Get('by-name/:name')
  @ApiOperation({
    summary: 'Buscar grupo por nombre',
    description: 'Busca un grupo de toppings por su nombre',
  })
  @ApiParam({
    name: 'name',
    type: String,
    description: 'Nombre del grupo',
    example: 'Tipos de Leche',
  })
  @ApiResponse({ status: 200, description: 'Grupo encontrado' })
  @ApiResponse({ status: 404, description: 'Grupo no encontrado' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async getToppingsGroupByName(
    @Param('name') name: string,
  ): Promise<ToppingsGroup> {
    return this.toppingsGroupsService.getToppingsGroupByName(name);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar grupo de toppings',
    description:
      'Elimina un grupo de toppings del sistema. Requiere rol ADMIN o ENCARGADO.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID del grupo a eliminar',
  })
  @ApiResponse({ status: 200, description: 'Grupo eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Grupo no encontrado' })
  @ApiResponse({
    status: 400,
    description: 'No se puede eliminar un grupo en uso',
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  deleteToppingsGroup(@Param('id') id: string): Promise<string> {
    return this.toppingsGroupsService.deleteToppingsGroup(id);
  }
}
