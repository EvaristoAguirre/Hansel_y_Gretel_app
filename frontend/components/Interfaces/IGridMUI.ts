export interface IRowData {
  id?: string;
  code?: number;
  name: string;
  description?: string;
  abbreviation?: string;
  price?: number | null;
  cost?: number | null;
  categories?: string[];
  isActive?: boolean;
};

