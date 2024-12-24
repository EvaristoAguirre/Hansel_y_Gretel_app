import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './room.entity';
import { CreateRoomDto } from 'src/DTOs/create-room.dto';
import { UpdateRoomDto } from 'src/DTOs/update-room.dto';

@Injectable()
export class RoomRepository {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  async createRoom(room: CreateRoomDto): Promise<Room> {
    try {
      return await this.roomRepository.save(room);
    } catch (error) {
      throw new InternalServerErrorException('Error creating the room', error);
    }
  }

  async updateRoom(id: string, updateData: UpdateRoomDto): Promise<Room> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    try {
      const room = await this.roomRepository.findOne({
        where: { id, isActive: true },
      });
      if (!room) {
        throw new BadRequestException(`Room with ID: ${id} not found`);
      }
      Object.assign(room, updateData);
      return await this.roomRepository.save(room);
    } catch (error) {
      throw new InternalServerErrorException('Error updating the room', error);
    }
  }

  async deleteRoom(id: string): Promise<string> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    try {
      const result = await this.roomRepository.update(id, { isActive: false });
      if (result.affected === 0) {
        throw new BadRequestException(`Room with ID: ${id} not found`);
      }
      return 'Room successfully deleted';
    } catch (error) {
      throw new InternalServerErrorException('Error deleting the room', error);
    }
  }

  async getAllRooms(): Promise<Room[]> {
    try {
      return await this.roomRepository.find({
        where: { isActive: true },
        relations: ['tables'],
      });
    } catch (error) {
      throw new InternalServerErrorException('Error fetching rooms', error);
    }
  }

  async getRoomById(id: string): Promise<Room> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    try {
      const room = await this.roomRepository.findOne({
        where: { id, isActive: true },
      });
      if (!room) {
        throw new BadRequestException(`Room with ID: ${id} not found`);
      }
      return room;
    } catch (error) {
      throw new InternalServerErrorException('Error fetching the room', error);
    }
  }
}
