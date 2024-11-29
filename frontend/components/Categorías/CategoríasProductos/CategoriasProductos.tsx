"use client";
import React, { useEffect } from "react";
import { useCategoryStore } from "../useCategoryStore";
import { DataGrid, GridRowsProp, GridColDef } from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales/esES";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faEdit } from "@fortawesome/free-solid-svg-icons";
import { URI_CATEGORY } from "../../URI/URI";

const CategoriasProductos = () => {
  const {
    categories,
    setCategories,
    addCategory,
    removeCategory,
    updateCategory,
    connectWebSocket,
  } = useCategoryStore();

  const [nombre, setNombre] = React.useState("");

  useEffect(() => {
    // Fetch inicial para obtener categorías.
    async function fetchCategories() {
      try {
        const response = await fetch(URI_CATEGORY, { method: "GET" });
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Error al listar las categorías:", error);
      }
    }

    fetchCategories();
    connectWebSocket(); // Conectar WebSocket.
  }, [setCategories, connectWebSocket]);

  const rows: GridRowsProp = categories.map((category) => ({
    id: category.id,
    col1: category.name,
  }));

  const columns: GridColDef[] = [
    { field: "col1", headerName: "Nombre", width: 150 },
    {
      field: "col2",
      headerName: "Acciones",
      width: 150,
      renderCell: (params) => (
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <Button
            variant="contained"
            color="secondary"
            size="small"
            onClick={() => handleOpen()}
          >
            <FontAwesomeIcon icon={faEdit} />
          </Button>
          <Button
            variant="contained"
            color="secondary"
            size="small"
            onClick={() => handleDelete(params.row.id)}
          >
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        </div>
      ),
    },
  ];

  async function handleDelete(id: string) {
    try {
      await fetch(`${URI_CATEGORY}/${id}`, { method: "DELETE" });
      removeCategory(id); // Actualiza el estado local.
    } catch (error) {
      console.error("Error al eliminar la categoría:", error);
    }
  }

  async function handleCreate() {
    try {
      const response = await fetch(URI_CATEGORY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nombre }),
      });
      const newCategory = await response.json();
      addCategory(newCategory); // Actualiza el estado local.
    } catch (error) {
      console.error("Error al crear la categoría:", error);
    }
  }

  async function handleEdit(id: string) {
    try {
      const response = await fetch(`${URI_CATEGORY}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nombre }),
      });
      const updatedCategory = await response.json();
      updateCategory(updatedCategory); // Actualiza el estado local.
    } catch (error) {
      console.error("Error al editar la categoría:", error);
    }
  }

  
  const [open, setOpen] = React.useState(false);
  const [openCrear, setOpenCrear] = React.useState(false);
  const [id, setId] = React.useState("");
  
  //handlers modal
  const handleOpen = () => setOpen(true);
  const handleOpenCrear = () => setOpenCrear(true);
  const handleClose = () => setOpen(false);
  const handleCloseCrear = () => setOpenCrear(false);

  return (
    <div>

      {/*Barra de navegación secundaria*/}
      <div
        style={{
          height: "50px",
          backgroundColor: "#515050",
          display: "flex",
          alignItems: "center",
        }}
      >
        <h3
          style={{
            fontSize: "1.25rem",
            color: "#ffffff",
            fontWeight: "400",
            margin: "0 50px",
          }}
        >
          Productos
        </h3>
        <h3
          style={{
            fontSize: "1.25rem",
            color: "#ffffff",
            fontWeight: "400",
            margin: "0 50px",
          }}
        >
          Ingredientes
        </h3>
        <h3
          style={{
            fontSize: "1.25rem",
            color: "#ffffff",
            fontWeight: "400",
            margin: "0 50px",
          }}
        >
          Categorías Productos
        </h3>
        <h3
          style={{
            fontSize: "1.25rem",
            color: "#ffffff",
            fontWeight: "400",
            margin: "0 20px",
          }}
        >
          Categorías Ingredientes
        </h3>
        <h3
          style={{
            fontSize: "1.25rem",
            color: "#ffffff",
            fontWeight: "400",
            margin: "0 50px",
          }}
        >
          Control de Stock
        </h3>

        <div
          onClick={handleOpenCrear}
          style={{
            backgroundColor: "#ededed",
            borderRadius: "5px",
            width: "9rem",
            height: "2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <h3 style={{ color: "#2b2b2b" }}>Nueva categoría</h3>
        </div>
      </div>

      {/*Tabla*/}
      <div style={{ height: 300, width: "60%", margin: "1.5rem" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          localeText={esES.components.MuiDataGrid.defaultProps.localeText}
        />
      </div>

      {/*modal editar categoría*/}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Editar categoría</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre de la categoría"
            onChange={(e) => setNombre(e.target.value)}
            value={nombre}
            fullWidth
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancelar
          </Button>
          <Button
            onClick={() => {
              handleClose(), handleEdit(id);
            }}
            color="primary"
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/*modal crear categoría*/}
      <Dialog open={openCrear} onClose={handleCloseCrear}>
        <DialogTitle>Crear categoría</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre de la categoría"
            onChange={(e) => setNombre(e.target.value)}
            value={nombre}
            fullWidth
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCrear} color="primary">
            Cancelar
          </Button>
          <Button
            onClick={() => {
              handleCloseCrear(), handleCreate();
            }}
            color="primary"
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CategoriasProductos;
