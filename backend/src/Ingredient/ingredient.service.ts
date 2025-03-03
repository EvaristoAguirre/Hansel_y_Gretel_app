import { Injectable } from '@nestjs/common';
import { IngredientRepository } from './ingredient.repository';
import { Ingredient } from './ingredient.entity';
import { CreateIngredientDto } from 'src/DTOs/create-ingredient.dto';
import { UpdateIngredientDto } from 'src/DTOs/update-ingredient.dto';
import { CreateUnitOfMeasureDto } from 'src/DTOs/create-unit.dto';
import { UnitOfMeasure } from './unitOfMesure.entity';

@Injectable()
export class IngredientService {
  constructor(private readonly ingredientRepository: IngredientRepository) {}

  async getAllIngredients(page: number, limit: number): Promise<Ingredient[]> {
    return this.ingredientRepository.getAllIngredients(page, limit);
  }

  async getIngredientById(id: string): Promise<Ingredient> {
    return await this.ingredientRepository.getIngredientById(id);
  }

  async createIngredient(createData: CreateIngredientDto): Promise<Ingredient> {
    return this.ingredientRepository.createIngredient(createData);
  }

  async updateIngredient(id: string, updateData: UpdateIngredientDto) {
    return this.ingredientRepository.updateIngredient(id, updateData);
  }

  async deleteIngredient(id: string) {
    return await this.ingredientRepository.deleteIngredient(id);
  }

  // ---------------- Unit Of Mesure ---------- //
  async createUnitOfMeasure(
    createData: CreateUnitOfMeasureDto,
  ): Promise<UnitOfMeasure> {
    return await this.ingredientRepository.createUnitOfMeasure(createData);
  }

  async getAllUnitOfMeasure(
    pageNumber: number,
    limitNumber: number,
  ): Promise<UnitOfMeasure[]> {
    return await this.ingredientRepository.getAllUnitOfMeasure(
      pageNumber,
      limitNumber,
    );
  }

  async getUnitOfMeasureById(id: string): Promise<UnitOfMeasure> {
    return await this.ingredientRepository.getUnitOfMeasureById(id);
  }
}
