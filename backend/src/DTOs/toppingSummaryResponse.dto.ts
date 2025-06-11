import {
  StockResponseDTO,
  UnitOfMeasureResponseDTO,
} from './stockResponse.dto';

export class ToppingResponseDto {
  id: string;
  name: string;
  isActive: boolean;
  description: string;
  cost: number;
  stock?: StockResponseDTO | null;
  type: 'masa' | 'volumen' | 'unidad';
  unitOfMeasure?: UnitOfMeasureResponseDTO | null;
  isTopping: boolean;
  extraCost?: number | null;
}
