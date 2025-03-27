import { IingredientForm } from "./Ingredients";
import { IPromotionDetails } from "./IProducts";
import { IStockOfProduct } from "./IStock";

export interface IRowData {
  id?: string;
  code?: number | null;
  name: string;
  description?: string;
  abbreviation?: string;
  price?: number | null;
  cost?: number | null;
  categories?: string[];
  isActive?: boolean;
  quantity?: number | null;
  productIngredients?: IingredientForm[] | null;
  promotionDetails?: IPromotionDetails[] | null;
  stock?: IStockOfProduct | null;
};

