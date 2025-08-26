import { TypeBaseUnitIngredient } from "../Enums/Ingredients";
import { TypeProduct } from "../Enums/view-products";
import { ICategory } from "./ICategories";
import { IingredientForm, IingredientResponse } from "./Ingredients";
import { IPromotionDetails } from "./IProducts";
import { IStockOfProduct } from "./IStock";
import { IUnitOfMeasureStandard } from "./IUnitOfMeasure";

export interface IRowData {
  id?: string;
  code?: number | null;
  name?: string;
  description?: string;
  abbreviation?: string;
  price?: string | null;
  cost?: string | null | number;
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
  unitOfMeasureId?: (string | IUnitOfMeasureStandard) | null;
  type?: TypeBaseUnitIngredient | null | TypeProduct,
  isTopping?: boolean,
  extraCost?: number
};

