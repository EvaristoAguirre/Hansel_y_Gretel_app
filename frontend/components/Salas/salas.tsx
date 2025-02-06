import React from "react";
import { AppBar, Tabs, Tab, Button, Menu, MenuItem, Box } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Mesa from "../Mesa/Mesa";
import SalaModal from "./SalaModal";
import useSala from "../Hooks/useSala";
import { StepperTable } from "../Mesa/StepperTable";

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
          "& .MuiTabs-root css-19dy00f-MuiTabs-root": {
            height: "100%",
          },
          backgroundColor: "#f3d49ab8",
          color: "black",
          gap: 4,
          borderBottom: "2px solid #856D5E",
          boxShadow: "none",
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          height: "4rem",
          px: 4,
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
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",

            },
            "& .MuiTab-root.Mui-selected": {
              backgroundColor: "#D9CCBC !important",
              borderTopLeftRadius: "20px",
              borderTopRightRadius: "20px",
              borderLeft: "2px solid #856D5E",
              borderRight: "2px solid #856D5E",
              borderTop: "2px solid #856D5E",
              height: "100%",
            },
            "& .MuiTabs-indicator": {
              display: "none",
            },
            "& .MuiTabs-flexContainer": {
              height: "100%",
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
                      justifyContent: "space-between",
                      gap: 2,
                      height: "100%",
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
                  textTransform: "uppercase",
                  height: "100%",
                }}
              />
            ))}
        </Tabs>

        <Button
          variant="outlined"
          sx={{
            border: "1.5px solid #63412c",
            mx: 4,
            marginBottom: 1,
            "&:hover": {
              backgroundColor: "primary.main",
              color: "white",
              borderColor: "primary.main",
            },
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
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <Box sx={{ flex: 1, backgroundColor: "#D9CCBC", p: 2 }}>
          {/* Verifica que selectedSala tenga datos */}
          {selectedSala && (
            <Mesa salaId={selectedSala.id} onSelectMesa={handleSelectMesa} />
          )}
        </Box>
        <Box sx={{ flex: 0.6, p: 2, backgroundColor: "#D9CCBC" }}>
          {selectedMesa && (
            // <MesaEditor
            //   mesa={selectedMesa}
            //   onAbrirPedido={handleAbrirPedido}
            //   view={view || ""}
            // />
            <>
              <div>
                <h2
                  style={{
                    height: "3rem",
                    backgroundColor: "#7e9d8a",
                    fontSize: "1.2rem",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#ffffff",
                    margin: "1rem 0",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                  }}
                >
                  MESA: {selectedMesa.name}
                </h2>
              </div>
              {
                selectedMesa ? (
                  <StepperTable
                    mesa={selectedMesa}
                    view={view || ""}
                    onAbrirPedido={handleAbrirPedido}
                  />

                ) : (null)
              }
            </>
          )}
        </Box>
      </Box>

    </>
  );
};

export default Salas;
