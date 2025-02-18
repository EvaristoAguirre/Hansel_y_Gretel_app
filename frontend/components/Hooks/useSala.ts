import React, { useEffect, useState } from "react";
import { ISala, MesaInterface } from "../Interfaces/Cafe_interfaces";
import Swal from "sweetalert2";
import { URI_ROOM } from "../URI/URI";

export const useSala = () => {
  const [salas, setSalas] = useState<ISala[]>([]);
  const [selectedSala, setSelectedSala] = useState<ISala | null>(null);
  const [selectedMesa, setSelectedMesa] = useState<MesaInterface | null>(null);
  const [selectedMesaId, setSelectedMesaId] = useState<string | null>(null);
  const [view, setView] = useState<"mesaEditor" | "pedidoEditor" | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSala, setEditingSala] = useState<ISala | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuSala, setMenuSala] = useState<ISala | null>(null);

  useEffect(() => {
    async function fetchSalas() {
      try {
        const response = await fetch(URI_ROOM, { method: "GET" });
        const data = await response.json();
        setSalas(data);
      } catch (error) {
        Swal.fire("Error", "No se pudieron cargar las salas.", "error");
      }
    }
    fetchSalas();
  }, []);

  const handleSaveSala = async (sala: { id?: string; name: string }) => {
    if (sala.id) {
      // Editar sala existente
      try {
        const response = await fetch(`${URI_ROOM}/${sala.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
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
          headers: { "Content-Type": "application/json" },
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


  const handleSelectMesa = (mesaId: string) => {
    setSelectedMesaId(mesaId);
    setView("mesaEditor");
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


  return {
    salas,
    setSalas,
    selectedSala,
    setSelectedSala,
    selectedMesa,
    setSelectedMesa,
    selectedMesaId,
    setSelectedMesaId,
    view,
    setView,
    modalOpen,
    setModalOpen,
    editingSala,
    setEditingSala,
    menuAnchorEl,
    setMenuAnchorEl,
    menuSala,
    setMenuSala,
    handleSaveSala,
    handleDeleteSala,
    handleSelectMesa,
    handleAbrirPedido,
    handleVolverAMesaEditor,
    handleMenuOpen,
    handleMenuClose
  };
};

export default useSala;
