import { UnitOfMeasure } from './unitOfMesure.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, ILike, In, Raw, Repository } from 'typeorm';
import { UnitConversion } from './unitConversion.entity';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateEspecialUnitOfMeasureDto,
  CreateUnitConversionDto,
} from 'src/DTOs/create-unit.dto';
import { UpdateUnitOfMeasureDto } from 'src/DTOs/update-unit.dto';
import {
  EspecialUnitMeasureResponseDto,
  UnitOfMeasureSummaryResponseDto,
} from 'src/DTOs/unitOfMeasureSummaryResponse.dto';
import { isUUID } from 'class-validator';

@Injectable()
export class UnitOfMeasureRepository {
  constructor(
    @InjectRepository(UnitOfMeasure)
    private readonly unitOfMeasureRepository: Repository<UnitOfMeasure>,
    @InjectRepository(UnitConversion)
    private readonly unitConversionRepository: Repository<UnitConversion>,
    private readonly dataSource: DataSource,
  ) {}

  // ---------------   estandarizada con el nuevo dto
  async createUnitOfMeasure(
    createData: CreateEspecialUnitOfMeasureDto,
  ): Promise<UnitOfMeasureSummaryResponseDto> {
    const { name, abbreviation, conversions } = createData;

    if (!name) {
      throw new BadRequestException('Name must be provided');
    }

    const [existingUnitByName, existingUnitByAbbreviation] = await Promise.all([
      this.unitOfMeasureRepository.findOne({ where: { name } }),
      abbreviation
        ? this.unitOfMeasureRepository.findOne({ where: { abbreviation } })
        : null,
    ]);

    if (existingUnitByName)
      throw new ConflictException('Unit name already exists');
    if (existingUnitByAbbreviation)
      throw new ConflictException('Abbreviation already exists');

    const unitOfMeasure = this.unitOfMeasureRepository.create({
      name,
      abbreviation,
      isConventional: false,
      isActive: true,
    });

    if (conversions?.length > 0) {
      const conversionUnitIds = conversions.map((c) => c.toUnitId);

      const referencedUnits = await this.unitOfMeasureRepository.find({
        where: { id: In(conversionUnitIds) },
        relations: ['baseUnit'],
      });

      const volumeUnits = ['Litro', 'Mililitro', 'Centímetro cúbico'];
      const massUnits = ['Kilogramo', 'Gramo', 'Miligramo'];

      const hasVolume = referencedUnits.some((u) =>
        volumeUnits.includes(u.name),
      );
      const hasMass = referencedUnits.some((u) => massUnits.includes(u.name));

      if (hasVolume && hasMass) {
        throw new BadRequestException(
          'No se pueden mezclar unidades de volumen y masa',
        );
      }

      if (!hasVolume && !hasMass) {
        throw new BadRequestException(
          'Las conversiones deben ser a unidades de volumen o masa',
        );
      }

      // Detectar la base unit desde la conversión
      const targetConversion = conversions[0];
      const targetUnit = referencedUnits.find(
        (u) => u.id === targetConversion.toUnitId,
      );

      if (!targetUnit) {
        throw new NotFoundException('Unidad de destino no encontrada');
      }

      let baseUnit: UnitOfMeasure | null = null;
      let equivalenceToBaseUnit: number | null = null;

      if (targetUnit.name === 'Litro' || targetUnit.name === 'Kilogramo') {
        // Caso 1: la conversión es directamente a la base
        baseUnit = targetUnit;
        equivalenceToBaseUnit = targetConversion.conversionFactor / 1; // ya es base
      } else if (targetUnit.baseUnit) {
        // Caso 2: la conversión es a un submúltiplo
        baseUnit = targetUnit.baseUnit;
        equivalenceToBaseUnit =
          targetConversion.conversionFactor *
          (targetUnit.equivalenceToBaseUnit || 1); // escalamos a base
      } else {
        throw new BadRequestException(
          `No se pudo determinar la unidad base para la conversión hacia ${targetUnit.name}`,
        );
      }

      unitOfMeasure.baseUnit = baseUnit;
      unitOfMeasure.equivalenceToBaseUnit = equivalenceToBaseUnit;

      console.log(
        `Asignada base: ${baseUnit.name} | Equivalencia: ${equivalenceToBaseUnit}`,
      );
    }

    const savedUnit = await this.unitOfMeasureRepository.save(unitOfMeasure);

    if (conversions?.length > 0) {
      await this.handleConversions(savedUnit, conversions);
    }

    const fullUnit = await this.unitOfMeasureRepository.findOne({
      where: { id: savedUnit.id },
      relations: [
        'baseUnit',
        'fromConversions',
        'toConversions',
        'fromConversions.toUnit',
        'toConversions.fromUnit',
      ],
    });

    return this.mapUnitWithConversions(fullUnit);
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
        relations: ['baseUnit', 'fromConversions', 'fromConversions.toUnit'],
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
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
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

  async getUnitsOfVolume(): Promise<EspecialUnitMeasureResponseDto[]> {
    try {
      const units = await this.unitOfMeasureRepository.find({
        where: {
          baseUnit: { name: ILike('%Litro%') },
        },
        relations: ['baseUnit'],
        select: {
          id: true,
          name: true,
          abbreviation: true,
          baseUnit: { id: true, name: true, abbreviation: true },
        },
      });

      return units.map((unit) => ({
        id: unit.id,
        name: unit.name,
        abbreviation: unit.abbreviation,
        baseUnit: unit.baseUnit
          ? {
              id: unit.baseUnit.id,
              name: unit.baseUnit.name,
              abbreviation: unit.baseUnit.abbreviation,
            }
          : null,
      }));
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        'Error fetching units',
        error.message,
      );
    }
  }

