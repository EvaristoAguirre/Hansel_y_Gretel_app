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
import { UnitOfMeasure } from './unitOfMesure.entity';
import { CreateUnitOfMeasureDto } from 'src/DTOs/create-unit.dto';
import { UpdateUnitOfMeasureDto } from 'src/DTOs/update-unit.dto';
import { UnitConversion } from './unitConversion.entity';

@Injectable()
export class IngredientRepository {
  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    @InjectRepository(UnitOfMeasure)
    private readonly unitOfMeasureRepository: Repository<UnitOfMeasure>,
    @InjectRepository(UnitConversion)
    private readonly unitConversionRepository: Repository<UnitConversion>,
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

  async getIngredientById(id: string): Promise<Ingredient> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    try {
      const ingredient = await this.ingredientRepository.findOne({
        where: { id, isActive: true },
      });
      if (!ingredient) {
        throw new NotFoundException(`Ingredient with ID: ${id} not found`);
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

  // ---------------- Unit Of Measure ---------- //
  async createUnitOfMeasure(
    createData: CreateUnitOfMeasureDto,
  ): Promise<UnitOfMeasure> {
    const {
      name,
      abbreviation,
      equivalenceToBaseUnit,
      baseUnitId,
      conversions,
    } = createData;

    if (!name) {
      throw new BadRequestException('Name must be provided');
    }

    const existingUnitByName = await this.unitOfMeasureRepository.findOne({
      where: { name },
    });

    if (existingUnitByName) {
      throw new ConflictException('Unit of measure name already exists');
    }

    if (abbreviation) {
      const existingUnitByAbbreviation =
        await this.unitOfMeasureRepository.findOne({
          where: { abbreviation },
        });

      if (existingUnitByAbbreviation) {
        throw new ConflictException(
          'Unit of measure abbreviation already exists',
        );
      }
    }

    // Validación de equivalenceToBaseUnit y baseUnitId
    if (equivalenceToBaseUnit && !baseUnitId) {
      throw new BadRequestException(
        'baseUnitId must be provided when equivalenceToBaseUnit is defined',
      );
    }

    if (baseUnitId && !equivalenceToBaseUnit) {
      throw new BadRequestException(
        'equivalenceToBaseUnit must be provided when baseUnitId is defined',
      );
    }

    // Validar que la unidad base exista y sea convencional
    let baseUnit: UnitOfMeasure | null = null;
    if (baseUnitId) {
      baseUnit = await this.unitOfMeasureRepository.findOne({
        where: { id: baseUnitId },
      });

      if (!baseUnit) {
        throw new BadRequestException('Base unit does not exist');
      }

      if (!baseUnit.isConventional) {
        throw new BadRequestException('Base unit must be conventional');
      }
    }

    const unitOfMeasure = this.unitOfMeasureRepository.create({
      ...createData,
      baseUnit,
    });

    const savedUnitOfMeasure =
      await this.unitOfMeasureRepository.save(unitOfMeasure);

    // Crear las conversiones si se proporcionaron
    if (conversions && conversions.length > 0) {
      for (const conversion of conversions) {
        const { toUnitId, conversionFactor } = conversion;

        const toUnit = await this.unitOfMeasureRepository.findOne({
          where: { id: toUnitId },
        });

        if (!toUnit) {
          throw new BadRequestException(`Unit with ID ${toUnitId} not found`);
        }

        const unitConversion = this.unitConversionRepository.create({
          fromUnit: savedUnitOfMeasure,
          toUnit,
          conversionFactor,
        });

        await this.unitConversionRepository.save(unitConversion);
      }
    }

    return savedUnitOfMeasure;
  }

  async getAllUnitOfMeasure(
    pageNumber: number,
    limitNumber: number,
  ): Promise<UnitOfMeasure[]> {
    if (pageNumber <= 0 || limitNumber <= 0) {
      throw new BadRequestException(
        'Page and limit must be positive integers.',
      );
    }
    try {
      return await this.unitOfMeasureRepository.find({
        where: { isActive: true },
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        relations: ['baseUnit'],
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Error fetching units of measure:', error);
      throw new InternalServerErrorException(
        'Error fetching orders',
        error.message,
      );
    }
  }

  async getConventionalUnitOfMeasure(
    pageNumber: number,
    limitNumber: number,
  ): Promise<UnitOfMeasure[]> {
    if (pageNumber <= 0 || limitNumber <= 0) {
      throw new BadRequestException(
        'Page and limit must be positive integers.',
      );
    }
    try {
      return await this.unitOfMeasureRepository.find({
        where: { isConventional: true, isActive: true },
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        relations: [
          'baseUnit',
          'fromConversions',
          'toConversions',
          'fromConversions.toUnit',
          'toConversions.fromUnit',
        ],
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        'Error fetching orders',
        error.message,
      );
    }
  }

  async getUnitOfMeasureById(id: string): Promise<UnitOfMeasure> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    try {
      const unitOfMeasure = await this.unitOfMeasureRepository.findOne({
        where: { id: id, isActive: true },
        relations: ['baseUnit'],
      });
      if (!unitOfMeasure) {
        throw new NotFoundException(`Unit of mesure with ID: ${id} not found`);
      }
      return unitOfMeasure;
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

  async updateUnitOfMeasure(
    id: string,
    updateData: UpdateUnitOfMeasureDto,
  ): Promise<UnitOfMeasure> {
    const { name, abbreviation, baseUnitId } = updateData;

    const existingUnitOfMeasure = await this.unitOfMeasureRepository.findOne({
      where: { id: id },
    });

    if (!existingUnitOfMeasure) {
      throw new NotFoundException('Unit of measure not found');
    }

    if (name && name !== existingUnitOfMeasure.name) {
      const unitWithSameName = await this.unitOfMeasureRepository.findOne({
        where: { name: name },
      });

      if (unitWithSameName) {
        throw new ConflictException('Unit of measure name already exists');
      }
    }

    if (abbreviation && abbreviation !== existingUnitOfMeasure.abbreviation) {
      const unitWithSameAbbreviation =
        await this.unitOfMeasureRepository.findOne({
          where: { abbreviation: abbreviation },
        });

      if (unitWithSameAbbreviation) {
        throw new ConflictException(
          'Unit of measure abbreviation already exists',
        );
      }
    }

    if (baseUnitId) {
      const baseUnit = await this.unitOfMeasureRepository.findOne({
        where: { id: baseUnitId },
      });

      if (!baseUnit) {
        throw new BadRequestException('Base unit does not exist');
      }
    }

    try {
      const updatedUnitOfMeasure = this.unitOfMeasureRepository.merge(
        existingUnitOfMeasure,
        updateData,
      );
      return await this.unitOfMeasureRepository.save(updatedUnitOfMeasure);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error updating the unit of measure',
        error.message,
      );
    }
  }

  async convertUnit(
    fromUnitId: string,
    toUnitId: string,
    quantity: number,
  ): Promise<number> {
    if (fromUnitId === toUnitId) {
      return quantity;
    }

    const directConversion = await this.unitConversionRepository.findOne({
      where: { fromUnit: { id: fromUnitId }, toUnit: { id: toUnitId } },
    });

    if (directConversion) {
      return quantity * directConversion.conversionFactor;
    }

    const fromUnit = await this.unitOfMeasureRepository.findOne({
      where: { id: fromUnitId },
      relations: ['baseUnit'],
    });

    const toUnit = await this.unitOfMeasureRepository.findOne({
      where: { id: toUnitId },
      relations: ['baseUnit'],
    });

    if (!fromUnit || !toUnit) {
      throw new NotFoundException('One or both units not found.');
    }

    let convertedQuantity = quantity;
    if (fromUnit.baseUnit && fromUnit.equivalenceToBaseUnit) {
      convertedQuantity *= fromUnit.equivalenceToBaseUnit;
    }

    if (toUnit.baseUnit && toUnit.equivalenceToBaseUnit) {
      convertedQuantity /= toUnit.equivalenceToBaseUnit;
    }

    return convertedQuantity;
  }
}
