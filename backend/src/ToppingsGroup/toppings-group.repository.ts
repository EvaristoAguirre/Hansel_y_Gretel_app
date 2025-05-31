import { ToppingsGroup } from './toppings-group.entity';
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
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { IngredientService } from 'src/Ingredient/ingredient.service';
import { CreateToppingsGroupDto } from 'src/DTOs/create-sauce-group.dto';
import { UpdateToppingsGroupDto } from 'src/DTOs/update-sauce-group.dto';

@Injectable()
export class ToppingsGroupRepository {
  constructor(
    @InjectRepository(ToppingsGroup)
    private readonly toppingsGroupRepository: Repository<ToppingsGroup>,
    private readonly ingredientService: IngredientService,
  ) {}

  async createToppingsGroup(
    createToppingsGroupDto: CreateToppingsGroupDto,
  ): Promise<ToppingsGroup> {
    const { name, toppings } = createToppingsGroupDto;
    const existingGroup = await this.toppingsGroupRepository.findOne({
      where: { name: createToppingsGroupDto.name, isActive: true },
    });
    if (existingGroup) {
      throw new ConflictException(
        `Toppings group with name "${createToppingsGroupDto.name}" already exists`,
      );
    }
    if (!name) {
      throw new BadRequestException('Name is required for toppings group');
    }
    if (!toppings || toppings.length === 0) {
      throw new BadRequestException(
        'At least one topping is required for the group',
      );
    }
    try {
      const sauceGroup = new ToppingsGroup();
      sauceGroup.name = name;
      for (const topping of toppings) {
        const existingTopping = await this.ingredientService.findOne({
          where: { id: topping, isActive: true },
        });
      }
      return await this.toppingsGroupRepository.save(sauceGroup);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error creating sauce group',
        error,
      );
    }
  }

  async updateToppingsGroup(
    id: string,
    updateToppingsGroupDto: UpdateToppingsGroupDto,
  ): Promise<ToppingsGroup> {
    if (!id) {
      throw new BadRequestException('ID is required to update toppings group');
    }
    if (
      !updateToppingsGroupDto ||
      Object.keys(updateToppingsGroupDto).length === 0
    ) {
      throw new BadRequestException('Update data is required');
    }
    try {
      const toppingsGroup = await this.getToppingsGroupById(id);
      if (!toppingsGroup) {
        throw new NotFoundException(`toppings group with ID ${id} not found`);
      }
      Object.assign(toppingsGroup, updateToppingsGroupDto);
      return await this.toppingsGroupRepository.save(toppingsGroup);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error updating toppings group');
    }
  }

  async getToppingsGroupById(id: string): Promise<ToppingsGroup | null> {
    if (!id) {
      throw new BadRequestException('ID is required to fetch toppings group');
    }
    try {
      const toppingsGroup = await this.toppingsGroupRepository.findOne({
        where: { id, isActive: true },
      });
      if (!toppingsGroup) {
        throw new NotFoundException(`toppings group with ID ${id} not found`);
      }
      return toppingsGroup;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Error fetching toppings group');
    }
  }

  async getAllToppingsGroups(
    page: number = 1,
    limit: number = 100,
  ): Promise<ToppingsGroup[]> {
    if (page < 1 || limit < 1) {
      throw new BadRequestException('Page and limit must be greater than 0');
    }
    try {
      return await this.toppingsGroupRepository.find({
        where: { isActive: true },
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Error fetching toppings groups');
    }
  }

  async deleteToppingsGroup(id: string): Promise<string> {
    if (!id) {
      throw new BadRequestException('ID is required to delete toppings group');
    }
    try {
      const toppingsGroup = await this.getToppingsGroupById(id);
      if (!toppingsGroup) {
        throw new NotFoundException(`toppings group with ID ${id} not found`);
      }
      toppingsGroup.isActive = false;
      await this.toppingsGroupRepository.save(toppingsGroup);
      return `toppings group with ID ${id} has been deleted`;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Error deleting toppings group');
    }
  }
}
