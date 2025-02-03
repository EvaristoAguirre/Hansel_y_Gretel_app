import React from "react";
import { AppBar, Tabs, Tab, Button, Menu, MenuItem, Box } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Mesa from "../Mesa/Mesa";
import MesaEditor from "../Mesa/MesaEditor";
import SalaModal from "./SalaModal";
import useSala from "../Hooks/useSala";

const Salas = () => {
  const {
    salas,
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
      {/* Barra de navegación con Tabs */}
      <AppBar
        position="static"
        sx={{
          backgroundColor: "#f3d49ab8",
          mt: 13,
          color: "black",
          gap: 4,
          borderBottom: "2px solid #f9b32d",
          boxShadow: "none",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          height: "3rem",
        }}
      >
        <Tabs
          value={selectedSala?.id || false}
          onChange={(_, newValue) => {
            const salaSeleccionada = salas.find((sala) => sala.id === newValue);
            setSelectedSala(salaSeleccionada || null);
          }}
          textColor="inherit"
          sx={{
            "& .MuiTab-root": {
              fontWeight: "bold !important",
              width: "auto",
              flex: 1,
            },
            "& .MuiTab-root.Mui-selected": {
              color: "white !important",
              backgroundColor: "#63412c !important",
            },
            "& .MuiTabs-indicator": {
              display: "none",
            },
          }}
        >
          {Array.isArray(salas) &&
            salas.map((sala) => (
              <Tab
                key={sala.id}
                label={
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    {sala.name}
                    <MoreVertIcon
                      sx={{ cursor: "pointer" }}
                      onClick={(e) => handleMenuOpen(e, sala)}
                    />
                  </Box>
                }
                value={sala.id}
                sx={{
                  textTransform: "none",
                }}
              />
            ))}
        </Tabs>

        <Button
          variant="outlined"
          sx={{
            border: "1.5px solid #63412c",
            color: "black",
          }}
          onClick={() => {
            setEditingSala(null);
            setModalOpen(true);
          }}
        >
          Agregar Sala
        </Button>
      </AppBar>

      {/* Menú de opciones */}
      <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
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

      {/* Modal de sala */}
      <SalaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveSala}
        sala={editingSala}
      />

      {/* Contenido de las mesas */}
      <Box sx={{ display: "flex" }}>
        <Box sx={{ flex: 1, backgroundColor: selectedSala ? "#63412c33" : "transparent", p: 2 }}>
          {selectedSala && <Mesa salaId={selectedSala.id} onSelectMesa={handleSelectMesa} />}
        </Box>
        <Box sx={{ flex: 0.6, p: 2, backgroundColor: "#f7f7f7" }}>
          {selectedMesa && (
            <MesaEditor
              mesa={selectedMesa}
              onAbrirPedido={handleAbrirPedido}
              view={view || ""}
            />
          )}
        </Box>
      </Box>
    </>
  );
};

export default Salas;
