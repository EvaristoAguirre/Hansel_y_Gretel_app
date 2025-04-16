
export interface IUnitOfMeasureForm {
  id?: string;
  name: string;
  abbreviation: string;
  conversions: {
    toUnitId: string;
    conversionFactor: number;
  }[];
}
export interface IUnitOfMeasureResponse {
  id: string;
  name: string;
  abbreviation: string;
  isActive: boolean;
  isConventional: boolean;
  isBase: boolean;
  baseUnit: any;
  fromConversions: { id: string, conversionFactor: number }[];
  toConversions: { id: string, conversionFactor: number }[];
}

export interface IUnitOfMeasureStandard {
  id: string;
  name: string;
  abbreviation: string;
}