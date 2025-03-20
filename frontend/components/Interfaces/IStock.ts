import { StockModalType } from "../Enums/view-products";
import { IUnitOfMeasure } from "./IUnitOfMeasure";

export interface IStock {
  quantityInStock: number
  minimumStock: number
  unitOfMeasureId: string
  productId?: string
  ingredientId?: string
}


export interface IStockOfProduct {
  id: string;
  quantityInStock: number;
  minimumStock: number;
  unitOfMeasure: IUnitOfMeasure;

}


export interface SelectedItem {
  type: StockModalType;
  id: string;
  name?: string;
  stock?: number;
  min: number;
  unit: string;
}

export interface ProductItem extends SelectedItem {
  type: StockModalType.PRODUCT;
  productId: string;
}

export interface IngredientItem extends SelectedItem {
  type: StockModalType.INGREDIENT;
  ingredientId: string;
}