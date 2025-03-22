import { Injectable } from '@nestjs/common';
import { IngredientRepository } from './ingredient.repository';
import { Ingredient } from './ingredient.entity';
import { CreateIngredientDto } from 'src/DTOs/create-ingredient.dto';
import { UpdateIngredientDto } from 'src/DTOs/update-ingredient.dto';
import { CreateUnitOfMeasureDto } from 'src/DTOs/create-unit.dto';
import { UnitOfMeasure } from './unitOfMesure.entity';
import { UpdateUnitOfMeasureDto } from 'src/DTOs/update-unit.dto';
import { IngredientResponseDTO } from 'src/DTOs/ingredientSummaryResponse.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

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

  async updateUnitOfMeasure(
    id: string,
    updateData: UpdateUnitOfMeasureDto,
  ): Promise<UnitOfMeasure> {
    return await this.ingredientRepository.updateUnitOfMeasure(id, updateData);
  }

  async getConventionalUnitOfMeasure(
    pageNumber: number,
    limitNumber: number,
  ): Promise<UnitOfMeasure[]> {
    return await this.ingredientRepository.getConventionalUnitOfMeasure(
      pageNumber,
      limitNumber,
    );
  }

  async convertUnit(fromUnit: string, toUnit: string, quantity: number) {
    return await this.ingredientRepository.convertUnit(
      fromUnit,
      toUnit,
      quantity,
    );
  }
}
