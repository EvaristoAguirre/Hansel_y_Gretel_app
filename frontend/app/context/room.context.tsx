import { ISala, MesaInterface } from '@/components/Interfaces/Cafe_interfaces';
import { URI_ROOM } from '@/components/URI/URI';
import { createContext, useContext, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from './authContext';
type RoomContextType = {
  salas: ISala[];
  selectedSala: ISala | null;
  selectedMesa: MesaInterface | null;
  setSelectedMesa: (mesa: MesaInterface | null) => void;
  view: "mesaEditor" | "pedidoEditor" | null;
  modalOpen: boolean;
  editingSala: ISala | null;
  menuAnchorEl: null | HTMLElement;
  menuSala: ISala | null;
  setModalOpen: (open: boolean) => void;
  setEditingSala: (sala: ISala | null) => void;
  handleSelectSala: (sala: ISala | null) => void;
  handleSaveSala: (sala: { id?: string; name: string }) => void;
  handleDeleteSala: () => void;
  handleSelectMesa: (mesa: MesaInterface | null) => void;
  handleAbrirPedido: () => void;
  handleVolverAMesaEditor: () => void;
  handleMenuOpen: (event: React.MouseEvent<SVGSVGElement>, sala: ISala) => void;
  handleMenuClose: () => void;
};

const RoomContext = createContext<RoomContextType>({
  salas: [],
  selectedSala: null,
  selectedMesa: null,
  setSelectedMesa: () => { },
  view: null,
  modalOpen: false,
  editingSala: null,
  menuAnchorEl: null,
  menuSala: null,
  setModalOpen: () => { },
  setEditingSala: () => { },
  handleSelectSala: () => { },
  handleSaveSala: () => { },
  handleDeleteSala: () => { },
  handleSelectMesa: () => { },
  handleAbrirPedido: () => { },
  handleVolverAMesaEditor: () => { },
  handleMenuOpen: () => { },
  handleMenuClose: () => { },
});

export const useRoomContext = () => {
  const context = useContext(RoomContext);
  return context;
};

const RoomProvider = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  const { getAccessToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [salas, setSalas] = useState<ISala[]>([]);
  const [selectedSala, setSelectedSala] = useState<ISala | null>(null);
  const [selectedMesa, setSelectedMesa] = useState<MesaInterface | null>(null);
  const [view, setView] = useState<"mesaEditor" | "pedidoEditor" | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSala, setEditingSala] = useState<ISala | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuSala, setMenuSala] = useState<ISala | null>(null);


  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    setToken(token);

    async function fetchSalas() {
      try {
        const response = await fetch(URI_ROOM, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          }
        });
        const data = await response.json();
        setSalas(data);
      } catch (error) {
        Swal.fire("Error", "No se pudieron cargar las salas.", "error");
      }
    }
    fetchSalas();
  }, []);

  const handleSelectSala = (sala: ISala | null) => {
    setSelectedMesa(null);
    setSelectedSala(sala);
  }

  const handleSaveSala = async (sala: { id?: string; name: string }) => {
    if (sala.id) {
      // Editar sala existente
      try {
        const response = await fetch(`${URI_ROOM}/${sala.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(sala),
        });

        if (!response.ok) throw new Error("Error al editar la sala.");

        const updatedSala = await response.json();
        setSalas((prev) =>
          prev.map((s) => (s.id === updatedSala.id ? updatedSala : s))
        );

        Swal.fire("Éxito", "Sala actualizada correctamente.", "success");
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
          body: JSON.stringify(sala),
        });

        if (!response.ok) throw new Error("Error al crear la sala.");

        const newSala = await response.json();
        setSalas((prev) => [...prev, newSala]);

        Swal.fire("Éxito", "Sala creada correctamente.", "success");
      } catch (error) {
        Swal.fire("Error", "No se pudo crear la sala.", "error");
      }
    }
  };

  const handleDeleteSala = async () => {
    if (!menuSala) return;

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
        const response = await fetch(`${URI_ROOM}/${menuSala.id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Error al eliminar la sala.");

        setSalas((prev) => {
          const nuevasSalas = prev.filter((s) => s.id !== menuSala.id);

          // Agrego esto para evitar error cuando se elimina la sala seleccionada. 
          //Si la sala eliminada es la seleccionada, actualizar `selectedSala`
          if (selectedSala?.id === menuSala.id) {
            setSelectedSala(nuevasSalas.length > 0 ? nuevasSalas[0] : null);
          }

          return nuevasSalas;
        });

        Swal.fire("Éxito", "Sala eliminada correctamente.", "success");
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar la sala.", "error");
      } finally {
        handleMenuClose();
      }
    }
  };

  /**
   * @param mesa - Es la Mesa que se selecciona.
   * Se setea la mesa seleccionada en `selectedMesa`.
   * Se setea la orden de la mesa en `selectedOrderByTable`.
   * Se limpia la información de la mesa saliente mediante `handleResetSelectedOrder`.
   */
  const handleSelectMesa = async (mesa: MesaInterface | null) => {
    setSelectedMesa(mesa);
  };

  const handleAbrirPedido = () => {
    setView("pedidoEditor");

  };

  const handleVolverAMesaEditor = () => {
    setView("mesaEditor");
  };

  const handleMenuOpen = (
    event: React.MouseEvent<SVGSVGElement>,
    sala: ISala
  ) => {
    setMenuAnchorEl(event.currentTarget as unknown as HTMLElement);
    setMenuSala(sala);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuSala(null);
  };

  return (
    <RoomContext.Provider value={{
      salas,
      selectedSala,
      selectedMesa,
      setSelectedMesa,
      view,
      modalOpen,
      editingSala,
      menuAnchorEl,
      menuSala,
      setModalOpen,
      setEditingSala,
      handleSelectSala,
      handleSaveSala,
      handleDeleteSala,
      handleSelectMesa,
      handleAbrirPedido,
      handleVolverAMesaEditor,
      handleMenuOpen,
      handleMenuClose
    }}>
      {children}
    </RoomContext.Provider>
  );
};

export default RoomProvider;