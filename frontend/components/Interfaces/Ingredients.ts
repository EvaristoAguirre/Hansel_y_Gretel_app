import { TypeBaseUnitIngredient } from "../Enums/Ingredients"
import { IStockOfProduct } from "./IStock"
import { IUnitOfMeasureResponse, IUnitOfMeasureStandard } from "./IUnitOfMeasure"

export interface Iingredient {
  id?: string,
  name: string,
  isActive?: boolean,
  description: string,
  // price: number | null,
  cost: number | null,
  stock?: IStockOfProduct | null,
  unitOfMeasureId?: (string | IUnitOfMeasureStandard) | null
  type: TypeBaseUnitIngredient | null
}
export interface IingredientForm {
  name: string,
  ingredientId: string,
  quantityOfIngredient: number | null,
  unitOfMeasureId: string,
  type: TypeBaseUnitIngredient | null,
  isTopping: boolean,
  extraCost: number
}

export interface IingredientResponse {
  id: string,
  quantityOfIngredient: number,
  ingredient: Iingredient,
  unitOfMeasure: IUnitOfMeasureResponse
  isTopping: boolean,
  extraCost: number
}