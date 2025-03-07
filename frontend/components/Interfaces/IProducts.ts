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
  ingredient: IingredientForm[];
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
  categories: string[];
  code: number;
  description: string;
  ingredient: IingredientForm[];
  isActive: boolean;
  name: string;
  price: number;
};



export interface ProductResponse {
  categories: ICategory[];
  code: number;
  cost: number;
  description: string;
  id: string;
  isActive: boolean;
  name: string;
  price: number;
  ingredients: IingredientForm[]
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
  unitaryPrice: number;
};

export interface IConfirmedProducts {
  id: string;
  isActive: boolean;
  orderId: string;
  product: {
    id: string;
    code: number;
    name: string;
    description: string;
    price: string;
  };
  quantity: number;
  subtotal: number;
  unitaryPrice: string;
  batchId: string;
};

