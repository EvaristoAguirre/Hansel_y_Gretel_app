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
import { IngredientResponseDTO } from 'src/DTOs/ingredientSummaryResponse.dto';
import { UnitOfMeasureService } from 'src/UnitOfMeasure/unitOfMeasure.service';

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
        relations: ['stock', 'stock.unitOfMeasure', 'unitOfMeasure'],
      });

      return await this.adaptIngredientsResponse(ingredients);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
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
    if (!name) {
      throw new BadRequestException('Either ID must be provided.');
    }
    try {
      const ingredient = await this.ingredientRepository.findOne({
        where: { name },
      });
      if (!ingredient) {
        throw new NotFoundException(`Ingredient with ID: ${name} not found`);
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
      where: { name: name },
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
        ingredient.unitOfMeasure =
          await this.unitOfMeasureService.getUnitOfMeasureById(unitOfMeasureId);
      }
      return await this.ingredientRepository.save(ingredient);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while creating the ingredient. Please try again later.',
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

  private adaptIngredientResponse(ingredient: any): IngredientResponseDTO {
    return {
      id: ingredient.id,
      name: ingredient.name,
      isActive: ingredient.isActive,
      description: ingredient.description,
      cost: ingredient.cost,
      unitOfMeasure: {
        id: ingredient.unitOfMeasure.id,
        name: ingredient.unitOfMeasure.name,
        abbreviation: ingredient.unitOfMeasure.abbreviation,
      },
      stock: ingredient.stock
        ? {
            id: ingredient.stock.id,
            quantityInStock: ingredient.stock.quantityInStock,
            minimumStock: ingredient.stock.minimumStock,
            unitOfMeasure: {
              id: ingredient.stock.unitOfMeasure.id,
              name: ingredient.stock.unitOfMeasure.name,
              abbreviation: ingredient.stock.unitOfMeasure.abbreviation,
            },
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
