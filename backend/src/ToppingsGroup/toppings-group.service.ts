import { Injectable } from '@nestjs/common';
import { ToppingsGroupRepository } from './toppings-group.repository';
import { ToppingsGroup } from './toppings-group.entity';
import { CreateToppingsGroupDto } from 'src/DTOs/create-sauce-group.dto';
import EventEmitter2 from 'eventemitter2';

@Injectable()
export class ToppingsGroupsService {
  constructor(
    private readonly toppingsGroupRepository: ToppingsGroupRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createToppingsGroup(
    createData: CreateToppingsGroupDto,
  ): Promise<ToppingsGroup> {
    const toppingsGroupCreated =
      await this.toppingsGroupRepository.createToppingsGroup(createData);
    await this.eventEmitter.emit('toppingsGroup.created', {
      toppingsGroup: toppingsGroupCreated,
    });
    return toppingsGroupCreated;
  }

  async updateToppingsGroup(
    id: string,
    updateData: Partial<CreateToppingsGroupDto>,
  ): Promise<ToppingsGroup> {
    const toppingsGroupUpdated =
      await this.toppingsGroupRepository.updateToppingsGroup(id, updateData);
    await this.eventEmitter.emit('toppingsGroup.updated', {
      toppingsGroup: toppingsGroupUpdated,
    });
    return toppingsGroupUpdated;
  }

  async getToppingsGroupById(id: string): Promise<ToppingsGroup> {
    return this.toppingsGroupRepository.getToppingsGroupById(id);
  }
  async getAllToppingsGroups(): Promise<ToppingsGroup[]> {
    return this.toppingsGroupRepository.getAllToppingsGroups();
  }
  async deleteToppingsGroup(id: string): Promise<string> {
    const toppingsGroupDeleted =
      await this.toppingsGroupRepository.deleteToppingsGroup(id);
    await this.eventEmitter.emit('toppingsGroup.deleted', {
      toppingsGroup: toppingsGroupDeleted,
    });
    return toppingsGroupDeleted;
  }
}
