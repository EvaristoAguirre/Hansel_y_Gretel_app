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
import { RoomService } from './room.service';
import { CreateRoomDto } from 'src/DTOs/create-room.dto';
import { Room } from './room.entity';
import { UpdateRoomDto } from 'src/DTOs/update-room.dto';
import { RolesGuard } from 'src/Guards/roles.guard';
import { UserRole } from 'src/Enums/roles.enum';
import { Roles } from 'src/Decorators/roles.decorator';

@Controller('room')
@UseGuards(RolesGuard)
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  createRoom(@Body() room: CreateRoomDto): Promise<Room> {
    return this.roomService.createRoom(room);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  updateRoom(
    @Param('id') id: string,
    @Body() updateData: UpdateRoomDto,
  ): Promise<Room> {
    return this.roomService.updateRoom(id, updateData);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  deleteRoom(@Param('id') id: string): Promise<string> {
    return this.roomService.deleteRoom(id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  getAllRooms(): Promise<Room[]> {
    return this.roomService.getAllRooms();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  getRoomById(@Param('id') id: string): Promise<Room> {
    return this.roomService.getRoomById(id);
  }
}
