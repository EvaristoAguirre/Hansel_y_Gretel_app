export interface IRoom {
  id: string;
  name: string;
}

export interface RoomModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (sala: { id?: string; name: string }) => void;
  room?: { id?: string; name: string } | null;
}