import { OrderState } from "../Enums/order";
import { ITable } from "./ITable";

export interface IOrder {
  id: string;
  date: Date;
  state: OrderState;
  isActive: boolean;
  table: ITable;
}
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
