import { TableState } from "../Enums/Enums";
import { TableModalType } from "../Enums/table";
import { IRoom } from "./IRooms";
export interface ITable {
  id: string;
  name: string;
  state?: TableState;
  room: IRoom;
  orders?: string[] | null;
}
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