"use client";
import React from "react";
import { DataGrid, GridRowsProp, GridColDef } from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales/esES";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
} from "@mui/material";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faEdit } from "@fortawesome/free-solid-svg-icons";

const IngredientsCategory = () => {
  const [nombre, setNombre] = React.useState("");
  const categorias = [
    {
      nombre: "Bebidas",
      productos: ["Coca-cola", "Sprite", "Cerveza"],
      id: "1",
    },
    {
      nombre: "Cafetería",
      productos: ["Café mediano", "Café grande"],
      id: "2",
    },
    {
      nombre: "Pastelería",
      productos: ["Torta", "Struddel de manzana"],
      id: "3",
    },
  ];
  const [categoria, setCategoria] = React.useState(categorias);
  const [open, setOpen] = React.useState(false);
  const [openCrear, setOpenCrear] = React.useState(false);
  const [id, setId] = React.useState("");

  //handlers
  const handleEliminar = (id: string) => {
    alert(`Categoría con id ${id} eliminado`);
    const index = categorias.findIndex((item) => item.id === id);
    if (index > -1) {
      categorias.splice(index, 1);
    }
  };

  const handleModificar = (id: string, nombreNuevo: string) => {
    alert(`Categoría con id ${id} modificado`);
    categorias.forEach((categoria) => {
      if (categoria.id == id) {
        categoria.nombre = nombreNuevo;
      }
    });
  };

  const CrearCategoria = (nombre: string) => {
    categorias.push({ nombre: nombre, productos: [], id: "4" })
  }

  //Configuración DataGrid
  const rows: GridRowsProp = categorias.map((categoria) => ({
    col1: categoria.nombre,
    col2: categoria.productos.length,
    id: categoria.id,
  }));

  const columns: GridColDef[] = [
    { field: "col1", headerName: "Nombre", width: 150 },
    { field: "col2", headerName: "Cantidad de productos", width: 150 },
    { field: "id", headerName: "ID", width: 150 },
    {
      field: "col4",
      headerName: "Acciones",
      width: 150,
      renderCell: (params) => (
        <div
          style={{
            display: "flex",
            gap: "8px",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Button
            variant="contained"
            color="secondary"
            size="small"
            style={{ margin: "1rem 0" }}
            onClick={() => {
              handleOpen(), setId(params.row.id);
            }}
          >
            <FontAwesomeIcon icon={faEdit} />
          </Button>
          <Button
            variant="contained"
            color="secondary"
            size="small"
            style={{ margin: "1rem 0" }}
            onClick={() => handleEliminar(params.row.id)}
          >
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        </div>
      ),
    },
  ];

  //handlers modal
  const handleOpen = () => setOpen(true);
  const handleOpenCrear = () => setOpenCrear(true);
  const handleClose = () => setOpen(false);
  const handleCloseCrear = () => setOpenCrear(false);



  return (
    <div>
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
              handleClose(), handleModificar(id, nombre);
            }}
            color="primary"
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

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
              handleCloseCrear(), CrearCategoria(nombre);
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

export default IngredientsCategory;
