/* eslint-disable no-empty */
/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { IngredientRepository } from './ingredient.repository';
import { Ingredient } from './ingredient.entity';
import { CreateIngredientDto } from 'src/DTOs/create-ingredient.dto';
import { UpdateIngredientDto } from 'src/DTOs/update-ingredient.dto';
import { IngredientResponseDTO } from 'src/DTOs/ingredientSummaryResponse.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ToppingResponseDto } from 'src/DTOs/toppingSummaryResponse.dto';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { isUUID } from 'class-validator';
import { UnitOfMeasure } from 'src/UnitOfMeasure/unitOfMesure.entity';
import { CostCascadeService } from 'src/CostCascade/cost-cascade.service';
import { IngredientResponseFormatter } from './ingredient-response-formatter';

@Injectable()
export class IngredientService {
  private readonly logger = new Logger(IngredientService.name);
  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredientRepo: Repository<Ingredient>,
    private readonly ingredientRepository: IngredientRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
    private readonly costCascadeService: CostCascadeService,
  ) {}

  // ------- rta en string sin decimales y punto de mil
  async getAllIngredientsAndToppings(
    page: number,
    limit: number,
  ): Promise<IngredientResponseDTO[]> {
    if (page <= 0 || limit <= 0) {
      throw new BadRequestException(
        'Page and limit must be positive integers.',
      );
    }

    try {
      const ingredients = await this.ingredientRepo.find({
        where: { isActive: true },
        skip: (page - 1) * limit,
        take: limit,
        relations: ['unitOfMeasure', 'stock', 'stock.unitOfMeasure'],
      });

      return this.adaptIngredientsResponse(ingredients);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error fetching ingredients',
        error.message,
      );
    }
  }

  // ------- rta en string sin decimales y punto de mil
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
      const ingredients = await this.ingredientRepo.find({
        where: { isActive: true },
        skip: (page - 1) * limit,
        take: limit,
        relations: ['unitOfMeasure', 'stock', 'stock.unitOfMeasure'],
      });

      return this.adaptIngredientsResponse(ingredients);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error fetching ingredients',
        error.message,
      );
    }
  }

  // ------- rta en string sin decimales y punto de mil
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
      const ingredient = await this.ingredientRepo.findOne({
        where: { id, isActive: true },
        relations: ['stock', 'stock.unitOfMeasure', 'unitOfMeasure'],
      });
      if (!ingredient) {
        throw new NotFoundException(`Ingredient with ID: ${id} not found`);
      }

      return this.adaptIngredientResponse(ingredient);
    } catch (error) {
      if (error instanceof HttpException) throw error;

      throw new InternalServerErrorException(
        'Error fetching the ingredient by ID',
        error.message,
      );
    }
  }

  // ---------- CUIDADO PORQUE ESTE ES PARA OTROS SERVICIOS
  async getIngredientByIdToAnotherService(id: string): Promise<Ingredient> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
    try {
      const ingredient = await this.ingredientRepo.findOne({
        where: { id, isActive: true },
        relations: ['stock', 'stock.unitOfMeasure', 'unitOfMeasure'],
      });
      if (!ingredient) {
        throw new NotFoundException(`Ingredient with ID: ${id} not found`);
      }

      return ingredient;
    } catch (error) {
      if (error instanceof HttpException) throw error;

      throw new InternalServerErrorException(
        'Error fetching the ingredient by ID',
        error.message,
      );
    }
  }

  // ------- rta en string sin decimales y punto de mil
  async getIngredientByName(name: string): Promise<Ingredient> {
    if (!name || name.trim().length === 0) {
      throw new BadRequestException('Name parameter is required');
    }

    try {
      const ingredient =
        await this.ingredientRepository.getIngredientByName(name);

      if (!ingredient) {
        throw new NotFoundException(`Ingredient with name: ${name} not found`);
      }

      return IngredientResponseFormatter.format(ingredient);
    } catch (error) {
      if (error instanceof HttpException) throw error;

      throw new InternalServerErrorException(
        'Error fetching the unit of mesure',
        error.message,
      );
    }
  }

  // ------- rta en string sin decimales y punto de mil
  async createIngredient(createData: CreateIngredientDto): Promise<Ingredient> {
    const ingredientCreated =
      await this.ingredientRepository.createIngredient(createData);

    const ingredientWithFormatt =
      IngredientResponseFormatter.format(ingredientCreated);
    this.eventEmitter.emit('ingredient.created', {
      ingredient: ingredientWithFormatt,
    });
    return ingredientWithFormatt;
  }

  // ------- rta en string sin decimales y punto de mil
  async updateIngredient(id: string, updateData: UpdateIngredientDto) {
    if (!id) {
      throw new BadRequestException('ID must be provided');
    }
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const ingredientToUpdate = await queryRunner.manager.findOne(Ingredient, {
        where: { id, isActive: true },
        relations: ['unitOfMeasure', 'stock'],
      });

      if (!ingredientToUpdate) {
        throw new NotFoundException('Ingredient not found');
      }

      const shouldRecalculateCost =
        updateData.cost !== undefined &&
        Number(updateData.cost) !== Number(ingredientToUpdate.cost);

      if (shouldRecalculateCost) {
        this.logger.log(
          'deberia dispararse el recalculo de costo por cambio de valor en ingrediente...',
          ingredientToUpdate.id,
          ingredientToUpdate.name,
        );
      }

      // if (updateData.unitOfMeasureId) {
      //   const unitOfMeasure = await queryRunner.manager.findOne(UnitOfMeasure, {
      //     where: { id: updateData.unitOfMeasureId },
      //   });
      //   if (!unitOfMeasure) {
      //     throw new BadRequestException('Unit of measure not found');
      //   }

      //   ingredientToUpdate.unitOfMeasure = unitOfMeasure;
      //   delete updateData.unitOfMeasureId;
      // }

      // if (shouldRecalculateCost) {
      //   delete updateData.cost;
      // }

      // 1. Guardar referencia al stock existente
      const existingStock = ingredientToUpdate.stock;

      // 2. Actualización selectiva (excluyendo relaciones)
      const updatableFields = ['name', 'description', 'cost', 'type'];
      updatableFields.forEach((field) => {
        if (updateData[field] !== undefined) {
          ingredientToUpdate[field] = updateData[field];
        }
      });

      // 3. Manejo especial para unitOfMeasure
      if (updateData.unitOfMeasureId) {
        const unitOfMeasure = await queryRunner.manager.findOne(UnitOfMeasure, {
          where: { id: updateData.unitOfMeasureId },
        });
        if (!unitOfMeasure) {
          throw new BadRequestException('Unit of measure not found');
        }
        ingredientToUpdate.unitOfMeasure = unitOfMeasure;
      }
      // ---------------- Actualizacion de costos --------------------
      if (shouldRecalculateCost) {
        this.logger.log(
          `Entre a recalculo de costos debido a cambio en ingrediente ${ingredientToUpdate.id}`,
        );
        this.logger.log(
          'a ver que datos le estoy pansando a la actualizacion..',
          updateData.cost,
        );
        const cascadeResult =
          await this.costCascadeService.updateIngredientCostAndCascade(
            ingredientToUpdate.id,
            Number(updateData.cost), // importante: pasás el nuevo costo explícito
            queryRunner,
          );
        if (!cascadeResult.success) {
          this.logger.warn(
            `⚠️ Recalculo incompleto para ingrediente ${ingredientToUpdate.id}. Productos actualizados: ${cascadeResult.updatedProducts.length}, promociones: ${cascadeResult.updatedPromotions.length}. Mensaje: ${cascadeResult.message}`,
          );
        } else {
          this.logger.log(
            `✅ Recalculo completo. Productos: ${cascadeResult.updatedProducts.length}, Promociones: ${cascadeResult.updatedPromotions.length}`,
          );
        }
      }
      // ---------------- Cierre de actualizacion de costos ----------

      // 4. Restaurar stock manualmente
      ingredientToUpdate.stock = existingStock;

      // 5. Guardar normalmente (sin opciones adicionales)
      await queryRunner.manager.save(Ingredient, ingredientToUpdate);

      // await queryRunner.manager.save(ingredientToUpdate);

      const updatedIngredient = await queryRunner.manager.findOne(Ingredient, {
        where: { id: id, isActive: true },
        relations: ['unitOfMeasure', 'stock', 'stock.unitOfMeasure'],
      });

      if (!updatedIngredient) {
        throw new NotFoundException('Ingredient not found after update');
      }

      await queryRunner.commitTransaction();

      const ingredientUpdatedWithFormatt =
        IngredientResponseFormatter.format(updatedIngredient);
      this.eventEmitter.emit('ingredient.updated', {
        ingredient: ingredientUpdatedWithFormatt,
      });

      return ingredientUpdatedWithFormatt;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error updating the ingredient',
        error.message,
      );
    } finally {
      await queryRunner.release();
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
      const ingredient = await this.ingredientRepo.findOne({
        where: { id: id, isActive: true },
      });
      if (!ingredient) {
        throw new NotFoundException('Ingredient not found');
      }
      ingredient.isActive = false;

      const ingredientSoftDeleted = await this.ingredientRepo.save(ingredient);

      this.eventEmitter.emit('ingredient.deleted', {
        ingredient: ingredientSoftDeleted,
      });

      return ingredientSoftDeleted;
    } catch (error) {
      if (error instanceof HttpException) throw error;

      throw new InternalServerErrorException(
        'Error deleting the ingredient',
        error.message,
      );
    }
  }

  // -------------------- TOPPINGS --------------------

  // ------- rta en string sin decimales y punto de mil
  async getAllToppings(
    page: number,
    limit: number,
  ): Promise<ToppingResponseDto[]> {
    if (page <= 0 || limit <= 0) {
      throw new BadRequestException(
        'Page and limit must be positive integers.',
      );
    }

    try {
      const toppings = await this.ingredientRepo.find({
        where: { isActive: true },
        skip: (page - 1) * limit,
        take: limit,
        relations: ['unitOfMeasure', 'stock', 'stock.unitOfMeasure'],
      });
      return this.adaptToppingsResponse(toppings);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error fetching toppings',
        error.message,
      );
    }
  }
  // ------- rta en string sin decimales y punto de mil
  async getToppingById(id: string): Promise<ToppingResponseDto> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
    try {
      const topping = await this.ingredientRepo.findOne({
        where: { id, isActive: true },
        relations: ['stock', 'stock.unitOfMeasure', 'unitOfMeasure'],
      });
      if (!topping) {
        throw new NotFoundException(`topping with ID: ${id} not found`);
      }
      return this.adaptToppingResponse(topping);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error fetching the topping',
        error.message,
      );
    }
  }

  // ------- rta en string sin decimales y punto de mil
  async getToppingByName(name: string): Promise<ToppingResponseDto> {
    return await this.ingredientRepository.getToppingByName(name);
  }

  // ------- rta en string sin decimales y punto de mil
  async findToppingById(id: string): Promise<Ingredient> {
    if (!id) {
      throw new BadRequestException('ID must be provided');
    }
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
    try {
      const topping = await this.ingredientRepo.findOne({
        where: { id, isActive: true },
        relations: ['unitOfMeasure', 'stock', 'stock.unitOfMeasure'],
      });
      if (!topping) {
        throw new NotFoundException(`Topping with ID: ${id} not found`);
      }
      return IngredientResponseFormatter.format(topping);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error fetching the topping',
        error.message,
      );
    }
  }

  // ------- rta en string sin decimales y punto de mil
  async updateTopping(
    id: string,
    updateData: UpdateIngredientDto,
  ): Promise<Ingredient> {
    const toppingUpdated = await this.ingredientRepository.updateTopping(
      id,
      updateData,
    );
    const toppingUpdatedWithFormatt =
      IngredientResponseFormatter.format(toppingUpdated);
    this.eventEmitter.emit('topping.updated', {
      topping: toppingUpdatedWithFormatt,
    });
    return toppingUpdatedWithFormatt;
  }

  // --------------------- Consultas sobre Stock  -----------

  // ------- rta en string sin decimales y punto de mil
  async getIngredientsWithStock(): Promise<Ingredient[]> {
    const ingredients =
      await this.ingredientRepository.getIngredientsWithStock();
    const ingredientsWithFormatt =
      IngredientResponseFormatter.formatMany(ingredients);
    return ingredientsWithFormatt;
  }

  private adaptIngredientResponse(ingredient: any): IngredientResponseDTO {
    const formatter = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    const formatterStock = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return {
      id: ingredient.id,
      name: ingredient.name,
      isActive: ingredient.isActive,
      description: ingredient.description,
      cost: formatter.format(Number(ingredient.cost)),
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
            quantityInStock: formatterStock.format(
              Number(ingredient.stock.quantityInStock),
            ),
            minimumStock: formatterStock.format(
              Number(ingredient.stock.minimumStock),
            ),
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

  private adaptToppingResponse(topping: any): ToppingResponseDto {
    const formatter = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    const formatterStock = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return {
      id: topping.id,
      name: topping.name,
      isActive: topping.isActive,
      description: topping.description,
      cost: formatter.format(Number(topping.cost)),
      type: topping.type,
      extraCost:
        topping.extraCost != null
          ? formatter.format(Number(topping.extraCost))
          : null,
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
            quantityInStock: formatterStock.format(
              Number(topping.stock.quantityInStock),
            ),
            minimumStock: formatterStock.format(
              Number(topping.stock.minimumStock),
            ),
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
}
