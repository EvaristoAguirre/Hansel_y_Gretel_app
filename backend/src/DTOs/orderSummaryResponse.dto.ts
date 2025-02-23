import { OrderState, TableState } from 'src/Enums/states.enum';
import { ProductSummary } from './productSummary.dto';

export class OrderSummaryResponseDto {
  id: string;
  state: OrderState;
  numberCustomers: number;
  comment?: string;
  table?: {
    id: string;
    name: string;
    state: TableState;
  };
  total: number;
  products: ProductSummary[];
}
