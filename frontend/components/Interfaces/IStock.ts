import { StockModalType } from "../Enums/view-products";
import { IUnitOfMeasureForm } from "./IUnitOfMeasure";

export interface IStock {
  quantityInStock: number
  minimumStock: number
  unitOfMeasureId: string
  productId?: string
  ingredientId?: string
}


export interface IStockOfProduct {
  id: string;
  quantityInStock: string;
  minimumStock: string;
  unitOfMeasure: IUnitOfMeasureForm;

}


export interface SelectedItem {
  type?: StockModalType;
  id?: string;
  name?: string;
  stock?: string | null;
  min: string | null;
  unit: string | null;
  idStock?: string | null;
}



export interface ProductItem extends SelectedItem {
  type: StockModalType.PRODUCT;
  productId: string;
}

export interface IngredientItem extends SelectedItem {
  type: StockModalType.INGREDIENT;
  ingredientId: string;
}
