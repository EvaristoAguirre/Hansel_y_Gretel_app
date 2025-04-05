import {
  StockResponseDTO,
  UnitOfMeasureResponseDTO,
} from './stockResponse.dto';

export class IngredientResponseDTO {
  id: string;
  name: string;
  isActive: boolean;
  description: string;
  cost: number;
  stock?: StockResponseDTO | null;
  type: 'masa' | 'volumen';
  unitOfMeasure?: UnitOfMeasureResponseDTO | null;
}
