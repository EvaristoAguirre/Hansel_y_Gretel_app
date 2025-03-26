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
import {
  CreateEspecialUnitOfMeasureDto,
  CreateUnitConversionDto,
} from 'src/DTOs/create-unit.dto';
import { UpdateUnitOfMeasureDto } from 'src/DTOs/update-unit.dto';
import { UnitOfMeasureSummaryResponseDto } from 'src/DTOs/unitOfMeasureSummaryResponse.dto';

@Injectable()
export class UnitOfMeasureRepository {
  constructor(
    @InjectRepository(UnitOfMeasure)
    private readonly unitOfMeasureRepository: Repository<UnitOfMeasure>,
    @InjectRepository(UnitConversion)
    private readonly unitConversionRepository: Repository<UnitConversion>,
  ) {}

  async createUnitOfMeasure(
    createData: CreateEspecialUnitOfMeasureDto,
  ): Promise<UnitOfMeasure> {
    const { name, abbreviation, conversions } = createData;

    // Validaciones básicas
    if (!name) {
      throw new BadRequestException('Name must be provided');
    }

    // Verificar si la unidad ya existe por nombre
    const existingUnitByName = await this.unitOfMeasureRepository.findOne({
      where: { name },
    });

    if (existingUnitByName) {
      throw new ConflictException('Unit of measure name already exists');
    }

    // Verificar si la abreviatura ya existe
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

    // Crear la nueva unidad de medida
    const unitOfMeasure = this.unitOfMeasureRepository.create({
      name,
      abbreviation,
      isConventional: false, // Las unidades especiales no son convencionales
    });

    const savedUnitOfMeasure =
      await this.unitOfMeasureRepository.save(unitOfMeasure);

    // Manejar las conversiones si se proporcionaron
    if (conversions && conversions.length > 0) {
      await this.handleConversions(savedUnitOfMeasure, conversions);
    }

    return savedUnitOfMeasure;
  }

