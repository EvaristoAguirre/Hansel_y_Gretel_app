import { IStockOfProduct } from "./IStock"
import { IUnitOfMeasureResponse, IUnitOfMeasureStandard } from "./IUnitOfMeasure"

export interface Iingredient {
  id?: string,
  name: string,
  isActive?: boolean,
  description: string,
  // price: number | null,
  cost: number | null,
  stock?: IStockOfProduct,
  unitOfMeasureId?: (IUnitOfMeasureStandard | string) | null
}
export interface IingredientForm {
  name: string,
  ingredientId: string,
  quantityOfIngredient: number | null,
  unitOfMeasureId: string
}

export interface IingredientResponse {
  id: string,
  quantityOfIngredient: number,
  ingredient: Iingredient,
  unitOfMeasure: IUnitOfMeasureResponse
}