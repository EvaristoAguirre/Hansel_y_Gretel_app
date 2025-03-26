"use client";
import React, { useEffect, useState } from "react";
import { DataGrid, GridRowsProp, GridColDef } from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales/esES";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from "@mui/material";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faEdit } from "@fortawesome/free-solid-svg-icons";
import { createCategory, deleteCategory, editCategory, fetchCategories, fetchCategoriesByName } from "@/api/categories";
import { useAuth } from "@/app/context/authContext";
import { useCategoryStore } from "../../Categories/useCategoryStore";
import { capitalizeFirstLetterTable } from "@/components/Utils/CapitalizeFirstLetter";

const ProductsCategory: React.FC = () => {
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
  const { getAccessToken } = useAuth();
  const [nombre, setNombre] = useState("");
  const [errorNombre, setErrorNombre] = useState("");

  const token = getAccessToken();
  // Validar si el nombre ya existe mientras se escribe
  useEffect(() => {
    const validarNombre = async () => {
      if (!nombre.trim()) {
        setErrorNombre("El nombre no puede estar vacío.");
        return;
      }

      const token = getAccessToken();
      if (!token) return;

      const checkResponse = await fetchCategoriesByName(token, nombre);
      if (checkResponse?.ok && checkResponse.data.length > 0) {
        setErrorNombre("Este nombre ya está en uso.");
      } else {
        setErrorNombre("");
      }
    };

    const delayDebounceFn = setTimeout(() => {
      validarNombre();
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [nombre, getAccessToken]);

  // Manejo del campo de entrada
  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNombre(e.target.value);
  };


  // Obtener categorías al cargar el componente
  useEffect(() => {
    const fetchData = async () => {
      const token = getAccessToken();
      if (!token) return;
      try {
        const data = await fetchCategories(token);
        setCategories(data);
        connectWebSocket();
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
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
            color="primary"
            sx={{ mt: 2 }}
            size="small"
            onClick={() => handleOpenEditModal(params.row.id, params.row.name)}
          >
            <FontAwesomeIcon icon={faEdit} />
          </Button>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
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


  const handleCreate = async () => {
    if (!token) return;
    try {
      const createdCategory = await createCategory(nombre, token);
      // addCategory(createdCategory);
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
    if (!token) return;
    try {
      const updatedCategory = await editCategory(selectedCategoryId, nombre, token);
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
        const deletedCategory = await deleteCategory(id, token as string);
        removeCategory(id);
        Swal.fire("Eliminado", "Categoría eliminada correctamente.", "success");
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar la categoría.", "error");
        console.error(error);
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenCreateModal}
          sx={{ margin: 2, height: 56 }}
        >
          Nueva Categoría
        </Button>
      </Box>

      {/* Tabla */}
      <Box sx={{ height: 450, ml: 2 }}>
        <DataGrid
          rows={capitalizeFirstLetterTable(rows, ["name"])}
          columns={columns}
          localeText={esES.components.MuiDataGrid.defaultProps.localeText}
        />
      </Box>

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
            value={nombre}
            onChange={handleNombreChange}
            fullWidth
            variant="outlined"
            error={!!errorNombre}
            helperText={errorNombre}
          />

        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="primary">
            Cancelar
          </Button>
          <Button
            onClick={modalType === "create" ? handleCreate : handleEdit}
            color="primary"
            disabled={!!errorNombre}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductsCategory;
