import { IStockOfProduct } from "./IStock"

export interface Iingredient {
  id?: string,
  name: string,
  isActive?: boolean,
  description: string,
  // price: number | null,
  cost: number | null,
  stock?: IStockOfProduct,

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
  ingredient: Iingredient
  unitOfMeasure: {
    id: string,
    name: string,
    abbreviation: string,
    isActive: boolean,
    equivalenceToBaseUnit: number | null,
    baseUnitId: string,
    isConventional: boolean
  }
}