import React from "react";
import { MesaCardProps } from "../Interfaces/Cafe_interfaces";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Button, ListItemText, Tooltip } from "@mui/material";
import useMesa from "../Hooks/useMesa";
import { fontWeight, style } from "@mui/system";

const MesaCard: React.FC<MesaCardProps> = ({ mesa, handleOpenModal, handleDelete, setSelectedMesa }) => {
  return (
    <div
      style={{
        width: "30%",
        height: "5rem",
        backgroundColor: mesa.state === "closed" ? "#f28b82" : "#7e9d8a",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: "0.5rem",
        cursor: "pointer",
        transition: "background-color 0.3s ease",
      }}
      onClick={() => setSelectedMesa(mesa)}
    >
      <Tooltip title={"Mesa: " + mesa.name} arrow>
        <ListItemText
          style={{
            color: "#fff",
            textTransform: "uppercase",
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 1,
            overflow: "hidden",
            padding: "0.5rem",
          }}
          primary={mesa.name}
        />
      </Tooltip>
      <div style={{
        display: "flex", justifyContent: "center",
        marginTop: "0.5rem"
      }}>
        {/* BOTON DE VISUALIZAR */}
        <Tooltip title="Ver detalles" arrow>
          <Button
            sx={{
              minWidth: "2.5rem",
              color: "#fff",
              "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.2)" },
            }}
          >
            <VisibilityIcon />
          </Button>
        </Tooltip>

        {/* BOTON DE EDITAR */}
        <Tooltip title="Editar mesa" arrow>
          <Button
            sx={{
              minWidth: "2.5rem",
              color: "#fff",
              "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.2)" },
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenModal("edit", mesa);
            }}
          >
            <EditIcon />
          </Button>
        </Tooltip>

        {/* BOTON DE ELIMINAR */}
        <Tooltip title="Eliminar mesa" arrow>
          <Button
            sx={{
              minWidth: "2.5rem",
              color: "#fff",
              "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.2)" },
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(mesa.id);
            }}
          >
            <DeleteIcon />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};

export default MesaCard;
