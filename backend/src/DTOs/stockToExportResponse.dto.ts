export class StockToExportResponseDTO {
  quantityInStock: string;
  ingredient: IngredientResponseDTO | null;
  product: ProductResponseDTO;
  unitOfMeasure: UnitOfMeasureResponseDTO;
}
export class UnitOfMeasureResponseDTO {
  name: string;
  abbreviation: string;
}

export class IngredientResponseDTO {
  name: string;
  cost: string;
  isTopping: boolean;
}

export class ProductResponseDTO {
  name: string;
  cost: string;
}
