import { GridColDef, GridRowsProp } from "@mui/x-data-grid";
import { ICategory } from './ICategories';

export interface ProductForm {
  [key: string]: string | number | boolean | null | string[];
  id: string;
  code: null | number;
  name: string;
  description: string;
  price: null | number;
  cost: null | number;
  categories: string[];
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
  [key: string]: string | number | boolean | null | string[];
  categories: string[];
  code: number;
  cost: number;
  description: string;
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