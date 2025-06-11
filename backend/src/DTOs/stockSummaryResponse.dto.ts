export class StockSummaryResponseDTO {
  id: string;
  quantityInStock: string;
  minimumStock: string;
  ingredient: IngredientResponseDTO | null;
  product: ProductResponseDTO;
  unitOfMeasure: UnitOfMeasureResponseDTO;
}
export class UnitOfMeasureResponseDTO {
  id: string;
  name: string;
  abbreviation: string;
}

export class IngredientResponseDTO {
  id: string;
  name: string;
  cost: number;
  isTopping: boolean;
}

export class ProductResponseDTO {
  id: string;
  name: string;
  cost: number;
}
