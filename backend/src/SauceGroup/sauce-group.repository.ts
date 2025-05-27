import { SauceGroup } from './sauce-group.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreateSauceGroupDto } from 'src/DTOs/create-sauce-group.dto';
import { UpdateSauceGroupDto } from 'src/DTOs/update-sauce-group.dto';
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { IngredientService } from 'src/Ingredient/ingredient.service';

@Injectable()
export class SauceGroupRepository {
  constructor(
    @InjectRepository(SauceGroup)
    private readonly sauceGroupRepository: Repository<SauceGroup>,
    private readonly ingredientService: IngredientService,
  ) {}

  async createSauceGroup(
    createSauceGroupDto: CreateSauceGroupDto,
  ): Promise<SauceGroup> {
    const { name, sauces } = createSauceGroupDto;
    const existingGroup = await this.sauceGroupRepository.findOne({
      where: { name: createSauceGroupDto.name, isActive: true },
    });
    if (existingGroup) {
      throw new ConflictException(
        `Sauce group with name "${createSauceGroupDto.name}" already exists`,
      );
    }
    if (!name) {
      throw new BadRequestException('Name is required for sauce group');
    }
    if (!sauces || sauces.length === 0) {
      throw new BadRequestException(
        'At least one sauce is required for the group',
      );
    }
    try {
      const sauceGroup = new SauceGroup();
      sauceGroup.name = name;
      for (const sauce of sauces) {
        const existingSauce = await this.ingredientRepository.findOne({
          where: { id: sauce, isActive: true },
        });
      }
      return await this.sauceGroupRepository.save(sauceGroup);
    } catch (error) {
      if (error instanceof HttpException) throw error;
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
