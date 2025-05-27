import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Ingredient } from './ingredient.entity';
import { ILike, Repository } from 'typeorm';
import { CreateIngredientDto } from 'src/DTOs/create-ingredient.dto';
import { UpdateIngredientDto } from 'src/DTOs/update-ingredient.dto';
import { IngredientResponseDTO } from 'src/DTOs/ingredientSummaryResponse.dto';
import { UnitOfMeasureService } from 'src/UnitOfMeasure/unitOfMeasure.service';
import { isUUID } from 'class-validator';

@Injectable()
export class IngredientRepository {
  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    private readonly unitOfMeasureService: UnitOfMeasureService,
  ) {}

  // ------- con envio de stock estandarizado
  async getAllIngredients(
    page: number,
    limit: number,
  ): Promise<IngredientResponseDTO[]> {
    if (page <= 0 || limit <= 0) {
      throw new BadRequestException(
        'Page and limit must be positive integers.',
      );
    }

    try {
      const ingredients = await this.ingredientRepository.find({
        where: { isActive: true },
        skip: (page - 1) * limit,
        take: limit,
        relations: ['unitOfMeasure', 'stock', 'stock.unitOfMeasure'],
      });
      return await this.adaptIngredientsResponse(ingredients);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error fetching ingredients',
        error.message,
      );
    }
  }

  // ------- con envio de stock estandarizado
  async getAllToppings(
    page: number,
    limit: number,
  ): Promise<IngredientResponseDTO[]> {
    if (page <= 0 || limit <= 0) {
      throw new BadRequestException(
        'Page and limit must be positive integers.',
      );
    }

    try {
      const ingredients = await this.ingredientRepository.find({
        where: { isActive: true, isTopping: true },
        skip: (page - 1) * limit,
        take: limit,
        relations: ['unitOfMeasure', 'stock', 'stock.unitOfMeasure'],
      });
      return await this.adaptIngredientsResponse(ingredients);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error fetching ingredients',
        error.message,
      );
    }
  }

  // ------- con envio de stock estandarizado
  async getIngredientById(id: string): Promise<IngredientResponseDTO> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
    try {
      const ingredient = await this.ingredientRepository.findOne({
        where: { id, isActive: true },
        relations: ['stock', 'stock.unitOfMeasure', 'unitOfMeasure'],
      });
      if (!ingredient) {
        throw new NotFoundException(`Ingredient with ID: ${id} not found`);
      }
      return await this.adaptIngredientResponse(ingredient);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error fetching the unit of mesure',
        error.message,
      );
    }
  }

  async getIngredientByName(name: string): Promise<Ingredient> {
    if (!name || name.trim().length === 0) {
      throw new BadRequestException('Name parameter is required');
    }
    try {
      const ingredient = await this.ingredientRepository.findOne({
        where: { name: ILike(name) },
      });
      if (!ingredient) {
        throw new NotFoundException(`Ingredient with name: ${name} not found`);
      }
      return ingredient;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error fetching the unit of mesure',
        error.message,
      );
    }
  }

  async createIngredient(createData: CreateIngredientDto): Promise<Ingredient> {
    const { name, unitOfMeasureId } = createData;

    if (!name) {
      throw new BadRequestException('Name must be provided');
    }

    const existingIngredient = await this.ingredientRepository.findOne({
      where: { name: ILike(name) },
    });
    if (existingIngredient) {
      throw new ConflictException('Ingredient name already exists');
    }

    if (unitOfMeasureId) {
      const unitOfMeasure =
        await this.unitOfMeasureService.getUnitOfMeasureById(unitOfMeasureId);
      if (!unitOfMeasure) {
        throw new BadRequestException('Unit of measure not found');
      }
    }

    try {
      const ingredient = this.ingredientRepository.create(createData);
      if (unitOfMeasureId) {
        const unitOfMeasure =
          await this.unitOfMeasureService.getUnitOfMeasureById(unitOfMeasureId);
        console.log(unitOfMeasure);
        if (!unitOfMeasure) {
          throw new BadRequestException('Unit of measure not found');
        }
        ingredient.unitOfMeasure = unitOfMeasure;

        const unitOfMeasureBaseUnit =
          await this.unitOfMeasureService.getUnitOfMeasureById(
            unitOfMeasure.baseUnitId,
          );
        if (
          unitOfMeasureBaseUnit.name === 'Litro' ||
          unitOfMeasureBaseUnit.name === 'Mililitro' ||
          unitOfMeasureBaseUnit.name === 'Centímetro cúbico'
        ) {
          ingredient.type = 'volumen';
        }

        if (
          unitOfMeasureBaseUnit.name === 'Miligramo' ||
          unitOfMeasureBaseUnit.name === 'Kilogramo' ||
          unitOfMeasureBaseUnit.name === 'Gramo'
        ) {
          ingredient.type = 'masa';
        }
        if (unitOfMeasureBaseUnit.name === 'Unidad') {
          ingredient.type = 'unidad';
        }
      }
      return await this.ingredientRepository.save(ingredient);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while creating the ingredient. Please try again later.',
        error.message,
      );
    }
  }

  async updateIngredient(
    id: string,
    updateData: UpdateIngredientDto,
  ): Promise<Ingredient> {
    if (!id) {
      throw new BadRequestException('ID must be provided');
    }
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }

    try {
      const ingredient = await this.ingredientRepository.findOne({
        where: { id: id, isActive: true },
      });
      if (!ingredient) {
        throw new NotFoundException('Ingredient not found');
      }

      if (updateData.unitOfMeasureId) {
        const unitOfMeasure =
          await this.unitOfMeasureService.getUnitOfMeasureById(
            updateData.unitOfMeasureId,
          );
        if (!unitOfMeasure) {
          throw new BadRequestException('Unit of measure not found');
        }

        ingredient.unitOfMeasure = unitOfMeasure;
        delete updateData.unitOfMeasureId;
      }

      Object.assign(ingredient, updateData);

      await this.ingredientRepository.save(ingredient);
      const updatedIngredient = await this.ingredientRepository.findOne({
        where: { id: id, isActive: true },
        relations: ['unitOfMeasure'],
      });
      return updatedIngredient;
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
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
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

  private adaptIngredientResponse(ingredient: any): IngredientResponseDTO {
    return {
      id: ingredient.id,
      name: ingredient.name,
      isActive: ingredient.isActive,
      description: ingredient.description,
      cost: ingredient.cost,
      type: ingredient.type,
      isTopping: ingredient.isTopping,
      unitOfMeasure: ingredient.unitOfMeasure
        ? {
            id: ingredient.unitOfMeasure.id,
            name: ingredient.unitOfMeasure.name,
            abbreviation: ingredient.unitOfMeasure.abbreviation,
          }
        : null,
      stock: ingredient.stock
        ? {
            id: ingredient.stock.id,
            quantityInStock: ingredient.stock.quantityInStock,
            minimumStock: ingredient.stock.minimumStock,
            unitOfMeasure: ingredient.stock.unitOfMeasure
              ? {
                  id: ingredient.stock.unitOfMeasure.id,
                  name: ingredient.stock.unitOfMeasure.name,
                  abbreviation: ingredient.stock.unitOfMeasure.abbreviation,
                }
              : null,
          }
        : null,
    };
  }

  private adaptIngredientsResponse(
    ingredients: any[],
  ): IngredientResponseDTO[] {
    return ingredients.map(this.adaptIngredientResponse);
  }
}
