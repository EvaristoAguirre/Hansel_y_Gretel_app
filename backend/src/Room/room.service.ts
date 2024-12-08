import { Injectable } from '@nestjs/common';
import { RoomRepository } from './room.repository';
import { CreateRoomDto } from 'src/DTOs/create-room.dto';
import { Room } from './room.entity';
import { UpdateRoomDto } from 'src/DTOs/update-room.dto';

@Injectable()
export class RoomService {
  constructor(private readonly roomRepository: RoomRepository) {}

  async createRoom(room: CreateRoomDto): Promise<Room> {
    return this.roomRepository.createRoom(room);
  }

  async updateRoom(id: string, updateData: UpdateRoomDto): Promise<Room> {
    return this.roomRepository.updateRoom(id, updateData);
  }

  async deleteRoom(id: string): Promise<string> {
    return this.roomRepository.deleteRoom(id);
  }

  async getAllRooms(): Promise<Room[]> {
    return this.roomRepository.getAllRooms();
  }

  async getRoomById(id: string): Promise<Room> {
    return this.roomRepository.getRoomById(id);
  }
}
