import { Injectable } from '@nestjs/common';
import { IngredientRepository } from './ingredient.repository';
import { Ingredient } from './ingredient.entity';
import { CreateIngredientDto } from 'src/DTOs/create-ingredient.dto';
import { UpdateIngredientDto } from 'src/DTOs/update-ingredient.dto';

@Injectable()
export class IngredientService {
  constructor(private readonly ingredientRepository: IngredientRepository) {}

  async getAllIngredients(page: number, limit: number): Promise<Ingredient[]> {
    return this.ingredientRepository.getAllIngredients(page, limit);
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
}
