import { GridColDef, GridRowsProp } from "@mui/x-data-grid";

export interface ProductForm {
  [key: string]: string | number | boolean | null | string[];
  id: string;
  code: number;
  name: string;
  description: string;
  price: number;
  cost: number;
  categories: string[];
  isActive: boolean;
}

export interface ProductTableProps {
  rows: GridRowsProp;
  columns: GridColDef[];
  onCreate: () => void;
  loading: boolean;
  selectedCategoryId: string | null
}

export interface ProductCreated {
  [key: string]: string | number | boolean | null | string[];
  code: number;
  name: string;
  description: string;
  price: number;
  cost: number;
  categories: string[];
  isActive: boolean;
}

export interface ProductState {
  products: ProductCreated[];
  setProducts: (products: ProductCreated[]) => void;
  addProduct: (product: ProductCreated) => void;
  removeProduct: (id: string) => void;
  updateProduct: (updatedProduct: ProductCreated) => void;
  connectWebSocket: () => void;
}