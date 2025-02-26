export interface IRowData {
  code?: number;
  name: string;
  description: string;
  price: number;
  cost?: number;
  categories?: string[];
  isActive?: boolean;
};