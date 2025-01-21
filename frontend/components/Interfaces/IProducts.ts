import { GridColDef, GridRowsProp } from "@mui/x-data-grid";

export interface ProductForm {
  [key: string]: string | number | boolean | null;
  id: string;
  code: number;
  name: string;
  description: string;
  price: number;
  cost: number;
  inActive: boolean;
}

export interface ProductTableProps {
  rows: GridRowsProp;
  columns: GridColDef[];
  onCreate: () => void;
  loading: boolean;
}

export interface ProductCreated {
  id: string;
  code: number;
  name: string;
  description: string;
  price: number;
  cost: number;
  inActive: boolean;
}

export interface ProductState {
  products: ProductCreated[];
  setProducts: (products: ProductCreated[]) => void;
  addProduct: (product: ProductCreated) => void;
  removeProduct: (id: string) => void;
  updateProduct: (updatedProduct: ProductCreated) => void;
  connectWebSocket: () => void;
}