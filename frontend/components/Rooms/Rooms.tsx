'useClient';
import React, { useEffect } from "react";
import { useState } from 'react';
import { AppBar, Tabs, Tab, Button, Menu, MenuItem, Box, tabsClasses } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { StepperTable } from "../Table/StepperTable";
import { useRoomContext } from '../../app/context/room.context';
import Table from "../Table/Table";
import { UserRole } from "../Enums/user";
import { useAuth } from '../../app/context/authContext';
import RoomModal from "./RoomModal";
import Typography from "@mui/system/typography";

const Rooms = () => {
  const {
    salas,
    selectedSala,
    handleSelectSala,
    selectedMesa,
    setSelectedMesa,
    view,
    modalOpen,
    setModalOpen,
    editingSala,
    setEditingSala,
    menuAnchorEl,
    menuSala,
    handleSaveSala,
    handleDeleteSala,
    handleSelectMesa,
    handleAbrirPedido,
    handleMenuOpen,
    handleMenuClose,
  } = useRoomContext();

  const [activeStep, setActiveStep] = useState<number>(0);
  const { userRoleFromToken } = useAuth();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(userRoleFromToken());
  }, []);

  return (
    <>
      {/* Barra de navegación con Tabs */}
      <AppBar
        position="sticky"
        sx={{
          // "& .MuiTabs-root css-19dy00f-MuiTabs-root": {
          //   height: "100%",
          // },
          backgroundColor: "#f3d49ab8",
          color: "black",
          gap: 2,
          // borderBottom: "2px solid #856D5E",
          boxShadow: "none",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          height: "4rem",
          pr: 2,
        }}
      >
        <Tabs
          value={selectedSala?.id || false}
          onChange={(_, newValue) => {
            const salaSeleccionada = salas.find((sala) => sala.id === newValue);

            handleSelectSala(salaSeleccionada || null);
          }}
          textColor="inherit"
          variant="scrollable"
          sx={{
            [`& .${tabsClasses.scrollButtons}`]: {
              '&.Mui-disabled': { opacity: 0.3 },
            },
            "& .MuiTab-root": {
              fontWeight: "bold !important",
            }
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
                    <span className="ml-4">
                      {sala.name}
                    </span>
                    <MoreVertIcon
                      sx={{ cursor: "pointer" }}
                      onClick={(e) => handleMenuOpen(e, sala)}
                    />
                  </Box>
                }
                value={sala.id}
                sx={{
                  textTransform: "uppercase",
                }}
              />
            ))}
        </Tabs>
        {
          role !== UserRole.MOZO && (

            <Button
              variant="outlined"
              sx={{
                fontSize: "12px",
                border: "1.5px solid #63412c",
                // marginTop: 10,
                width: "200px",
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
              Nueva Sala
            </Button>
          )
        }
      </AppBar>
      {/* Menú de opciones */}
      {
        role !== UserRole.MOZO && (
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
        )
      }

      {/* Modal de sala */}
      <RoomModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveSala}
        sala={editingSala}
      />

      {/* Contenido de las mesas y editor pedido */}
      <Box className="flex flex-col lg:flex-row min-h-screen"
      >
        {/* contenedor de Mesas */}
        <Box
          className="w-full p-2 ">
          {selectedSala && (
            <Table salaId={selectedSala.id} onSelectMesa={handleSelectMesa} />
          )}
        </Box>
        {/* contenedor de Armar pedido */}
        <Box className="w-full p-2 lg:w-3/4">
          {selectedMesa && (
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
                    margin: "0.5rem 0",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    borderRadius: "0.2rem",
                  }}
                >
                  MESA: {selectedMesa?.name}
                </h2>
              </div>
              {
                selectedMesa ? (
                  <StepperTable
                    selectedMesa={selectedMesa}
                    view={view || ""}
                    onAbrirPedido={handleAbrirPedido}
                    activeStep={activeStep}
                    setActiveStep={(step) => setActiveStep(step)}
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

export default Rooms;
