import { Injectable } from '@nestjs/common';
import { SauceGroupRepository } from './sauce-group.repository';
import { CreateSauceGroupDto } from 'src/DTOs/create-sauce-group.dto';
import { SauceGroup } from './sauce-group.entity';

@Injectable()
export class SauceGroupsService {
  constructor(private readonly sauceGroupRepository: SauceGroupRepository) {}

  async createSauceGroup(createData: CreateSauceGroupDto): Promise<SauceGroup> {
    return this.sauceGroupRepository.createSauceGroup(createData);
  }

  async updateSauceGroup(
    id: string,
    updateData: Partial<CreateSauceGroupDto>,
  ): Promise<SauceGroup> {
    return this.sauceGroupRepository.updateSauceGroup(id, updateData);
  }
  async getSauceGroupById(id: string): Promise<SauceGroup> {
    return this.sauceGroupRepository.getSauceGroupById(id);
  }
  async getAllSauceGroups(): Promise<SauceGroup[]> {
    return this.sauceGroupRepository.getAllSauceGroups();
  }
  async deleteSauceGroup(id: string): Promise<string> {
    return this.sauceGroupRepository.deleteSauceGroup(id);
  }
}
