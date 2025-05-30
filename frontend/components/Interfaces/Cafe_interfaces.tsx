import { OrderState } from "../Enums/Enums";
import { TableCreated } from "./ITable";

export interface PedidoInterface {
  id: string;
  name: string;
  price: number;
  cantidad: number;
}

export interface MozoInterface {
  id: string;
  nombre: string;
}

export interface IOrder {
  id: string;
}

export interface ISala {
  id: string;
  name: string;
}

export interface SalaModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (sala: { id?: string; name: string }) => void;
  sala?: { id?: string; name: string } | null;
}

export interface IOrder {
  id: string;
  date: Date;
  state: OrderState;
  isActive: boolean;
  table: TableCreated;
}

