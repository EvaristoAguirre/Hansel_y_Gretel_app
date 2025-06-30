import { ICategory } from "./ICategories";
import { IingredientForm, IingredientResponse } from "./Ingredients";
import { IPromotionDetails } from "./IProducts";
import { IStockOfProduct } from "./IStock";

export interface IRowData {
  id?: string;
  code?: number | null;
  name?: string;
  description?: string;
  abbreviation?: string;
  price?: number | null;
  cost?: number | null;
  categories?: ICategory[];
  isActive?: boolean;
  quantity?: number | null;
  productIngredients?: IingredientResponse[] | null;
  promotionDetails?: IPromotionDetails[] | null;
  stock?: IStockOfProduct | null;
  fecha?: string;
  ingresos?: number;
  egresos?: number;
  ganancia?: number;
  estado?: "Abierta" | "Cerrada";
};

