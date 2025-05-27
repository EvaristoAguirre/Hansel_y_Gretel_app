import { SauceGroup } from './sauce-group.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreateSauceGroupDto } from 'src/DTOs/create-sauce-group.dto';
import { UpdateSauceGroupDto } from 'src/DTOs/update-sauce-group.dto';

@Injectable()
export class SauceGroupRepository {
  constructor(
    @InjectRepository(SauceGroup)
    private readonly sauceGroupRepository: Repository<SauceGroup>,
  ) {}

  async createSauceGroup(
    createSauceGroupDto: CreateSauceGroupDto,
  ): Promise<SauceGroup> {
    try {
      return await this.sauceGroupRepository.save(createSauceGroupDto);
    } catch (error) {
      throw new InternalServerErrorException(
        'Error creating sauce group',
        error,
      );
    }
  }

  async updateSauceGroup(
    id: string,
    updateSauceGroupDto: UpdateSauceGroupDto,
  ): Promise<SauceGroup> {
    try {
      const sauceGroup = await this.getSauceGroupById(id);
      if (!sauceGroup) {
        throw new NotFoundException(`Sauce group with ID ${id} not found`);
      }
      Object.assign(sauceGroup, updateSauceGroupDto);
      return await this.sauceGroupRepository.save(sauceGroup);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error updating sauce group');
    }
  }

  async getSauceGroupById(id: string): Promise<SauceGroup | null> {
    return await this.sauceGroupRepository.findOne({
      where: { id, isActive: true },
    });
  }

  async getAllSauceGroups(
    page: number = 1,
    limit: number = 1000,
  ): Promise<SauceGroup[]> {
    const skip = (page - 1) * limit;
    return await this.sauceGroupRepository.find({
      where: { isActive: true },
      skip,
      take: limit,
    });
  }

  async deleteSauceGroup(id: string): Promise<string> {
    const sauceGroup = await this.getSauceGroupById(id);
    if (!sauceGroup) {
      throw new NotFoundException(`Sauce group with ID ${id} not found`);
    }
    sauceGroup.isActive = false;
    await this.sauceGroupRepository.save(sauceGroup);
    return `Sauce group with ID ${id} has been deleted`;
  }
}
