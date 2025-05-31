import { Injectable } from '@nestjs/common';
import { ToppingsGroupRepository } from './toppings-group.repository';
import { ToppingsGroup } from './toppings-group.entity';
import { CreateToppingsGroupDto } from 'src/DTOs/create-sauce-group.dto';

@Injectable()
export class ToppingsGroupsService {
  constructor(
    private readonly toppingsGroupRepository: ToppingsGroupRepository,
  ) {}

  async createToppingsGroup(
    createData: CreateToppingsGroupDto,
  ): Promise<ToppingsGroup> {
    return this.toppingsGroupRepository.createToppingsGroup(createData);
  }

  async updateToppingsGroup(
    id: string,
    updateData: Partial<CreateToppingsGroupDto>,
  ): Promise<ToppingsGroup> {
    return this.toppingsGroupRepository.updateToppingsGroup(id, updateData);
  }
  async getToppingsGroupById(id: string): Promise<ToppingsGroup> {
    return this.toppingsGroupRepository.getToppingsGroupById(id);
  }
  async getAllToppingsGroups(): Promise<ToppingsGroup[]> {
    return this.toppingsGroupRepository.getAllToppingsGroups();
  }
  async deleteToppingsGroup(id: string): Promise<string> {
    return this.toppingsGroupRepository.deleteToppingsGroup(id);
  }
}
