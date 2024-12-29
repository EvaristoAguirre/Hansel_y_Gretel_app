import { TableState } from "../Enums/Enums";
import { TableCreated } from "../Mesa/useTableStore";

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

export interface MesaInterface {
  id: string;
  name: string;
  number: number;
  coment: string;
  // cantidadPersonas: number;
  // cliente: string | null;
  state: TableState; // Estados posibles de la mesa
  room: string; // ID de la sala a la que pertenece
  // mozo: MozoInterface | null;
  // pedido: PedidoInterface[]; // Lista de pedidos asociados
}

export interface MesaForm {
  name: string;
  number: number;
  coment: string;
  // state: TableState;
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
  onSave: () => void;
  onChange: (field: keyof MesaForm, value: any) => void;
}

export interface MesaProps {
  mesas: TableCreated[];
  salaId: string;
}