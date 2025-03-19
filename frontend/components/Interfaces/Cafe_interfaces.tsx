import { OrderState, TableState } from "../Enums/Enums";
import { TableCreated } from "../Table/useTableStore";
import { OrderDetailsCreated } from "../Order/useOrderDetailsStore";

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
  // state: OrderState;
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
  handleOpenModal: (type: "create" | "edit", mesa?: MesaInterface) => void;
  handleDelete: (id: string) => void;
  setSelectedMesa: (mesa: MesaInterface) => void;
}

export interface MesaModalProps {
  open: boolean;
  type: "create" | "edit";
  form: MesaForm;
  onClose: () => void;
  onSave: (data: MesaForm) => void;
  onChange: (field: keyof MesaForm, value: any) => void;
}

// export interface MesaProps {
//   salaId: string;
//   onSelectMesa: (mesa: MesaInterface) => void;
// }
export interface MesaProps {
  salaId: string;
  // onSelectMesa: (mesaId: string) => void;
  onSelectMesa: (mesa: MesaInterface) => void;
}

export interface ISala {
  id: string;
  name: string;
  // isActive: boolean;
  // tables: MesaInterface[];
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
  orderDetails: OrderDetailsCreated[];
}

//---------------------------------------------------------------------
