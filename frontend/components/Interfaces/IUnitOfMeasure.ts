

export interface IUnitOfMeasure {
  id?: string;
  name: string;
  abbreviation: string;
  isActive: boolean;
  equivalenceToBaseUnit: number | null;
  baseUnitId: string;
  isConventional: boolean;
  baseUnit?: string | null
}

export interface IUnitOfMeasureStandard {
  id: string;
  name: string;
  abbreviation: string;
}