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

const Producto = () => {
  const [open, setOpen] = React.useState(false);
  const [nombre, setNombre] = React.useState("");
  const [costo, setCosto] = React.useState("");
  const [precio, setPrecio] = React.useState("");
  const [codigo, setCodigo] = React.useState("");
  const [productos, setProductos] = React.useState([
    { id: "", nombre: "", costo: "", precio: "", categoria: "" },
  ]);
  const [categoria, setCategoria] = React.useState("");
  const categorias = ["Bebidas", "Cafetería", "Pastelería"];
  const Swal = require("sweetalert2");

  const handleEliminar = (id: string) => {
    alert(`Producto con id ${id} eliminado`);
  };

  const handleModificar = (id: string) => {
    alert(`Producto con id ${id} modificado`);
  };

  const rows: GridRowsProp = productos.map((producto) => ({
    id: producto.id,
    col1: producto.nombre,
    col2: producto.costo,
    col3: producto.precio,
  }));

  const columns: GridColDef[] = [
    { field: "id", headerName: "Código", width: 150 },
    { field: "col1", headerName: "Producto", width: 150 },
    { field: "col2", headerName: "Costo", width: 150 },
    { field: "col3", headerName: "Precio", width: 150 },
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
            onClick={() => handleModificar(params.row.id)}
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

  // Funciones para abrir y cerrar el modal
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  //Función para crear un producto (MOCK)

  const createProduct = (
    nombre: string,
    costo: string,
    precio: string,
    categoria: string,
    codigo: string
  ) => {
    const producto = {
      id: codigo,
      nombre: nombre,
      costo: costo,
      precio: precio,
      categoria: categoria,
    };
    setProductos([...productos, producto]);
  };

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

        {/*botón modal crear producto */}

        <div
          onClick={handleOpen}
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
          <h3 style={{ color: "#2b2b2b" }}>Nuevo producto</h3>
        </div>

        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Nuevo Producto</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Nombre del producto"
              onChange={(e) => setNombre(e.target.value)}
              value={nombre}
              fullWidth
              variant="outlined"
            />
            <TextField
              margin="dense"
              label="Precio"
              onChange={(e) => setPrecio(e.target.value)}
              value={precio}
              type="number"
              fullWidth
              variant="outlined"
            />
            <TextField
              margin="dense"
              label="Costo"
              onChange={(e) => setCosto(e.target.value)}
              value={costo}
              type="number"
              fullWidth
              variant="outlined"
            />
            <TextField
              margin="dense"
              label="Código"
              onChange={(e) => setCodigo(e.target.value)}
              value={codigo}
              type="number"
              fullWidth
              variant="outlined"
            />
            <TextField
              margin="dense"
              label="Categoría"
              onChange={(e) => setCategoria(e.target.value)}
              select
              fullWidth
            >
              {categorias.map((categoria) => (
                <MenuItem value={categoria}>{categoria}</MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary">
              Cancelar
            </Button>
            <Button
              onClick={() => {
                handleClose(),
                  createProduct(nombre, costo, precio, categoria, codigo);
              }}
              color="primary"
            >
              Guardar
            </Button>
          </DialogActions>
        </Dialog>
      </div>

      <div
        className="layout-categorias"
        style={{
          display: "flex",
          height: "100%",
        }}
      >
        <div
          className="categorias"
          style={{
            backgroundColor: "#2B2B2B",
            height: "30rem",
          }}
        >
          {categorias.map((categoria) => (
            <div
              style={{
                width: "14rem",
                height: "4rem",
                backgroundColor: "#2B2B2B",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <h3
                style={{
                  fontSize: "1rem",
                  color: "#ededed",
                }}
              >
                {categoria}
              </h3>
            </div>
          ))}
        </div>

        <div style={{ height: 300, width: "100%", margin: "1.5rem" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
          />
        </div>
      </div>
    </div>
  );
};

export default Producto;
