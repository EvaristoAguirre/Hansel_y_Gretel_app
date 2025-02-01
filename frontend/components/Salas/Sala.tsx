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
import useSala from "../Hooks/useSala";

const Sala = () => {
  const {
    salas,
    setSalas,
    selectedSala,
    setSelectedSala,
    selectedMesa,
    setSelectedMesa,
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
    handleMenuClose,
  } = useSala();

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
          {Array.isArray(salas) &&
            salas.map((sala) => (
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
        <div style={{ flex: 0.6, padding: "20px", backgroundColor: "#f7f7f7" }}>
          {selectedMesa && (
            <MesaEditor
              mesa={selectedMesa}
              onAbrirPedido={handleAbrirPedido}
              view={view || ""}
            />
          )}

          {/* {view === "pedidoEditor" && selectedMesa && (
            <PedidoEditor
              mesa={selectedMesa}
              onVolver={handleVolverAMesaEditor}
            />
          )} */}
        </div>
      </div>
    </>
  );
};

export default Sala;
