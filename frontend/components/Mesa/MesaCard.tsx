import React from "react";
import { MesaCardProps } from "../Interfaces/Cafe_interfaces";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Button } from "@mui/material";
import useMesa from "../Hooks/useMesa";



const MesaCard: React.FC<MesaCardProps> = ({ mesa, handleOpenModal, handleDelete, setSelectedMesa }) => {


  return (
    <div
      style={{
        width: "14rem",
        height: "5rem",
        backgroundColor: mesa.state === "closed" ? "#f28b82" : "#aed581",
        display: "flex",
        flexDirection: "column",  
        justifyContent: "center",
        alignItems: "center",
      }}
      onClick={() => setSelectedMesa(mesa)}
    >
      <h3 style={{ fontSize: "1rem" }}>{mesa.name}</h3>
      <div style={{ display: "flex", justifyContent: "center", flexDirection: "row", alignItems: "center" }}>
        <Button style={{ marginLeft: "0.5rem" }}>
          <VisibilityIcon />
        </Button>
        <Button
          style={{ marginLeft: "0.5rem" }}
          onClick={(e) => {
            e.stopPropagation(); // Evita que el evento onClick de la tarjeta también se dispare
            handleOpenModal("edit", mesa);
          }}
        >
          <EditIcon />
        </Button>
        <Button
          style={{ marginLeft: "0.5rem" }}
          onClick={(e) => {
            e.stopPropagation(); // Evita conflictos con el onClick de la tarjeta
            handleDelete(mesa.id);
          }}
        >
          <DeleteIcon />
        </Button>
      </div>
    </div>
  );
};

export default MesaCard;
