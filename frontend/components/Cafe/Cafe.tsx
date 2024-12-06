"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
} from "@mui/material";
import Swal from "sweetalert2";

const Cafe = () => {
  const [salas, setSalas] = useState([
    { id: "1", nombre: "Sala Principal" },
    { id: "2", nombre: "Terraza" },
  ]); 
  
  const [mesas, setMesas] = useState([
    {
      id: "101",
      nombre: 1,
      cliente: null,
      pedido: null,
      comentario: "",
      estado: "disponible",
      disponibilidad: "disponible",
      salaId: "1",
    },
    {
      id: "102",
      nombre: "Mesa VIP",
      cliente: "Juan Pérez",
      pedido: "Pedido001",
      comentario: "Celebración cumpleaños",
      estado: "pidioCuenta",
      disponibilidad: "ocupada",
      salaId: "2",
    },
  ]); 
  
  const [selectedSala, setSelectedSala] = useState(null); // Sala seleccionada

  const URI_SALAS = "http://localhost:3000/salas"; // Endpoint para Salas
  const URI_MESAS = "http://localhost:3000/mesas"; // Endpoint para Mesas


  const [selectedMesa, setSelectedMesa] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Abrir modal al seleccionar una mesa
  const handleOpenModal = (mesa) => {
    setSelectedMesa(mesa);
    setModalOpen(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setSelectedMesa(null);
    setModalOpen(false);
  };

  // Actualizar datos de la mesa
  const handleUpdateMesa = () => {
    setMesas((prevMesas) =>
      prevMesas.map((mesa) =>
        mesa.id === selectedMesa.id ? selectedMesa : mesa
      )
    );
    setModalOpen(false);
  };

  // Manejar cambios en los campos del formulario
  const handleChange = (field, value) => {
    setSelectedMesa({ ...selectedMesa, [field]: value });
  };


  // Función para crear una nueva sala
  const handleCreateSala = async () => {
    const { value: nombre } = await Swal.fire({
      title: "Crear nueva sala",
      input: "text",
      inputLabel: "Nombre de la sala",
      inputPlaceholder: "Ej. Sala 1",
      showCancelButton: true,
      confirmButtonText: "Crear",
      cancelButtonText: "Cancelar",
    });

    if (nombre) {
      try {
        const response = await fetch(URI_SALAS, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nombre }),
        });

        if (!response.ok) throw new Error("Error al crear la sala");

        const newSala = await response.json();
        setSalas([...salas, newSala]);
        Swal.fire("Éxito", "Sala creada correctamente.", "success");
      } catch (error) {
        Swal.fire("Error", "No se pudo crear la sala.", "error");
        console.error(error);
      }
    }
  };

  // Función para crear una nueva mesa
  const handleCreateMesa = async () => {
    if (!selectedSala) {
      Swal.fire("Error", "Debes seleccionar una sala primero.", "error");
      return;
    }

    const { value: nombre } = await Swal.fire({
      title: "Crear nueva mesa",
      input: "text",
      inputLabel: "Nombre o número de la mesa",
      inputPlaceholder: "Ej. Mesa 1",
      showCancelButton: true,
      confirmButtonText: "Crear",
      cancelButtonText: "Cancelar",
    });

    if (nombre) {
      try {
        const response = await fetch(URI_MESAS, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre,
            salaId: selectedSala.id, // Relación con la sala seleccionada
          }),
        });

        if (!response.ok) throw new Error("Error al crear la mesa");

        const newMesa = await response.json();
        setMesas([...mesas, newMesa]);
        Swal.fire("Éxito", "Mesa creada correctamente.", "success");
      } catch (error) {
        Swal.fire("Error", "No se pudo crear la mesa.", "error");
        console.error(error);
      }
    }
  };

  return (
    <div>
      {/* Header con las salas */}
      <div
        style={{
          height: "50px",
          backgroundColor: "#515050",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
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
              borderBottom: selectedSala?.id === sala.id ? "2px solid #ffffff" : "none",
            }}
            onClick={() => setSelectedSala(sala)}
          >
            {sala.nombre}
          </h3>
        ))}
        <button
          style={{
            marginLeft: "auto",
            backgroundColor: "#4CAF50",
            color: "#ffffff",
            border: "none",
            padding: "8px 12px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          onClick={handleCreateSala}
        >
          Crear Sala
        </button>
        <button
          style={{
            marginLeft: "10px",
            backgroundColor: "#2196F3",
            color: "#ffffff",
            border: "none",
            padding: "8px 12px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          onClick={handleCreateMesa}
        >
          Crear Mesa
        </button>
      </div>

      {/* Mesas de la sala seleccionada */}
      <div
        className="layout-mesas"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          padding: "20px",
        }}
      >
        {mesas.map((mesa) => (
          <div
            key={mesa.id}
            style={{
              width: "14rem",
              height: "4rem",
              backgroundColor: mesa.disponibilidad === "ocupada" ? "#f28b82" : "#aed581",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
            }}
            onClick={() => handleOpenModal(mesa)}
          >
            <h3 style={{ fontSize: "1rem" }}>{mesa.nombre}</h3>
          </div>
        ))}
      </div>

      {/* Modal para editar datos de la mesa */}
      <Dialog open={modalOpen} onClose={handleCloseModal}>
        <DialogTitle>Editar Mesa</DialogTitle>
        <DialogContent>
          {selectedMesa && (
            <>
              <TextField
                label="Nombre/Número"
                fullWidth
                margin="dense"
                value={selectedMesa.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
              />
              <TextField
                label="Cliente"
                fullWidth
                margin="dense"
                value={selectedMesa.cliente || ""}
                onChange={(e) => handleChange("cliente", e.target.value)}
              />
              <TextField
                label="Pedido"
                fullWidth
                margin="dense"
                value={selectedMesa.pedido || ""}
                onChange={(e) => handleChange("pedido", e.target.value)}
              />
              <TextField
                label="Comentario"
                fullWidth
                margin="dense"
                value={selectedMesa.comentario}
                onChange={(e) => handleChange("comentario", e.target.value)}
              />
              <Select
                fullWidth
                label="Estado"
                margin="dense"
                value={selectedMesa.estado}
                onChange={(e) => handleChange("estado", e.target.value)}
              >
                <MenuItem value="abierta">Abierta</MenuItem>
                <MenuItem value="pidioCuenta">Pidió Cuenta</MenuItem>
                <MenuItem value="cerrada">Cerrada</MenuItem>
              </Select>
              <Select
                fullWidth
                margin="dense"
                value={selectedMesa.disponibilidad}
                onChange={(e) => handleChange("disponibilidad", e.target.value)}
              >
                <MenuItem value="disponible">Disponible</MenuItem>
                <MenuItem value="ocupada">Ocupada</MenuItem>
              </Select>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="secondary">
            Cancelar
          </Button>
          <Button onClick={handleUpdateMesa} color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Cafe;
