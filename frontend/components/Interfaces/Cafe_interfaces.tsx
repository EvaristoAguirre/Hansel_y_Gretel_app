import { OrderState, TableState } from "../Enums/Enums";
import { TableModalType } from "../Enums/table";

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

export interface MesaInterface {
  id: string;
  name: string;
  number: number | null;
  coment: string;
  state?: TableState;
  room: ISala;
  orders?: string[] | null;
}

export interface MesaForm {
  id?: string;
  name: string;
  number: null | number;
  coment: string;
  state?: TableState;
}

export interface MesaCardProps {
  mesa: MesaInterface;
  handleOpenModal: (type: TableModalType, mesa?: MesaInterface) => void;
  handleDelete: (id: string) => void;
  setSelectedMesa: (mesa: MesaInterface) => void;
}

export interface MesaProps {
  salaId: string;
  onSelectMesa: (mesa: MesaInterface) => void;
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
  table: MesaInterface;
}