  // ---------------   estandarizada con el nuevo dto
  async getAllUnitOfMeasure(
    pageNumber: number,
    limitNumber: number,
  ): Promise<UnitOfMeasureSummaryResponseDto[]> {
    if (pageNumber <= 0 || limitNumber <= 0) {
      throw new BadRequestException(
        'Page and limit must be positive integers.',
      );
    }

    try {
      const units = await this.unitOfMeasureRepository.find({
        where: { isActive: true },
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        relations: [
          'baseUnit',
          'fromConversions',
          'toConversions',
          'fromConversions.toUnit',
          'toConversions.fromUnit',
        ],
        order: { isConventional: 'DESC', name: 'ASC' },
      });

      return units.map((unit) => this.mapUnitWithConversions(unit));
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        'Error fetching units',
        error.message,
      );
    }
  }

  // ---------------   estandarizada con el nuevo dto
  async getConventionalUnitOfMeasure(
    pageNumber: number,
    limitNumber: number,
  ): Promise<UnitOfMeasureSummaryResponseDto[]> {
    if (pageNumber <= 0 || limitNumber <= 0) {
      throw new BadRequestException(
        'Page and limit must be positive integers.',
      );
    }
    try {
      const units = await this.unitOfMeasureRepository.find({
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
        order: { isConventional: 'DESC', name: 'ASC' },
      });
      return units.map((unit) => this.mapUnitWithConversions(unit));
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        'Error fetching orders',
        error.message,
      );
    }
  }

  // ---------------   estandarizada con el nuevo dto
  async getNotConventionalUnitOfMeasure(
    pageNumber: number,
    limitNumber: number,
  ): Promise<UnitOfMeasureSummaryResponseDto[]> {
    if (pageNumber <= 0 || limitNumber <= 0) {
      throw new BadRequestException(
        'Page and limit must be positive integers.',
      );
    }
    try {
      const units = await this.unitOfMeasureRepository.find({
        where: { isConventional: false, isActive: true },
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        relations: [
          'baseUnit',
          'fromConversions',
          'toConversions',
          'fromConversions.toUnit',
          'toConversions.fromUnit',
        ],
        order: { isConventional: 'DESC', name: 'ASC' },
      });

      return units.map((unit) => this.mapUnitWithConversions(unit));
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
      where: [
        { fromUnit: { id: fromUnitId }, toUnit: { id: toUnitId } },
        { fromUnit: { id: toUnitId }, toUnit: { id: fromUnitId } },
      ],
      relations: ['fromUnit', 'toUnit'],
    });
    if (directConversion) {
      const result =
        directConversion.fromUnit.id === fromUnitId
          ? quantity * directConversion.conversionFactor
          : quantity / directConversion.conversionFactor;
      return result;
    }

    const [fromUnit, toUnit] = await Promise.all([
      this.getUnitWithRelations(fromUnitId),
      this.getUnitWithRelations(toUnitId),
    ]);

    if (!fromUnit || !toUnit) {
      throw new NotFoundException('One or both units not found.');
    }

    if (this.haveSameBaseUnit(fromUnit, toUnit)) {
      try {
        const result = this.convertViaBaseUnit(fromUnit, toUnit, quantity);
        return result;
      } catch (e) {
        console.error('Error en conversión por base:', e.message);
        throw e;
      }
    }

    try {
      if (fromUnit.baseUnit) {
        return await this.convertViaIntermediateUnit(
          fromUnitId,
          toUnitId,
          quantity,
          fromUnit.baseUnit.id,
        );
      }

      if (toUnit.baseUnit) {
        return await this.convertViaIntermediateUnit(
          fromUnitId,
          toUnitId,
          quantity,
          toUnit.baseUnit.id,
          true,
        );
      }
    } catch (e) {
      console.error('Error en conversión intermedia:', e.message);
    }

    // 5. Último intento
    console.log('No se encontró ruta de conversión directa');
    throw new BadRequestException(
      `No conversion path found between ${fromUnit.name} and ${toUnit.name}`,
    );
  }

  private async findDirectConversion(fromUnitId: string, toUnitId: string) {
    return this.unitConversionRepository.findOne({
      where: [
        { fromUnit: { id: fromUnitId }, toUnit: { id: toUnitId } },
        { fromUnit: { id: toUnitId }, toUnit: { id: fromUnitId } },
      ],
    });
  }

  private async getUnitWithRelations(unitId: string) {
    return this.unitOfMeasureRepository.findOne({
      where: { id: unitId },
      relations: ['baseUnit'],
    });
  }

  private haveSameBaseUnit(fromUnit: UnitOfMeasure, toUnit: UnitOfMeasure) {
    return (
      fromUnit.baseUnit?.id === toUnit.baseUnit?.id &&
      fromUnit.baseUnit &&
      toUnit.baseUnit &&
      fromUnit.equivalenceToBaseUnit &&
      toUnit.equivalenceToBaseUnit
    );
  }

  private convertViaBaseUnit(
    fromUnit: UnitOfMeasure,
    toUnit: UnitOfMeasure,
    quantity: number,
  ) {
    if (!fromUnit.equivalenceToBaseUnit || !toUnit.equivalenceToBaseUnit) {
      throw new BadRequestException(
        'Both units must have equivalence to base unit defined',
      );
    }
    return (
      (quantity * fromUnit.equivalenceToBaseUnit) / toUnit.equivalenceToBaseUnit
    );
  }

  private async convertViaIntermediateUnit(
    fromUnitId: string,
    toUnitId: string,
    quantity: number,
    intermediateUnitId: string,
    inverse = false,
  ) {
    if (inverse) {
      const toIntermediate = await this.convertUnit(
        toUnitId,
        intermediateUnitId,
        1,
      );
      return (
        (await this.convertUnit(fromUnitId, intermediateUnitId, quantity)) /
        toIntermediate
      );
    }
    const toBase = await this.convertUnit(
      fromUnitId,
      intermediateUnitId,
      quantity,
    );
    return this.convertUnit(intermediateUnitId, toUnitId, toBase);
  }

  async findConversionUnit() {
    const allConversion = await this.unitConversionRepository.find();
    return allConversion;
  }

  private async handleConversions(
    fromUnit: UnitOfMeasure,
    conversions: CreateUnitConversionDto[],
  ): Promise<void> {
    for (const conversion of conversions) {
      const { toUnitId, conversionFactor } = conversion;

      // Validar el factor de conversión
      if (conversionFactor <= 0) {
        throw new BadRequestException(
          'Conversion factor must be greater than 0',
        );
      }

      // Verificar que la unidad de destino exista
      const toUnit = await this.unitOfMeasureRepository.findOne({
        where: { id: toUnitId },
      });

      if (!toUnit) {
        throw new BadRequestException(`Unit with ID ${toUnitId} not found`);
      }

      // Verificar que no exista ya una conversión entre estas unidades
      const existingConversion = await this.unitConversionRepository.findOne({
        where: [
          { fromUnit: { id: fromUnit.id }, toUnit: { id: toUnit.id } },
          { fromUnit: { id: toUnit.id }, toUnit: { id: fromUnit.id } },
        ],
      });

      if (existingConversion) {
        throw new ConflictException(
          `Conversion between these units already exists`,
        );
      }

      // Crear la conversión en ambas direcciones
      const unitConversion = this.unitConversionRepository.create({
        fromUnit,
        toUnit,
        conversionFactor,
      });

      const inverseConversion = this.unitConversionRepository.create({
        fromUnit: toUnit,
        toUnit: fromUnit,
        conversionFactor: 1 / conversionFactor,
      });

      await this.unitConversionRepository.save([
        unitConversion,
        inverseConversion,
      ]);
    }
  }

  private mapUnitWithConversions(
    unit: UnitOfMeasure,
  ): UnitOfMeasureSummaryResponseDto {
    // Obtener todas las conversiones relacionadas
    const allConversions = [
      ...(unit.fromConversions || []).map((c) => ({
        direction: 'from',
        unit: c.toUnit,
        factor: c.conversionFactor,
      })),
      ...(unit.toConversions || []).map((c) => ({
        direction: 'to',
        unit: c.fromUnit,
        factor: c.conversionFactor,
      })),
    ];

    // Encontrar la unidad base relacionada (ya sea directa o a través de conversiones)
    let relatedBaseUnit = unit.baseUnit;
    // eslint-disable-next-line prefer-const
    let conversionPath = [];

    if (!relatedBaseUnit && !unit.isConventional) {
      // Para unidades especiales, buscar conexión con unidades convencionales
      const conventionalConversion = allConversions.find(
        (c) => c.unit.isConventional,
      );

      if (conventionalConversion) {
        relatedBaseUnit = conventionalConversion.unit;
        conversionPath.push({
          unit: conventionalConversion.unit.name,
          factor:
            conventionalConversion.direction === 'from'
              ? conventionalConversion.factor
              : 1 / conventionalConversion.factor,
        });
      }
    }

    return {
      id: unit.id,
      name: unit.name,
      abbreviation: unit.abbreviation,
      isActive: unit.isActive,
      isConventional: unit.isConventional,
      isBase: unit.isBase,
      baseUnit: relatedBaseUnit
        ? {
            id: relatedBaseUnit.id,
            name: relatedBaseUnit.name,
            abbreviation: relatedBaseUnit.abbreviation,
          }
        : null,
      conversions: allConversions.map((c) => ({
        toUnitId: c.unit.id,
        unitName: c.unit.name,
        unitAbbreviation: c.unit.abbreviation,
        conversionFactor: c.direction === 'from' ? c.factor : 1 / c.factor,
        direction: c.direction,
      })),
      toBaseConversion: relatedBaseUnit
        ? {
            unitId: relatedBaseUnit.id,
            unitName: relatedBaseUnit.name,
            factor: conversionPath.reduce(
              (total, step) => total * parseFloat(step.factor.toString()),
              1,
            ),
          }
        : null,
    };
  }
}
