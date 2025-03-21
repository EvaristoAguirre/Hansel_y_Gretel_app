import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UnitConversion } from 'src/Ingredient/unitConversion.entity';
import { UnitOfMeasure } from 'src/Ingredient/unitOfMesure.entity';
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
          baseUnit: null, // No tiene unidad base
          conversions: [
            { toUnitName: 'Gramo', conversionFactor: 1000 },
            { toUnitName: 'Miligramo', conversionFactor: 1e6 },
          ],
        },
        {
          name: 'Gramo',
          abbreviation: 'g',
          isConventional: true,
          baseUnit: 'Kilogramo', // Unidad base es el kilogramo
          conversions: [
            { toUnitName: 'Kilogramo', conversionFactor: 0.001 },
            { toUnitName: 'Miligramo', conversionFactor: 1000 },
          ],
        },
        {
          name: 'Miligramo',
          abbreviation: 'mg',
          isConventional: true,
          baseUnit: 'Kilogramo', // Unidad base es el kilogramo
          conversions: [
            { toUnitName: 'Kilogramo', conversionFactor: 0.000001 },
            { toUnitName: 'Gramo', conversionFactor: 0.001 },
          ],
        },
        {
          name: 'Litro',
          abbreviation: 'L',
          isConventional: true,
          baseUnit: null, // No tiene unidad base
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
          baseUnit: 'Litro', // Unidad base es el litro
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
          baseUnit: 'Litro', // Unidad base es el litro
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
          baseUnit: 'Litro', // Unidad base es el litro
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
          baseUnit: null, // No tiene unidad base
          conversions: [], // No tiene conversiones
        },
      ];

      // Paso 1: Guardar las unidades de medida sin baseUnitId
      const savedUnits = await this.unitOfMeasureRepository.save(
        defaultUnits.map((unit) => ({
          name: unit.name,
          abbreviation: unit.abbreviation,
          isConventional: unit.isConventional,
          baseUnitId: null, // Inicialmente no tiene unidad base
        })),
      );

      // Paso 2: Asignar baseUnitId usando los IDs generados
      for (const unit of savedUnits) {
        const unitData = defaultUnits.find((u) => u.name === unit.name);

        if (unitData.baseUnit) {
          const baseUnit = savedUnits.find((u) => u.name === unitData.baseUnit);
          if (baseUnit) {
            unit.baseUnitId = baseUnit.id;
            await this.unitOfMeasureRepository.save(unit);
          }
        }

        // Paso 3: Guardar las conversiones
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
