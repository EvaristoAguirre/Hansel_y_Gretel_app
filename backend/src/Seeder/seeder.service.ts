import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UnitConversion } from 'src/UnitOfMeasure/unitConversion.entity';
import { UnitOfMeasure } from 'src/UnitOfMeasure/unitOfMesure.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(UnitOfMeasure)
    private readonly unitOfMeasureRepository: Repository<UnitOfMeasure>,
    @InjectRepository(UnitConversion)
    private readonly unitConversionRepository: Repository<UnitConversion>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedUnitsOfMeasure();
  }

  private async seedUnitsOfMeasure() {
    const units = await this.unitOfMeasureRepository.find();
    if (units.length === 0) {
      const defaultUnits = [
        {
          name: 'Kilogramo',
          abbreviation: 'kg',
          isConventional: true,
          isBase: true,
          conversions: [
            { toUnitName: 'Gramo', conversionFactor: 1000 },
            { toUnitName: 'Miligramo', conversionFactor: 1e6 },
          ],
        },
        {
          name: 'Gramo',
          abbreviation: 'g',
          isConventional: true,
          baseUnit: 'Kilogramo',
          equivalenceToBaseUnit: 0.001,
        },
        {
          name: 'Miligramo',
          abbreviation: 'mg',
          isConventional: true,
          baseUnit: 'Kilogramo',
          equivalenceToBaseUnit: 0.000001,
        },
        {
          name: 'Litro',
          abbreviation: 'L',
          isConventional: true,
          isBase: true,
          conversions: [
            { toUnitName: 'Mililitro', conversionFactor: 1000 },
            { toUnitName: 'Centímetro cúbico', conversionFactor: 1000 },
          ],
        },
        {
          name: 'Mililitro',
          abbreviation: 'ml',
          isConventional: true,
          baseUnit: 'Litro',
          equivalenceToBaseUnit: 0.001,
        },
        {
          name: 'Centímetro cúbico',
          abbreviation: 'cm³',
          isConventional: true,
          baseUnit: 'Litro',
          equivalenceToBaseUnit: 0.001,
        },
        {
          name: 'Unidad',
          abbreviation: 'u',
          isConventional: true,
          isBase: true,
        },
      ];

      const savedUnits = await this.unitOfMeasureRepository.save(
        defaultUnits.map((unit) => ({
          name: unit.name,
          abbreviation: unit.abbreviation,
          isConventional: unit.isConventional,
          equivalenceToBaseUnit: unit.equivalenceToBaseUnit || null,
          baseUnitId: null,
          isBase: unit.isBase || false,
          isActive: true,
        })),
      );

      for (const unit of savedUnits) {
        const unitData = defaultUnits.find((u) => u.name === unit.name);

        if (unitData.baseUnit) {
          const baseUnit = savedUnits.find((u) => u.name === unitData.baseUnit);
          if (!baseUnit) {
            throw new Error(
              `Base unit ${unitData.baseUnit} not found for ${unit.name}`,
            );
          }
          unit.baseUnitId = baseUnit.id;
          await this.unitOfMeasureRepository.save(unit);
        }

        if (unitData.conversions) {
          for (const conversion of unitData.conversions) {
            const toUnit = savedUnits.find(
              (u) => u.name === conversion.toUnitName,
            );
            if (!toUnit) {
              throw new Error(
                `Target unit ${conversion.toUnitName} not found for conversion from ${unit.name}`,
              );
            }

            await this.unitConversionRepository.save({
              fromUnit: { id: unit.id },
              toUnit: { id: toUnit.id },
              conversionFactor: conversion.conversionFactor,
            });
          }
        }
      }

      console.log('Unidades de medida y conversiones sembradas correctamente.');
    }
  }
}
