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
import LoadingLottie from "../Loader/Loading";

const Rooms = () => {
  const {
    rooms,
    selectedRoom,
    handleSelectRoom,
    selectedTable,
    view,
    modalOpen,
    setModalOpen,
    editingRoom,
    setEditingRoom,
    menuAnchorEl,
    menuRoom,
    handleSaveRoom,
    handleDeleteRoom,
    handleSelectTable,
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
        position="relative"
        sx={{
          backgroundColor: "#f3d49ab8",
          color: "black",
          gap: 2,
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
          value={selectedRoom?.id || false}
          onChange={(_, newValue) => {
            const salaSeleccionada = rooms.find((room) => room.id === newValue);

            handleSelectRoom(salaSeleccionada || null);
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
          {Array.isArray(rooms) &&
            rooms.map((room) => (
              <Tab
                key={room.id}
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
                      {room.name}
                    </span>
                    <MoreVertIcon
                      sx={{ cursor: "pointer" }}
                      onClick={(e) => handleMenuOpen(e, room)}
                    />
                  </Box>
                }
                value={room.id}
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
                setEditingRoom(null);
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
                setEditingRoom(menuRoom);
                setModalOpen(true);
                handleMenuClose();
              }}
            >
              Editar
            </MenuItem>
            <MenuItem onClick={handleDeleteRoom}>Borrar</MenuItem>
          </Menu>
        )
      }

      {/* Modal de Room */}
      <RoomModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveRoom}
        room={editingRoom}
      />

      {/* Contenido de las mesas y editor pedido */}
      <Box className="flex flex-col lg:flex-row min-h-screen"
      >
        {/* contenedor de Mesas */}
        <Box
          className="w-full p-2 ">
          {selectedRoom && (
            <Table salaId={selectedRoom.id} onSelectTable={handleSelectTable} />
          )}
        </Box>
        {/* contenedor de Armar pedido */}
        <Box className="w-full p-2 lg:w-3/4">
          {selectedTable && (
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
                  MESA: {selectedTable?.name}
                </h2>
              </div>
              {
                selectedTable ? (
                  <StepperTable
                    selectedTable={selectedTable}
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
