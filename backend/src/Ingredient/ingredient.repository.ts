import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Ingredient } from './ingredient.entity';
import { Repository } from 'typeorm';
import { CreateIngredientDto } from 'src/DTOs/create-ingredient.dto';
import { UpdateIngredientDto } from 'src/DTOs/update-ingredient.dto';

@Injectable()
export class IngredientRepository {
  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
  ) {}

  async getAllIngredients(page: number, limit: number): Promise<Ingredient[]> {
    if (page <= 0 || limit <= 0) {
      throw new BadRequestException(
        'Page and limit must be positive integers.',
      );
    }
    try {
      return await this.ingredientRepository.find({
        where: { isActive: true },
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        'Error fetching orders',
        error.message,
      );
    }
  }

  async createIngredient(createData: CreateIngredientDto): Promise<Ingredient> {
    const { name } = createData;
    if (!name) {
      throw new BadRequestException('Name must be provided');
    }
    const existingIngredient = await this.ingredientRepository.findOne({
      where: { name: name },
    });
    if (existingIngredient) {
      throw new ConflictException('Ingredient name already exist');
    }
    try {
      return await this.ingredientRepository.save(createData);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while creating the order. Please try again later.',
      );
    }
  }

  async updateIngredient(id: string, updateData: UpdateIngredientDto) {
    if (!id) {
      throw new BadRequestException('ID must be provided');
    }
    try {
      const ingredient = await this.ingredientRepository.findOne({
        where: { id: id, isActive: true },
      });
      if (!ingredient) {
        throw new NotFoundException('Ingredient not found');
      }
      Object.assign(ingredient, updateData);
      return await this.ingredientRepository.save(ingredient);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error updating the ingredient',
        error.message,
      );
    }
  }

  async deleteIngredient(id: string) {
    if (!id) {
      throw new BadRequestException('ID must be provided');
    }
    try {
      const ingredient = await this.ingredientRepository.findOne({
        where: { id: id, isActive: true },
      });
      if (!ingredient) {
        throw new NotFoundException('Ingredient not found');
      }
      ingredient.isActive = false;
      return await this.ingredientRepository.save(ingredient);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error deleting the ingredient',
        error.message,
      );
    }
  }
}
