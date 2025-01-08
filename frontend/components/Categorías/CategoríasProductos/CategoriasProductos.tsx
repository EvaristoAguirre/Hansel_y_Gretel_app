"use client";
import React, { useEffect, useState } from "react";
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

const CategoriasProductos: React.FC = () => {
  const {
    categories,
    setCategories,
    addCategory,
    removeCategory,
    updateCategory,
    connectWebSocket,
  } = useCategoryStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "edit">("create");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [nombre, setNombre] = useState("");

  // Obtener categorías al cargar el componente
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch(URI_CATEGORY, { method: "GET" });
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        Swal.fire("Error", "No se pudieron cargar las categorías.", "error");
        console.error(error);
      }
    }

    fetchCategories();
    connectWebSocket();
  }, [setCategories, connectWebSocket]);

  // Filas para la DataGrid
  const rows: GridRowsProp = categories.map((category) => ({
    id: category.id,
    name: category.name,
  }));

  // Columnas para la DataGrid
  const columns: GridColDef[] = [
    { field: "name", headerName: "Nombre", width: 200 },
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
            onClick={() => handleOpenEditModal(params.row.id, params.row.name)}
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

  // Manejo de modal
  const handleOpenCreateModal = () => {
    setNombre("");
    setModalType("create");
    setModalOpen(true);
  };

  const handleOpenEditModal = (id: string, name: string) => {
    setSelectedCategoryId(id);
    setNombre(name);
    setModalType("edit");
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setNombre("");
    setSelectedCategoryId(null);
    setModalOpen(false);
  };

  // Crear categoría
  const handleCreate = async () => {
    try {
      const response = await fetch(URI_CATEGORY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nombre }),
      });
      const newCategory = await response.json();
      addCategory(newCategory);
      Swal.fire("Éxito", "Categoría creada correctamente.", "success");
      handleCloseModal();
    } catch (error) {
      Swal.fire("Error", "No se pudo crear la categoría.", "error");
      console.error(error);
    }
  };

  // Editar categoría
  const handleEdit = async () => {
    if (!selectedCategoryId) return;

    try {
      const response = await fetch(`${URI_CATEGORY}/${selectedCategoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nombre }),
      });
      const updatedCategory = await response.json();
      updateCategory(updatedCategory);
      Swal.fire("Éxito", "Categoría actualizada correctamente.", "success");
      handleCloseModal();
    } catch (error) {
      Swal.fire("Error", "No se pudo actualizar la categoría.", "error");
      console.error(error);
    }
  };

  // Eliminar categoría
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
        await fetch(`${URI_CATEGORY}/${id}`, { method: "DELETE" });
        removeCategory(id);
        Swal.fire("Eliminado", "Categoría eliminada correctamente.", "success");
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar la categoría.", "error");
        console.error(error);
      }
    }
  };

  return (
    <div>
      {/* Barra de navegación */}
      <div
        style={{
          height: "50px",
          backgroundColor: "#515050",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
        }}
      >
        <h3 style={{ color: "#ffffff", margin: "0 20px" }}>
          Categorías Productos
        </h3>
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenCreateModal}
          style={{ marginLeft: "auto" }}
        >
          Nueva Categoría
        </Button>
      </div>

      {/* Tabla */}
      <div style={{ height: 300, width: "60%", margin: "1.5rem auto" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          localeText={esES.components.MuiDataGrid.defaultProps.localeText}
        />
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onClose={handleCloseModal}>
        <DialogTitle>
          {modalType === "create" ? "Crear Categoría" : "Editar Categoría"}
        </DialogTitle>
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

export default CategoriasProductos;
