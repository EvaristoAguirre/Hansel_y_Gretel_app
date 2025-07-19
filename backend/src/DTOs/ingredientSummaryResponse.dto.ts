import {
  StockResponseDTO,
  UnitOfMeasureResponseDTO,
} from './stockResponse.dto';

export class IngredientResponseDTO {
  id: string;
  name: string;
  isActive: boolean;
  description: string;
  cost: string;
  stock?: StockResponseDTO | null;
  type: 'masa' | 'volumen' | 'unidad';
  unitOfMeasure?: UnitOfMeasureResponseDTO | null;
  isTopping: boolean;
  extraCost?: string | null;
}
