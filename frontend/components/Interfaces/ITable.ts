import { TableState } from "../Enums/Enums";
import { TableModalType } from "../Enums/table";
import { IOrder, ISala } from "./Cafe_interfaces";

export interface TableForm {
  id?: string;
  name: string;
  state?: TableState;
}

export interface TableModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  nombre: string;
  setNombre: (value: string) => void;
  errorNombre: string;
  modalType: TableModalType;
  room: string;
}

export interface TableCreated {
  id: string;
  isActive: boolean;
  name: string;
  orders: string[];
  room: ISala;
  state: TableState;
};

export interface TableCardProps {
  mesa: TableCreated;
  handleOpenModal: (type: TableModalType, mesa?: TableCreated) => void;
  handleDelete: (id: string) => void;
  setSelectedMesa: (mesa: TableCreated) => void;
}