export class BaseUnitDto {
  id: string;
  name: string;
  abbreviation: string;
}

export class ConversionDto {
  toUnitId: string;
  unitName: string;
  unitAbbreviation: string;
  conversionFactor: number;
  direction: 'from' | string;
}

export class BaseConversionDto {
  unitId: string;
  unitName: string;
  factor: number;
}

export class UnitOfMeasureSummaryResponseDto {
  id: string;
  name: string;
  abbreviation: string;
  isActive: boolean;
  isConventional: boolean;
  isBase: boolean;
  baseUnit: BaseUnitDto | null;
  conversions: ConversionDto[];
  toBaseConversion: BaseConversionDto | null;
}
