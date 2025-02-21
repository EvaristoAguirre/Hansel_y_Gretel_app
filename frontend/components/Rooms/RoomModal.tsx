import React, { useState, useEffect } from "react";
import { Modal, TextField, Button } from "@mui/material";
import Swal from "sweetalert2";
import { SalaModalProps } from "../Interfaces/Cafe_interfaces";



const RoomModal = ({ open, onClose, onSubmit, sala }: SalaModalProps) => {
  const [name, setName] = useState("");

  useEffect(() => {
    if (sala) {
      setName(sala.name || "");
    } else {
      setName("");
    }
  }, [sala]);

  const handleSave = () => {
    if (!name.trim()) {
      Swal.fire("Error", "El nombre de la sala es obligatorio.", "error");
      return;
    }
    onSubmit({ id: sala?.id, name });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "400px",
          backgroundColor: "#fff",
          padding: "20px",
          boxShadow: "0px 0px 15px rgba(0,0,0,0.2)",
          borderRadius: "8px",
        }}
      >
        <h2>{sala ? "Editar Sala" : "Agregar Sala"}</h2>
        <TextField
          label="Nombre de la Sala"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          margin="normal"
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
          <Button onClick={onClose} style={{ marginRight: "10px" }} color="secondary">
            Cancelar
          </Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {sala ? "Guardar Cambios" : "Crear Sala"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RoomModal;
