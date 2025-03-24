import { UnitOfMeasure } from './unitOfMesure.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnitConversion } from './unitConversion.entity';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUnitOfMeasureDto } from 'src/DTOs/create-unit.dto';
import { UpdateUnitOfMeasureDto } from 'src/DTOs/update-unit.dto';

@Injectable()
export class UnitOfMeasureRepository {
  constructor(
    @InjectRepository(UnitOfMeasure)
    private readonly unitOfMeasureRepository: Repository<UnitOfMeasure>,
    @InjectRepository(UnitConversion)
    private readonly unitConversionRepository: Repository<UnitConversion>,
  ) {}

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
