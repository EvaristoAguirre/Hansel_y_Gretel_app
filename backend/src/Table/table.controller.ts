import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
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
import { TableService } from './table.service';
import { CreateTableDto } from 'src/DTOs/create-table.dto';
import { Table } from './table.entity';
import { UpdateTableDto } from 'src/DTOs/update-table.dto';
import { Roles } from 'src/Decorators/roles.decorator';
import { UserRole } from 'src/Enums/roles.enum';
import { RolesGuard } from 'src/Guards/roles.guard';

@ApiTags('Mesa')
@ApiBearerAuth('JWT-auth')
@Controller('tables')
@UseGuards(RolesGuard)
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear nueva mesa',
    description:
      'Crea una nueva mesa en el sistema, asociada a un salón. Requiere rol ADMIN o ENCARGADO.',
  })
  @ApiBody({
    type: CreateTableDto,
    description: 'Datos de la mesa',
    examples: {
      ejemplo: {
        value: {
          name: 'Mesa 1',
          roomId: 'uuid-del-salon',
          capacity: 4,
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Mesa creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una mesa con ese nombre',
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  createTable(@Body() table: CreateTableDto): Promise<Table> {
    return this.tableService.createTable(table);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar mesa',
    description:
      'Actualiza los datos de una mesa (nombre, estado, salón, etc.)',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID de la mesa a actualizar',
  })
  @ApiBody({ type: UpdateTableDto, description: 'Datos a actualizar' })
  @ApiResponse({ status: 200, description: 'Mesa actualizada exitosamente' })
  @ApiResponse({ status: 404, description: 'Mesa no encontrada' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  updateTable(
    @Param('id') id: string,
    @Body() updateData: UpdateTableDto,
  ): Promise<Table> {
    return this.tableService.updateTable(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar mesa',
    description:
      'Elimina una mesa del sistema. Requiere rol ADMIN o ENCARGADO.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID de la mesa a eliminar',
  })
  @ApiResponse({ status: 200, description: 'Mesa eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Mesa no encontrada' })
  @ApiResponse({
    status: 400,
    description: 'No se puede eliminar una mesa con pedido activo',
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  deleteTable(@Param('id') id: string): Promise<string> {
    return this.tableService.deleteTable(id);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todas las mesas',
    description: 'Devuelve una lista paginada de todas las mesas del sistema',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad por página',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de mesas obtenida exitosamente',
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  getAllTables(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ): Promise<Table[]> {
    return this.tableService.getAllTables(page, limit);
  }

  @Get('available')
  @ApiOperation({
    summary: 'Obtener mesas disponibles',
    description:
      'Devuelve solo las mesas que están disponibles (sin pedido activo)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad por página',
  })
  @ApiResponse({ status: 200, description: 'Lista de mesas disponibles' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  getAllTablesAvailable(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe)
    limit: number = 100,
  ): Promise<Table[]> {
    return this.tableService.getAllTablesAvailable(page, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener mesa por ID',
    description: 'Devuelve una mesa específica por su UUID',
  })
  @ApiParam({ name: 'id', type: String, description: 'UUID de la mesa' })
  @ApiResponse({ status: 200, description: 'Mesa encontrada' })
  @ApiResponse({ status: 404, description: 'Mesa no encontrada' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  getTableById(@Param('id') id: string): Promise<Table> {
    return this.tableService.getTableById(id);
  }

  @Get('by-name/:name')
  @ApiOperation({
    summary: 'Buscar mesa por nombre',
    description: 'Busca una mesa específica por su nombre',
  })
  @ApiParam({
    name: 'name',
    type: String,
    description: 'Nombre de la mesa',
    example: 'Mesa 1',
  })
  @ApiResponse({ status: 200, description: 'Mesa encontrada' })
  @ApiResponse({ status: 404, description: 'Mesa no encontrada' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async getTableByName(@Param('name') name: string): Promise<Table> {
    return this.tableService.getTableByName(name);
  }

  @Get('by-room/:id')
  @ApiOperation({
    summary: 'Obtener mesas por salón',
    description: 'Devuelve todas las mesas de un salón específico',
  })
  @ApiParam({ name: 'id', type: String, description: 'UUID del salón' })
  @ApiResponse({ status: 200, description: 'Lista de mesas del salón' })
  @ApiResponse({ status: 404, description: 'Salón no encontrado' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async getTablesByRoom(@Param('id') roomId: string): Promise<Table[]> {
    return this.tableService.getTablesByRoom(roomId);
  }
}
