import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RoomService } from './room.service';
import { CreateRoomDto } from 'src/DTOs/create-room.dto';
import { Room } from './room.entity';
import { UpdateRoomDto } from 'src/DTOs/update-room.dto';
import { RolesGuard } from 'src/Guards/roles.guard';
import { UserRole } from 'src/Enums/roles.enum';
import { Roles } from 'src/Decorators/roles.decorator';

@ApiTags('Salón')
@ApiBearerAuth('JWT-auth')
@Controller('room')
@UseGuards(RolesGuard)
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear nuevo salón',
    description:
      'Crea un nuevo salón/área del local. Requiere rol ADMIN o ENCARGADO.',
  })
  @ApiBody({
    type: CreateRoomDto,
    description: 'Datos del salón',
    examples: {
      ejemplo: {
        value: {
          name: 'Salón Principal',
          description: 'Área principal del local',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Salón creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un salón con ese nombre',
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  createRoom(@Body() room: CreateRoomDto): Promise<Room> {
    return this.roomService.createRoom(room);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar salón',
    description:
      'Actualiza los datos de un salón existente. Requiere rol ADMIN o ENCARGADO.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID del salón a actualizar',
  })
  @ApiBody({ type: UpdateRoomDto, description: 'Datos a actualizar' })
  @ApiResponse({ status: 200, description: 'Salón actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Salón no encontrado' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  updateRoom(
    @Param('id') id: string,
    @Body() updateData: UpdateRoomDto,
  ): Promise<Room> {
    return this.roomService.updateRoom(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar salón',
    description:
      'Elimina un salón del sistema. Requiere rol ADMIN o ENCARGADO.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID del salón a eliminar',
  })
  @ApiResponse({ status: 200, description: 'Salón eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Salón no encontrado' })
  @ApiResponse({
    status: 400,
    description: 'No se puede eliminar un salón con mesas activas',
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  deleteRoom(@Param('id') id: string): Promise<string> {
    return this.roomService.deleteRoom(id);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los salones',
    description: 'Devuelve una lista de todos los salones del local',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de salones obtenida exitosamente',
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  getAllRooms(): Promise<Room[]> {
    return this.roomService.getAllRooms();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener salón por ID',
    description: 'Devuelve un salón específico por su UUID',
  })
  @ApiParam({ name: 'id', type: String, description: 'UUID del salón' })
  @ApiResponse({ status: 200, description: 'Salón encontrado' })
  @ApiResponse({ status: 404, description: 'Salón no encontrado' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  getRoomById(@Param('id') id: string): Promise<Room> {
    return this.roomService.getRoomById(id);
  }
}
