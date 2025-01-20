"use client";
import React, { useEffect, useState } from "react";
import { useProductStore } from "./useProductStore"; // Hook similar a useCategoryStore, pero para productos
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
import { URI_PRODUCT } from "../URI/URI";

interface ProductForm {
  code: null;
  name: string;
  description: string;
  price: number;
  cost: number;
}

const Productos: React.FC = () => {
  const {
    products,
    setProducts,
    addProduct,
    removeProduct,
    updateProduct,
    connectWebSocket,
  } = useProductStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "edit">("create");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );
  const [form, setForm] = useState<ProductForm>({
    code: null,
    name: "",
    description: "",
    price: 0,
    cost: 0,
  });

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch(URI_PRODUCT, { method: "GET" });
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        Swal.fire("Error", "No se pudieron cargar los productos.", "error");
        console.error(error);
      }
    }

    fetchProducts();
    connectWebSocket();
  }, [setProducts, connectWebSocket]);

  const rows: GridRowsProp = products.map((product) => ({
    id: product.id,
    code: product.code,
    name: product.name,
    description: product.description,
    price: product.price,
    cost: product.cost,
  }));

  const columns: GridColDef[] = [
    { field: "code", headerName: "Código", width: 100 },
    { field: "name", headerName: "Nombre", width: 200 },
    { field: "description", headerName: "Descripción", width: 300 },
    { field: "price", headerName: "Precio", width: 100 },
    { field: "cost", headerName: "Costo", width: 100 },
    {
      field: "actions",
      headerName: "Acciones",
      width: 150,
      renderCell: (params) => (
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <Button
            variant="contained"
            color="secondary"
            size="small"
            onClick={() =>
              handleOpenEditModal(params.row.id, {
                code: params.row.code,
                name: params.row.name,
                description: params.row.description,
                price: params.row.price,
                cost: params.row.cost,
              })
            }
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

  const handleOpenCreateModal = (product: ProductForm) => {
    setForm(product);
    setModalType("create");
    setModalOpen(true);
  };

  const handleOpenEditModal = (id: string, product: ProductForm) => {
    setSelectedProductId(id);
    setForm(product);
    setModalType("edit");
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setForm({ code: null, name: "", description: "", price: 0, cost: 0 });
    setSelectedProductId(null);
    setModalOpen(false);
  };

  const handleCreate = async () => {
    try {
      const response = await fetch(URI_PRODUCT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const newProduct = await response.json();
      console.log(newProduct);
      addProduct(newProduct);
      Swal.fire("Éxito", "Producto creado correctamente.", "success");
      handleCloseModal();
    } catch (error) {
      Swal.fire("Error", "No se pudo crear el producto.", "error");
      console.error(error);
    }
  };

  const handleEdit = async () => {
    if (!selectedProductId) return;

    try {
      const response = await fetch(`${URI_PRODUCT}/${selectedProductId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const updatedProduct = await response.json();
      updateProduct(updatedProduct);
      Swal.fire("Éxito", "Producto actualizado correctamente.", "success");
      handleCloseModal();
    } catch (error) {
      Swal.fire("Error", "No se pudo actualizar el producto.", "error");
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed) {
      try {
        await fetch(`${URI_PRODUCT}/${id}`, { method: "DELETE" });
        removeProduct(id);
        Swal.fire("Eliminado", "Producto eliminado correctamente.", "success");
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar el producto.", "error");
        console.error(error);
      }
    }
  };

  return (
    <div>
      <div
        style={{
          height: "50px",
          backgroundColor: "#515050",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
        }}
      >
        <h3 style={{ color: "#ffffff", margin: "0 20px" }}>Productos</h3>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpenCreateModal(form)}
          style={{ marginLeft: "auto" }}
        >
          Nuevo Producto
        </Button>
      </div>

      {/* Verifica si no hay productos */}
      {products.length === 0 ? (
        <p style={{ textAlign: "center", marginTop: "2rem" }}>
          No hay productos disponibles.
        </p>
      ) : (
        <div style={{ height: 400, width: "80%", margin: "1.5rem auto" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            getRowId={(row) => row.id}
          />
        </div>
      )}

      <Dialog open={modalOpen} onClose={handleCloseModal}>
        <DialogTitle>
          {modalType === "create" ? "Crear Producto" : "Editar Producto"}
        </DialogTitle>
        <DialogContent>
          {(
            ["code", "name", "description", "price", "cost"] as Array<
              keyof ProductForm
            >
          ).map((field) => (
            <TextField
              key={field}
              margin="dense"
              label={field}
              type={
                ["code", "price", "cost"].includes(field) ? "number" : "text"
              } // Mantén el tipo "number" para campos numéricos
              inputProps={
                ["price", "cost"].includes(field)
                  ? { step: "0.50" } // Permite decimales con un paso de 0.01
                  : undefined
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  [field]: ["price", "cost"].includes(field)
                    ? e.target.value === ""
                      ? null
                      : parseFloat(e.target.value) // Convierte a decimal
                    : ["code"].includes(field)
                    ? e.target.value === ""
                      ? null
                      : parseInt(e.target.value, 10) // Sigue permitiendo enteros para "code"
                    : e.target.value,
                })
              }
              value={form[field] ?? ""}
              fullWidth
              variant="outlined"
            />
          ))}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseModal} color="primary">
            Cancelar
          </Button>
          <Button
            onClick={modalType === "create" ? handleCreate : handleEdit}
            color="primary"
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Productos;
