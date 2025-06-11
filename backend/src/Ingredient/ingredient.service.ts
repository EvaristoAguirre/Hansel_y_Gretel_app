import { Injectable } from '@nestjs/common';
import { IngredientRepository } from './ingredient.repository';
import { Ingredient } from './ingredient.entity';
import { CreateIngredientDto } from 'src/DTOs/create-ingredient.dto';
import { UpdateIngredientDto } from 'src/DTOs/update-ingredient.dto';
import { IngredientResponseDTO } from 'src/DTOs/ingredientSummaryResponse.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ToppingResponseDto } from 'src/DTOs/toppingSummaryResponse.dto';

@Injectable()
export class IngredientService {
  constructor(
    private readonly ingredientRepository: IngredientRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getAllIngredients(
    page: number,
    limit: number,
  ): Promise<IngredientResponseDTO[]> {
    return this.ingredientRepository.getAllIngredients(page, limit);
  }

  async getIngredientById(id: string): Promise<IngredientResponseDTO> {
    return await this.ingredientRepository.getIngredientById(id);
  }

  async getIngredientByName(name: string): Promise<Ingredient> {
    return await this.ingredientRepository.getIngredientByName(name);
  }
  async createIngredient(createData: CreateIngredientDto): Promise<Ingredient> {
    const ingredientCreated =
      await this.ingredientRepository.createIngredient(createData);
    await this.eventEmitter.emit('ingredient.created', {
      ingredient: ingredientCreated,
    });
    return ingredientCreated;
  }

  async updateIngredient(id: string, updateData: UpdateIngredientDto) {
    const ingredientUpdated = await this.ingredientRepository.updateIngredient(
      id,
      updateData,
    );
    await this.eventEmitter.emit('ingredient.updated', {
      ingredient: ingredientUpdated,
    });
    return ingredientUpdated;
  }

  async deleteIngredient(id: string) {
    const ingredientDeleted =
      await this.ingredientRepository.deleteIngredient(id);
    await this.eventEmitter.emit('ingredient.deleted', {
      ingredient: ingredientDeleted,
    });
    return ingredientDeleted;
  }

  // -------------------- TOPPINGS --------------------

  async updateTopping(
    id: string,
    updateData: UpdateIngredientDto,
  ): Promise<Ingredient> {
    const toppingUpdated = await this.ingredientRepository.updateTopping(
      id,
      updateData,
    );
    await this.eventEmitter.emit('topping.updated', {
      topping: toppingUpdated,
    });
    return toppingUpdated;
  }

  async getAllToppings(
    page: number,
    limit: number,
  ): Promise<ToppingResponseDto[]> {
    return this.ingredientRepository.getAllToppings(page, limit);
  }

  async getToppingById(id: string): Promise<ToppingResponseDto> {
    return await this.ingredientRepository.getToppingById(id);
  }
  async getToppingByName(name: string): Promise<ToppingResponseDto> {
    return await this.ingredientRepository.getToppingByName(name);
  }

  async findToppingById(id: string): Promise<Ingredient> {
    return await this.ingredientRepository.findToppingById(id);
  }
}
