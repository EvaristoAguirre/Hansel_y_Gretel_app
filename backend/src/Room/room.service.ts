import { Injectable } from '@nestjs/common';
import { RoomRepository } from './room.repository';

@Injectable()
export class RoomService {
  constructor(private readonly roomRepository: RoomRepository) {}
}
