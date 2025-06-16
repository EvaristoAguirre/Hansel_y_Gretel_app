import { IRoom } from '@/components/Interfaces/IRooms';
import { ITable } from '@/components/Interfaces/ITable';
import { URI_ROOM } from '@/components/URI/URI';
import { createContext, useContext, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from './authContext';
type RoomContextType = {
  rooms: IRoom[];
  selectedRoom: IRoom | null;
  selectedTable: ITable | null;
  setSelectedTable: (table: ITable | null) => void;
  view: "mesaEditor" | "pedidoEditor" | null;
  modalOpen: boolean;
  editingRoom: IRoom | null;
  menuAnchorEl: null | HTMLElement;
  menuRoom: IRoom | null;
  setModalOpen: (open: boolean) => void;
  setEditingRoom: (room: IRoom | null) => void;
  handleSelectRoom: (room: IRoom | null) => void;
  handleSaveRoom: (room: { id?: string; name: string }) => void;
  handleDeleteRoom: () => void;
  handleSelectTable: (table: ITable | null) => void;
  handleAbrirPedido: () => void;
  handleVolverATableEditor: () => void;
  handleMenuOpen: (event: React.MouseEvent<SVGSVGElement>, room: IRoom) => void;
  handleMenuClose: () => void;
  setOrderSelectedTable: (order: string) => void
};

const RoomContext = createContext<RoomContextType>({
  rooms: [],
  selectedRoom: null,
  selectedTable: null,
  setSelectedTable: () => { },
  view: null,
  modalOpen: false,
  editingRoom: null,
  menuAnchorEl: null,
  menuRoom: null,
  setModalOpen: () => { },
  setEditingRoom: () => { },
  handleSelectRoom: () => { },
  handleSaveRoom: () => { },
  handleDeleteRoom: () => { },
  handleSelectTable: () => { },
  handleAbrirPedido: () => { },
  handleVolverATableEditor: () => { },
  handleMenuOpen: () => { },
  handleMenuClose: () => { },
  setOrderSelectedTable: () => { }
});

export const useRoomContext = () => {
  const context = useContext(RoomContext);
  return context;
};

const RoomProvider = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  const { getAccessToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<IRoom | null>(null);
  const [selectedTable, setSelectedTable] = useState<ITable | null>(null);
  const [view, setView] = useState<"mesaEditor" | "pedidoEditor" | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<IRoom | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuRoom, setMenuRoom] = useState<IRoom | null>(null);


  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    setToken(token);

    async function fetchRooms() {
      try {
        const response = await fetch(URI_ROOM, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          }
        });
        const data = await response.json();
        setRooms(data);
      } catch (error) {
        Swal.fire("Error", "No se pudieron cargar las salas.", "error");
      }
    }
    fetchRooms();
  }, []);

  const handleSelectRoom = (room: IRoom | null) => {
    setSelectedTable(null);
    setSelectedRoom(room);
  }

  const handleSaveRoom = async (room: { id?: string; name: string }) => {
    if (room.id) {
      // Editar sala existente
      try {
        const response = await fetch(`${URI_ROOM}/${room.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(room),
        });

        if (!response.ok) throw new Error("Error al editar la sala.");

        const updatedRoom = await response.json();
        setRooms((prev) =>
          prev.map((s) => (s.id === updatedRoom.id ? updatedRoom : s))
        );

        Swal.fire("Éxito", "Room actualizada correctamente.", "success");
      } catch (error) {
        Swal.fire("Error", "No se pudo actualizar la sala.", "error");
      }
    } else {
      // Crear nueva sala
      try {
        const response = await fetch(URI_ROOM, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(room),
        });

        if (!response.ok) throw new Error("Error al crear la sala.");

        const newRoom = await response.json();
        setRooms((prev) => [...prev, newRoom]);

        Swal.fire("Éxito", "Room creada correctamente.", "success");
      } catch (error) {
        Swal.fire("Error", "No se pudo crear la sala.", "error");
      }
    }
  };

  const handleDeleteRoom = async () => {
    if (!menuRoom) return;

    //agrego una confirmacion antes de eliminar
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {

      try {
        const response = await fetch(`${URI_ROOM}/${menuRoom.id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Error al eliminar la sala.");

        setRooms((prev) => {
          const nuevasRooms = prev.filter((s) => s.id !== menuRoom.id);

          // Agrego esto para evitar error cuando se elimina la sala seleccionada. 
          //Si la sala eliminada es la seleccionada, actualizar `selectedRoom`
          if (selectedRoom?.id === menuRoom.id) {
            setSelectedRoom(nuevasRooms.length > 0 ? nuevasRooms[0] : null);
          }

          return nuevasRooms;
        });

        Swal.fire("Éxito", "Room eliminada correctamente.", "success");
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar la sala.", "error");
      } finally {
        handleMenuClose();
      }
    }
  };

  /**
   * @param table - Es la Table que se selecciona.
   * Se setea la table seleccionada en `selectedTable`.
   * Se setea la orden de la table en `selectedOrderByTable`.
   * Se limpia la información de la table saliente mediante `handleResetSelectedOrder`.
   */
  const handleSelectTable = async (table: ITable | null) => {
    setSelectedTable(table);
  };

  const setOrderSelectedTable = (order: string) => {
    const newOrder = [order];
    setSelectedTable({
      ...selectedTable,
      orders: newOrder,
    } as ITable);
  };

  const handleAbrirPedido = () => {
    setView("pedidoEditor");
  };

  const handleVolverATableEditor = () => {
    setView("mesaEditor");
  };

  const handleMenuOpen = (
    event: React.MouseEvent<SVGSVGElement>,
    sala: IRoom
  ) => {
    setMenuAnchorEl(event.currentTarget as unknown as HTMLElement);
    setMenuRoom(sala);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuRoom(null);
  };

  return (
    <RoomContext.Provider value={{
      rooms,
      selectedRoom,
      selectedTable,
      setSelectedTable,
      setOrderSelectedTable,
      view,
      modalOpen,
      editingRoom,
      menuAnchorEl,
      menuRoom,
      setModalOpen,
      setEditingRoom,
      handleSelectRoom,
      handleSaveRoom,
      handleDeleteRoom,
      handleSelectTable,
      handleAbrirPedido,
      handleVolverATableEditor,
      handleMenuOpen,
      handleMenuClose
    }}>
      {children}
    </RoomContext.Provider>
  );
};

export default RoomProvider;