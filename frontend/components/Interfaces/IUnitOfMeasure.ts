

export interface IUnitOfMeasure {
  id?: string;
  name: string;
  abbreviation: string;
  equivalenceToBaseUnit: number | null;
  baseUnitId: string;
}

export interface IUnitOfMeasureStandard {
  id: string;
  name: string;
  abbreviation: string;
}