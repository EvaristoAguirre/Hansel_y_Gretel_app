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
          baseUnit: null,
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
          conversions: [
            { toUnitName: 'Kilogramo', conversionFactor: 0.001 },
            { toUnitName: 'Miligramo', conversionFactor: 1000 },
          ],
        },
        {
          name: 'Miligramo',
          abbreviation: 'mg',
          isConventional: true,
          baseUnit: 'Kilogramo',
          conversions: [
            { toUnitName: 'Kilogramo', conversionFactor: 0.000001 },
            { toUnitName: 'Gramo', conversionFactor: 0.001 },
          ],
        },
        {
          name: 'Litro',
          abbreviation: 'L',
          isConventional: true,
          baseUnit: null,
          conversions: [
            { toUnitName: 'Mililitro', conversionFactor: 1000 },
            { toUnitName: 'Centímetro cúbico', conversionFactor: 1000 },
            { toUnitName: 'Decímetro cúbico', conversionFactor: 1 },
          ],
        },
        {
          name: 'Mililitro',
          abbreviation: 'ml',
          isConventional: true,
          baseUnit: 'Litro',
          conversions: [
            { toUnitName: 'Litro', conversionFactor: 0.001 },
            { toUnitName: 'Centímetro cúbico', conversionFactor: 1 },
            { toUnitName: 'Decímetro cúbico', conversionFactor: 0.001 },
          ],
        },
        {
          name: 'Centímetro cúbico',
          abbreviation: 'cm³',
          isConventional: true,
          baseUnit: 'Litro',
          conversions: [
            { toUnitName: 'Litro', conversionFactor: 0.001 },
            { toUnitName: 'Mililitro', conversionFactor: 1 },
            { toUnitName: 'Decímetro cúbico', conversionFactor: 0.001 },
          ],
        },
        {
          name: 'Decímetro cúbico',
          abbreviation: 'dm³',
          isConventional: true,
          baseUnit: 'Litro',
          conversions: [
            { toUnitName: 'Litro', conversionFactor: 1 },
            { toUnitName: 'Mililitro', conversionFactor: 1000 },
            { toUnitName: 'Centímetro cúbico', conversionFactor: 1000 },
          ],
        },
        {
          name: 'Unidad',
          abbreviation: 'u',
          isConventional: true,
          baseUnit: null,
          conversions: [],
        },
      ];

      const savedUnits = await this.unitOfMeasureRepository.save(
        defaultUnits.map((unit) => ({
          name: unit.name,
          abbreviation: unit.abbreviation,
          isConventional: unit.isConventional,
          baseUnitId: null,
        })),
      );

      for (const unit of savedUnits) {
        const unitData = defaultUnits.find((u) => u.name === unit.name);

        if (unitData.baseUnit) {
          const baseUnit = savedUnits.find((u) => u.name === unitData.baseUnit);
          if (baseUnit) {
            unit.baseUnitId = baseUnit.id;
            await this.unitOfMeasureRepository.save(unit);
          }
        }

        for (const conversion of unitData.conversions) {
          const toUnit = savedUnits.find(
            (u) => u.name === conversion.toUnitName,
          );
          if (toUnit) {
            await this.unitConversionRepository.save({
              fromUnit: unit,
              toUnit,
              conversionFactor: conversion.conversionFactor,
            });
          }
        }
      }

      console.log('Unidades de medida y conversiones sembradas correctamente.');
    }
  }
}
