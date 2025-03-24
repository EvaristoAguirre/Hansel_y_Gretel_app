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
    console.log(
      `Iniciando conversión: ${fromUnitId} -> ${toUnitId}, cantidad: ${quantity}`,
    );

    if (fromUnitId === toUnitId) {
      console.log('Las unidades son iguales, retornando cantidad original');
      return quantity;
    }

    // 1. Buscar conversión directa
    console.log('Buscando conversión directa...');
    const directConversion = await this.unitConversionRepository.findOne({
      where: [
        { fromUnit: { id: fromUnitId }, toUnit: { id: toUnitId } },
        { fromUnit: { id: toUnitId }, toUnit: { id: fromUnitId } },
      ],
      relations: ['fromUnit', 'toUnit'],
    });
    if (directConversion) {
      console.log('Conversión directa encontrada:', directConversion);
      const result =
        directConversion.fromUnit.id === fromUnitId
          ? quantity * directConversion.conversionFactor
          : quantity / directConversion.conversionFactor;
      console.log(`Resultado conversión directa: ${result}`);
      return result;
    }

    // 2. Obtener información de las unidades
    const [fromUnit, toUnit] = await Promise.all([
      this.getUnitWithRelations(fromUnitId),
      this.getUnitWithRelations(toUnitId),
    ]);

    if (!fromUnit || !toUnit) {
      throw new NotFoundException('One or both units not found.');
    }

    console.log('Unidad origen:', fromUnit);
    console.log('Unidad destino:', toUnit);

    // 3. Verificar misma unidad base
    if (this.haveSameBaseUnit(fromUnit, toUnit)) {
      try {
        const result = this.convertViaBaseUnit(fromUnit, toUnit, quantity);
        return result;
      } catch (e) {
        console.error('Error en conversión por base:', e.message);
        throw e;
      }
    }

    // 4. Intentar conversión a través de unidades base
    try {
      if (fromUnit.baseUnit) {
        console.log(
          `Convirtiendo a través de base unit (${fromUnit.baseUnit.id})`,
        );
        return await this.convertViaIntermediateUnit(
          fromUnitId,
          toUnitId,
          quantity,
          fromUnit.baseUnit.id,
        );
      }

      if (toUnit.baseUnit) {
        console.log(
          `Convirtiendo a través de base unit destino (${toUnit.baseUnit.id})`,
        );
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
      // Continuar con el siguiente enfoque
    }

    // 5. Último intento
    console.log('No se encontró ruta de conversión directa');
    throw new BadRequestException(
      `No conversion path found between ${fromUnit.name} and ${toUnit.name}`,
    );
  }

  // Métodos auxiliares (podrían estar en el mismo servicio):

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

  private async findConversionPath(fromUnitId: string, toUnitId: string) {
    console.log('fromUnitId', fromUnitId);
    console.log('toUnitId', toUnitId);
  }
}
