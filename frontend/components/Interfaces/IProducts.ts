import { GridColDef, GridRowsProp } from "@mui/x-data-grid";
import { TypeProduct } from "../Enums/view-products";
import { ICategory } from './ICategories';
import { IingredientForm, IingredientResponse } from "./Ingredients";
import { IStockOfProduct } from "./IStock";
import { IUnitOfMeasureStandard } from "./IUnitOfMeasure";

interface IProduct {
  allowsToppings: boolean;
  code: number | null;
  cost: number | null;
  description: string;
  id: string;
  isActive: boolean;
  name: string;
  price: number | null;
  toppingsSettings: null;
  type: TypeProduct;
}
export interface ProductForm extends IProduct {
  [key: string]: string | number | boolean
  | null | string[] | IingredientForm[]
  | IProductDataList[] | ProductForPromo[] | ProductToppingsGroupDto[];
  categories: string[];
  ingredients: IingredientForm[];
  products: IProductDataList[];
  isActive: boolean;
  availableToppingGroups: ProductToppingsGroupDto[];

}
export interface ProductToppingsGroupDto {
  toppingsGroupId: string;
  quantityOfTopping: number;
  unitOfMeasureId?: string;
  name?: string;
  settings: {
    maxSelection: number;
    chargeExtra: boolean;
  }
}
export interface IProductToppingsGroupResponse {
  id: string;
  name: string;
  isActive: boolean;
  settings: {
    chargeExtra: boolean;
    maxSelection: number;
  };
  unitOfMeasure: IUnitOfMeasureStandard;
  quantityOfTopping: string;
  toppings: IProduct[];
}
export interface ProductForPromo {
  productId: string;
  quantity: number;
  id?: string;
  name?: string;
  price?: number;

}

export interface IProductDataList {
  id: string;
  product: IProduct;
  quantity: number;
}


export interface ProductTableProps {
  rows: GridRowsProp;
  columns: GridColDef[];
  onCreate: () => void;
  loading: boolean;
  selectedCategoryId: string | null;
  onClearSelectedCategory: () => void;

}

export interface ProductCreated extends IProduct {
  [key: string]: string | number | boolean | null | string[] | IingredientForm[] | IPromotionDetails[] | undefined | IStockOfProduct;
  quantity?: number | null;
  productIngredients: IingredientForm[] | null;
  promotionDetails: IPromotionDetails[] | null;
  stock: IStockOfProduct | null;
};


export interface IPromotionDetails {
  id: string;
  quantity: number;
  product: IProduct;
}


export interface ProductResponse {
  id: string;
  code: number;
  name: string;
  price: number;
  cost: number;
  type: TypeProduct;
  allowsToppings: boolean;
  categories: ICategory[];
  productIngredients: IingredientResponse[];
  promotionDetails: IPromotionDetails[];
  stock: IStockOfProduct;
  availableToppingGroups: IProductToppingsGroupResponse[];
}

export interface ProductState {
  products: ProductResponse[];
  setProducts: (products: ProductResponse[]) => void;
  addProduct: (product: ProductResponse) => void;
  removeProduct: (id: string) => void;
  updateProduct: (updatedProduct: ProductResponse) => void;
  connectWebSocket: () => void;
}

export interface ProductsProps {
  selectedCategoryId: string | null;
  onClearSelectedCategory: () => void;
}

export interface SelectedProductsI {
  productId: string;
  productName?: string;
  quantity: number;
  unitaryPrice?: number | null;
  commentOfProduct?: string | null;
  toppingsIds?: string[];
  toppingsPerUnit?: string[][]
  allowsToppings?: boolean;
  availableToppingGroups?: IProductToppingsGroupResponse[];
};

export interface IConfirmedProducts {
  id: string;
  isActive: boolean;
  orderId: string;
  product: IProduct
  quantity: number;
  subtotal: number;
  unitaryPrice: string;
  batchId: string;
};

export interface ICheckStock {
  productId: string;
  quantityToSell: number;
};

