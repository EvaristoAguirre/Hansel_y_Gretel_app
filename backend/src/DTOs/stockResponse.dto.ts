export class StockResponseDTO {
  id: string;
  quantityInStock: string;
  minimumStock: string;
  unitOfMeasure: {
    id: string;
    name: string;
    abbreviation: string;
  };
}

export class UnitOfMeasureResponseDTO {
  id: string;
  name: string;
  abbreviation: string;
}
