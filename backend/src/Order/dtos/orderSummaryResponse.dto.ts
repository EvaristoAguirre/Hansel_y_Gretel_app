import { OrderState, TableState } from 'src/Enums/states.enum';
import { ProductLineDto } from '../../DTOs/productSummary.dto';
import { PaymentMethod } from 'src/Enums/paymentMethod.enum';

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
  tip?: number;
  discountPercent?: number;
  discountAmount?: number;
  products: ProductLineDto[];
  payments: OrderPaymentSummary[];
  /** Presente cuando el cambio de estado se guardó pero la impresora no respondió (ticket). */
  printerWarning?: string | null;
  /** Presente cuando el pedido se confirmó pero la comanda no pudo imprimirse. */
  comandaWarning?: string | null;
}

export class OrderPaymentSummary {
  amount: number;
  methodOfPayment: PaymentMethod;
}