  async getUnitsOfMass(): Promise<EspecialUnitMeasureResponseDto[]> {
    try {
      const units = await this.unitOfMeasureRepository.find({
        where: { baseUnit: { name: ILike('%Kilogramo%') } },
        relations: ['baseUnit'],
        select: {
          id: true,
          name: true,
          abbreviation: true,
          baseUnit: { id: true, name: true, abbreviation: true },
        },
      });

      return units.map((unit) => ({
        id: unit.id,
        name: unit.name,
        abbreviation: unit.abbreviation,
        baseUnit: unit.baseUnit
          ? {
              id: unit.baseUnit.id,
              name: unit.baseUnit.name,
              abbreviation: unit.baseUnit.abbreviation,
            }
          : null,
      }));
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        'Error fetching units',
        error.message,
      );
    }
  }
  async getUnitOfUnit(): Promise<EspecialUnitMeasureResponseDto[]> {
    try {
      const units = await this.unitOfMeasureRepository.find({
        where: { baseUnit: { name: ILike('%Unidad%') } },
        relations: ['baseUnit'],
        select: {
          id: true,
          name: true,
          abbreviation: true,
          baseUnit: { id: true, name: true, abbreviation: true },
        },
      });

      return units.map((unit) => ({
        id: unit.id,
        name: unit.name,
        abbreviation: unit.abbreviation,
        baseUnit: unit.baseUnit
          ? {
              id: unit.baseUnit.id,
              name: unit.baseUnit.name,
              abbreviation: unit.baseUnit.abbreviation,
            }
          : null,
      }));
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        'Error fetching units',
        error.message,
      );
    }
  }

  // ---------------   estandarizada con el nuevo dto
  async updateUnitOfMeasure(
    id: string,
    updateData: UpdateUnitOfMeasureDto,
  ): Promise<UnitOfMeasureSummaryResponseDto> {
    if (!id || !isUUID(id)) {
      throw new BadRequestException('Valid UUID must be provided as ID.');
    }

    const { name, abbreviation, conversions } = updateData;

    const existingUnit = await this.unitOfMeasureRepository.findOne({
      where: { id },
      relations: ['fromConversions', 'toConversions'],
    });

    if (!existingUnit) {
      throw new NotFoundException('Unit of measure not found');
    }

    if (name && name !== existingUnit.name) {
      const unitWithSameName = await this.unitOfMeasureRepository.findOne({
        where: { name },
      });
      if (unitWithSameName) {
        throw new ConflictException('Unit of measure name already exists');
      }
    }

    if (abbreviation && abbreviation !== existingUnit.abbreviation) {
      const unitWithSameAbbreviation =
        await this.unitOfMeasureRepository.findOne({
          where: { abbreviation },
        });
      if (unitWithSameAbbreviation) {
        throw new ConflictException('Abbreviation already exists');
      }
    }

    if (name) existingUnit.name = name;
    if (abbreviation) existingUnit.abbreviation = abbreviation;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (conversions?.length > 0) {
        const conversionUnitIds = conversions.map((c) => c.toUnitId);

        const referencedUnits = await this.unitOfMeasureRepository.find({
          where: { id: In(conversionUnitIds) },
          relations: ['baseUnit'],
        });

        const targetConversion = conversions[0];
        const targetUnit = referencedUnits.find(
          (u) => u.id === targetConversion.toUnitId,
        );

        if (!targetUnit) {
          throw new NotFoundException('Unidad de destino no encontrada');
        }

        let baseUnit: UnitOfMeasure | null = null;
        let equivalenceToBaseUnit: number | null = null;

        if (targetUnit.name === 'Litro' || targetUnit.name === 'Kilogramo') {
          baseUnit = targetUnit;
          equivalenceToBaseUnit = targetConversion.conversionFactor / 1;
        } else if (targetUnit.baseUnit) {
          baseUnit = targetUnit.baseUnit;
          equivalenceToBaseUnit =
            targetConversion.conversionFactor *
            (targetUnit.equivalenceToBaseUnit || 1);
        } else {
          throw new BadRequestException(
            `No se pudo determinar la unidad base para la conversión hacia ${targetUnit.name}`,
          );
        }

        existingUnit.baseUnit = baseUnit;
        existingUnit.equivalenceToBaseUnit = equivalenceToBaseUnit;
      }

      const updatedUnit = await queryRunner.manager.save(existingUnit);

      if (conversions) {
        await queryRunner.manager.delete(UnitConversion, [
          ...(existingUnit.fromConversions?.map((c) => c.id) || []),
          ...(existingUnit.toConversions?.map((c) => c.id) || []),
        ]);
        await this.handleConversionsManager(
          updatedUnit,
          conversions,
          queryRunner.manager,
        );
      }

      await queryRunner.commitTransaction();

      const unitWithRelations = await this.unitOfMeasureRepository.findOne({
        where: { id: updatedUnit.id },
        relations: [
          'baseUnit',
          'fromConversions',
          'toConversions',
          'fromConversions.toUnit',
          'toConversions.fromUnit',
        ],
      });

      return this.mapUnitWithConversions(unitWithRelations);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error updating the unit of measure',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async convertUnit(
    fromUnitId: string,
    toUnitId: string,
    quantity: number,
    visited: Set<string> = new Set(),
  ): Promise<number> {
    const conversionKey = `${fromUnitId}-${toUnitId}`;
    if (visited.has(conversionKey)) {
      throw new BadRequestException('Circular unit conversion detected');
    }
    visited.add(conversionKey);
    if (!isUUID(fromUnitId) && !isUUID(toUnitId)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
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

    // if (fromUnit?.baseUnit?.id === toUnitId) {
    //   return quantity * (fromUnit.equivalenceToBaseUnit || 1);
    // }

    // if (toUnit?.baseUnit?.id === fromUnitId) {
    //   return quantity / (toUnit.equivalenceToBaseUnit || 1);
    // }

    if (fromUnit?.baseUnit?.id === toUnitId) {
      if (
        !fromUnit.equivalenceToBaseUnit ||
        fromUnit.equivalenceToBaseUnit <= 0
      ) {
        throw new BadRequestException(
          `Unidad ${fromUnit.name} no tiene equivalencia válida hacia su base ${toUnit.name}`,
        );
      }
      return quantity * fromUnit.equivalenceToBaseUnit;
    }
    if (fromUnit?.baseUnit?.id === fromUnitId) {
      if (
        !fromUnit.equivalenceToBaseUnit ||
        fromUnit.equivalenceToBaseUnit <= 0
      ) {
        throw new BadRequestException(
          `Unidad ${fromUnit.name} no tiene equivalencia válida hacia su base ${fromUnit.name}`,
        );
      }
      return quantity * toUnit.equivalenceToBaseUnit;
    }

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
          true,
          visited,
        );
      }

      if (toUnit.baseUnit) {
        return await this.convertViaIntermediateUnit(
          fromUnitId,
          toUnitId,
          quantity,
          toUnit.baseUnit.id,
          true,
          visited,
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

  async convertUnitWithDetails(
    fromUnitId: string,
    toUnitId: string,
    quantity: number,
    visited: Set<string> = new Set(),
  ): Promise<{
    convertedQuantity: number;
    originalQuantity: number;
    originalUnit: UnitOfMeasure;
    targetUnit: UnitOfMeasure;
  }> {
    const fromUnit = await this.getUnitWithRelations(fromUnitId);
    const toUnit = await this.getUnitWithRelations(toUnitId);

    const convertedQuantity = await this.convertUnit(
      fromUnitId,
      toUnitId,
      quantity,
      visited,
    );

    return {
      convertedQuantity,
      originalQuantity: quantity,
      originalUnit: fromUnit,
      targetUnit: toUnit,
    };
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
    visited: Set<string>,
  ) {
    if (inverse) {
      const toIntermediate = await this.convertUnit(
        toUnitId,
        intermediateUnitId,
        1,
        new Set(visited),
      );
      return (
        (await this.convertUnit(
          fromUnitId,
          intermediateUnitId,
          quantity,
          new Set(visited),
        )) / toIntermediate
      );
    }
    const toBase = await this.convertUnit(
      fromUnitId,
      intermediateUnitId,
      quantity,
      new Set(visited),
    );
    return this.convertUnit(
      intermediateUnitId,
      toUnitId,
      toBase,
      new Set(visited),
    );
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
    const allConversions = [
      ...(unit.fromConversions || []).map((c) => ({
        direction: 'from',
        unit: c.toUnit,
        factor: Number(c.conversionFactor),
      })),
    ];

    const relatedBaseUnit = unit.baseUnit;
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
            factor: Number(unit.equivalenceToBaseUnit),
          }
        : null,
    };
  }

  private async handleConversionsManager(
    fromUnit: UnitOfMeasure,
    conversions: CreateUnitConversionDto[],
    entityManager: EntityManager,
  ): Promise<void> {
    for (const conversion of conversions) {
      const { toUnitId, conversionFactor } = conversion;

      // Validar factor de conversión
      if (conversionFactor <= 0) {
        throw new BadRequestException(
          'Conversion factor must be greater than 0',
        );
      }

      // Verificar que la unidad de destino exista
      const toUnit = await entityManager.findOne(UnitOfMeasure, {
        where: { id: toUnitId },
      });

      if (!toUnit) {
        throw new BadRequestException(`Unit with ID ${toUnitId} not found`);
      }
      // Crear conversión en ambas direcciones
      const unitConversion = entityManager.create(UnitConversion, {
        fromUnit,
        toUnit,
        conversionFactor,
      });

      const inverseConversion = entityManager.create(UnitConversion, {
        fromUnit: toUnit,
        toUnit: fromUnit,
        conversionFactor: 1 / conversionFactor,
      });

      await entityManager.save([unitConversion, inverseConversion]);
    }
  }

  async deleteUnitOfMeasure(id: string) {
    if (!id) {
      throw new BadRequestException('ID must be provided.');
    }
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
    const unit = await this.unitOfMeasureRepository.findOne({
      where: { id },
    });

    if (!unit) {
      throw new NotFoundException('Unit of measure not found');
    }

    await this.unitOfMeasureRepository.update(id, { isActive: false });

    return 'Unit of measure successfully deleted';
  }

  async searchUnit(
    name?: string,
    abbreviation?: string,
  ): Promise<UnitOfMeasure[]> {
    try {
      if (!name && !abbreviation) {
        throw new BadRequestException(
          'At least a name or a code must be provided for search.',
        );
      }

      const whereConditions: any = {};
      if (name) {
        whereConditions.name = ILike(`%${name}%`);
      } else if (abbreviation) {
        whereConditions.abbreviation = Raw(
          (alias) => `CAST(${alias} AS TEXT) ILIKE :abbreviation`,
          {
            abbreviation: `%${abbreviation}%`,
          },
        );
      }

      const [units] = await this.unitOfMeasureRepository.findAndCount({
        where: whereConditions,
      });

      if (units.length === 0) {
        const searchCriteria = name ? `name: ${name}` : `code: ${abbreviation}`;
        throw new NotFoundException(`No units found with ${searchCriteria}`);
      }

      return units;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error fetching the products',
        error.message,
      );
    }
  }

  async getUnitOfMeasureUnidad(): Promise<UnitOfMeasure> {
    try {
      const unitOfMeasure = await this.unitOfMeasureRepository.findOne({
        where: { name: 'Unidad' },
      });
      if (!unitOfMeasure) {
        throw new NotFoundException(`Unit of mesure not found`);
      }
      return unitOfMeasure;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error fetching the unit of mesure',
        error.message,
      );
    }
  }
}
