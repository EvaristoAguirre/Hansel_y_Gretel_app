import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto } from 'src/DTOs/create-room.dto';
import { Room } from './room.entity';
import { UpdateRoomDto } from 'src/DTOs/update-room.dto';

@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  createRoom(@Body() room: CreateRoomDto): Promise<Room> {
    return this.roomService.createRoom(room);
  }

  @Patch(':id')
  updateRoom(
    @Param('id') id: string,
    @Body() updateData: UpdateRoomDto,
  ): Promise<Room> {
    return this.roomService.updateRoom(id, updateData);
  }

  @Delete(':id')
  deleteRoom(@Param('id') id: string): Promise<string> {
    return this.roomService.deleteRoom(id);
  }

  @Get()
  getAllRooms(): Promise<Room[]> {
    return this.roomService.getAllRooms();
  }

  @Get(':id')
  getRoomById(@Param('id') id: string): Promise<Room> {
    return this.roomService.getRoomById(id);
  }
}
