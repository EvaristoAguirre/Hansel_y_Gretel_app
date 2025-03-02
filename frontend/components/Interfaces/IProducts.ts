import { GridColDef, GridRowsProp } from "@mui/x-data-grid";
import { ICategory } from './ICategories';
import { IingredientForm } from "./Ingredients";

export interface ProductForm {
  [key: string]: string | number | boolean | null | string[] | IingredientForm[];
  id: string;
  code: null | number;
  name: string;
  description: string;
  price: null | number;
  cost: null | number;
  categories: string[];
  ingredients: IingredientForm[];
  isActive: boolean;
}

export interface ProductTableProps {
  rows: GridRowsProp;
  columns: GridColDef[];
  onCreate: () => void;
  loading: boolean;
  selectedCategoryId: string | null;
  onClearSelectedCategory: () => void;

}

export interface ProductCreated {
  [key: string]: string | number | boolean | null | string[] | IingredientForm[];
  code: number;
  name: string;
  description: string;
  price: number;
  cost: number;
  categories: string[];
  ingredients: IingredientForm[];
  isActive: boolean;
};



export interface ProductResponse {
  id: string;
  code: number;
  name: string;
  description: string;
  price: number;
  cost: number;
  categories: ICategory[];
  isActive: boolean;
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

