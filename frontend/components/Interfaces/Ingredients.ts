
export interface Iingredient {
  id?: string,
  name: string,
  isActive?: boolean,
  description: string,
  price: number | null,
  cost: number | null
}

export interface IingredientForm {
  name: string,
  ingredientId: string,
  quantityOfIngredient: number | null,
  unitOfMeasureId: string
}