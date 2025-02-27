export interface IUnitOfMeasure {
  name: string;
  abbreviation: string;
  quantity: number | null;
  equivalent_quantity: number | null;
  equivalent_unit: string;
}

export interface IUnitOfMeasureStandard {
  id: string;
  name: string;
  abbreviation: string;
}