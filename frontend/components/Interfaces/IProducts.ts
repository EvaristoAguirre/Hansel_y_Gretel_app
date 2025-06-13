import { GridColDef, GridRowsProp } from "@mui/x-data-grid";
import { TypeProduct } from "../Enums/view-products";
import { ICategory } from './ICategories';
import { IingredientForm, IingredientResponse } from "./Ingredients";
import { IStockOfProduct } from "./IStock";

// interface IProduct {
//   id: string;
//   code: number | null;
//   name: string;
//   description: string;
//   type: TypeProduct | null;
//   price: number | null;
//   cost: number | null;
//   isActive?: boolean;
// }

interface IProduct {
  allowsToppings: boolean | null;
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
  [key: string]: string | number | boolean | null | string[] | IingredientForm[] | IProductDataList[];
  categories: string[];
  ingredients: IingredientForm[];
  products: IProductDataList[];
  isActive: boolean;
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
  categories: ICategory[];
  code: number;
  cost: number;
  description: string;
  type: TypeProduct
  id: string;
  isActive: boolean;
  name: string;
  price: number;
  productIngredients: IingredientResponse[];
  promotionDetails: IPromotionDetails[];
  stock: IStockOfProduct;
  allowsToppings: boolean | null;
  toppingsSettings: null
}

export interface ProductState {
  products: ProductCreated[];
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
  productName: string;
  quantity: number;
  unitaryPrice: number | null;
  commentOfProduct?: string | null;
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

