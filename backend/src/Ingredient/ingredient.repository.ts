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
import { UnitOfMeasureService } from 'src/UnitOfMeasure/unitOfMeasure.service';
import { ToppingResponseDto } from 'src/DTOs/toppingSummaryResponse.dto';
import { UpdateToppingDto } from 'src/DTOs/update-topping.dto';

@Injectable()
export class IngredientRepository {
  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    private readonly unitOfMeasureService: UnitOfMeasureService,
  ) {}

  async getIngredientByName(name: string): Promise<Ingredient> {
    const ingredient = await this.ingredientRepository.findOne({
      where: { name: ILike(name) },
    });
    return ingredient;
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

  // --------------------- TOPPINGS ----------------

  async getToppingByName(name: string): Promise<ToppingResponseDto> {
    if (!name || typeof name !== 'string') {
      throw new BadRequestException('Valid name parameter is required');
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      throw new BadRequestException('Name cannot be empty');
    }

    try {
      const topping = await this.ingredientRepository.findOne({
        where: {
          name: ILike(trimmedName),
        },
      });

      if (!topping) {
        throw new NotFoundException(
          `Topping with name "${trimmedName}" not found`,
        );
      }
      return this.adaptToppingResponse(topping);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Error fetching topping');
    }
  }

  async updateTopping(
    id: string,
    updateToppingDto: UpdateToppingDto,
  ): Promise<Ingredient> {
    if (!id) {
      throw new BadRequestException('ID is required to update topping');
    }

    const topping = await this.ingredientRepository.findOne({
      where: { id },
      relations: ['unitOfMeasure'],
    });

    if (!topping) {
      throw new NotFoundException(`Topping with ID ${id} not found`);
    }

    if (updateToppingDto.name && updateToppingDto.name !== topping.name) {
      const existing = await this.ingredientRepository.findOne({
        where: { name: updateToppingDto.name },
      });
      if (existing) {
        throw new ConflictException(
          `Topping with name "${updateToppingDto.name}" already exists`,
        );
      }
    }

    try {
      Object.assign(topping, updateToppingDto);

      if (updateToppingDto.unitOfMeasureId) {
        const unit = await this.unitOfMeasureService.getUnitOfMeasureById(
          updateToppingDto.unitOfMeasureId,
        );

        if (!unit) {
          throw new NotFoundException(
            `Unit of measure with ID ${updateToppingDto.unitOfMeasureId} not found`,
          );
        }
        topping.unitOfMeasure = unit;
      }

      return await this.ingredientRepository.save(topping);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if (error.code === '23505') {
        throw new ConflictException('Topping name must be unique');
      }

      throw new InternalServerErrorException(
        'Failed to update topping',
        error.message,
      );
    }
  }
  // ---------------------------------------
  // --------------------- Ajuste de respuesta ----------------

  private adaptToppingResponse(topping: any): ToppingResponseDto {
    return {
      id: topping.id,
      name: topping.name,
      isActive: topping.isActive,
      description: topping.description,
      cost: topping.cost,
      type: topping.type,
      extraCost: topping.extraCost ?? null,
      unitOfMeasure: topping.unitOfMeasure
        ? {
            id: topping.unitOfMeasure.id,
            name: topping.unitOfMeasure.name,
            abbreviation: topping.unitOfMeasure.abbreviation,
          }
        : null,
      stock: topping.stock
        ? {
            id: topping.stock.id,
            quantityInStock: topping.stock.quantityInStock,
            minimumStock: topping.stock.minimumStock,
            unitOfMeasure: topping.stock.unitOfMeasure
              ? {
                  id: topping.stock.unitOfMeasure.id,
                  name: topping.stock.unitOfMeasure.name,
                  abbreviation: topping.stock.unitOfMeasure.abbreviation,
                }
              : null,
          }
        : null,
    };
  }

  private adaptToppingsResponse(toppings: any[]): ToppingResponseDto[] {
    return toppings.map(this.adaptToppingResponse);
  }

  // --------------------- Consultas sobre Stock  -----------
  async getIngredientsWithStock(): Promise<Ingredient[]> {
    return this.ingredientRepository
      .createQueryBuilder('ingredient')
      .leftJoinAndSelect('ingredient.stock', 'stock')
      .leftJoinAndSelect('stock.unitOfMeasure', 'unitOfMeasure')
      .getMany();
  }
}
