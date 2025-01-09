import React, { useEffect, useState } from "react";
import { URI_ROOM } from "../URI/URI";
import Swal from "sweetalert2";
import { MesaInterface, ISala } from "../Interfaces/Cafe_interfaces";
import Mesa from "../Mesa/Mesa";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import MesaEditor from "../Mesa/MesaEditor";
import PedidoEditor from "../Pedido/PedidoEditor";
import { Button, Menu, MenuItem } from "@mui/material";
import SalaModal from "./SalaModal";

const Sala = () => {
  const [salas, setSalas] = useState<ISala[]>([]);
  const [selectedSala, setSelectedSala] = useState<ISala | null>(null);
  const [selectedMesa, setSelectedMesa] = useState<MesaInterface | null>(null);
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
          method: "PUT",
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

    try {
      const response = await fetch(`${URI_ROOM}/${menuSala.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar la sala.");

      setSalas((prev) => prev.filter((s) => s.id !== menuSala.id));
      Swal.fire("Éxito", "Sala eliminada correctamente.", "success");
    } catch (error) {
      Swal.fire("Error", "No se pudo eliminar la sala.", "error");
    } finally {
      handleMenuClose();
    }
  };

  const handleSelectMesa = (mesa: MesaInterface) => {
    setSelectedMesa(mesa);
    setView("mesaEditor");
  };

  const handleAbrirPedido = () => {
    setView("pedidoEditor");
  };

  const handleVolverAMesaEditor = () => {
    setView("mesaEditor");
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLButtonElement>,
    sala: ISala
  ) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuSala(sala);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuSala(null);
  };

  return (
    <>
      <div
        className="salas"
        style={{
          height: "50px",
          backgroundColor: "#515050",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 20px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {salas.map((sala) => (
            <h3
              key={sala.id}
              style={{
                fontSize: "1.25rem",
                color: "#ffffff",
                fontWeight: "400",
                margin: "0 20px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                borderBottom:
                  selectedSala?.id === sala.id ? "1px solid #ffffff" : "none",
              }}
              onClick={() => setSelectedSala(sala)}
            >
              {sala.name}
              <MoreVertIcon
                style={{ cursor: "pointer", marginLeft: "10px" }}
                onClick={(e) => handleMenuOpen(e, sala)}
              />
            </h3>
          ))}
        </div>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setEditingSala(null); // Para crear una nueva sala
            setModalOpen(true);
          }}
        >
          Agregar Sala
        </Button>
      </div>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            setEditingSala(menuSala);
            setModalOpen(true);
            handleMenuClose();
          }}
        >
          Editar
        </MenuItem>
        <MenuItem onClick={handleDeleteSala}>Borrar</MenuItem>
      </Menu>

      <SalaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveSala}
        sala={editingSala}
      />

      <div style={{ display: "flex" }}>
        <div style={{ flex: 1 }}>
          {selectedSala && (
            <Mesa salaId={selectedSala.id} onSelectMesa={handleSelectMesa} />
          )}
        </div>
        <div style={{ flex: 0.5, padding: "20px", backgroundColor: "#f7f7f7" }}>
          {view === "mesaEditor" && selectedMesa && (
            <MesaEditor mesa={selectedMesa} onAbrirPedido={handleAbrirPedido} />
          )}
          {view === "pedidoEditor" && selectedMesa && (
            <PedidoEditor
              mesa={selectedMesa}
              onVolver={handleVolverAMesaEditor}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default Sala;
