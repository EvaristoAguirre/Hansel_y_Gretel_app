export interface IToppingForm {
  name: string,
  toppingsIds: string[]
}

export interface IToppingsGroup {
  id: string,
  name: string,
  isActive: boolean,
  toppings: ITopping[]
}

export interface ITopping {
  id: string,
  name: string,
  isActive: boolean,
  description: string,
  cost: string,
  type: string,
  isTopping: boolean,
  extraCost: null,
  unitOfMeasure: {
    id: string,
    name: string,
    abbreviation: string
  },
  stock: null
}