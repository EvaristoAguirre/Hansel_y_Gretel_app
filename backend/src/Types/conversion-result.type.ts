import { UnitOfMeasure } from 'src/UnitOfMeasure/unitOfMesure.entity';

export interface ConversionResult {
  convertedQuantity: number;
  originalQuantity: number;
  originalUnit: UnitOfMeasure;
  targetUnit: UnitOfMeasure;
}
