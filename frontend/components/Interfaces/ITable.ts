import { TableState } from "../Enums/Enums";
import { TableModalType } from "../Enums/table";

export interface TableForm {
  id?: string;
  name: string;
  state: TableState;
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