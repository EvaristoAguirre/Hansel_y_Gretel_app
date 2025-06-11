import { OrderState } from "../Enums/Enums";

export interface IOrderDetails {
  id: string;
  state: OrderState;
  numberCustomers: number;
  comment: string;
  table: {
    id: string;
    name: string;
  };
  total: number;
  products: IConfirmedProducts[];
}

export interface IConfirmedProducts {
  productId: string;
  productName: string;
  unitaryPrice: number;
  subtotal: number;
  quantity: number;
  comment: string;
}
