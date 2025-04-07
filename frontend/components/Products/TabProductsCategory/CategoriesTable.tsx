"use client";
import React, { useEffect, useState } from "react";
import { DataGrid, GridRowsProp, GridColDef } from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales/esES";
import { Button, Box } from "@mui/material";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faEdit } from "@fortawesome/free-solid-svg-icons";

import { createCategory, deleteCategory, editCategory, fetchCategories } from "@/api/categories";
import { useAuth } from "@/app/context/authContext";
import { useCategoryStore } from "@/components/Categories/useCategoryStore";
import { capitalizeFirstLetterTable } from "@/components/Utils/CapitalizeFirstLetter";
import { useCategoryForm } from "./useCategoryForm";
import CategoryModal from "./CategoryModal";
import LoadingLottie from "@/components/Loader/Loading";

const CategoriesTable: React.FC = () => {
  const {
    categories,
    setCategories,
    removeCategory,
    updateCategory,
    connectWebSocket,
  } = useCategoryStore();

  const { getAccessToken } = useAuth();
  const token = getAccessToken();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "edit">("create");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const { nombre, setNombre, errorNombre } = useCategoryForm(token);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      setLoading(true);

      try {
        const data = await fetchCategories(token);
        if (data) setCategories(data);
        connectWebSocket();
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, setCategories, connectWebSocket]);


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
      await createCategory(nombre, token);
      Swal.fire("Éxito", "Categoría creada correctamente.", "success");
      handleCloseModal();
    } catch (error) {
      Swal.fire("Error", "No se pudo crear la categoría.", "error");
      console.error(error);
    }
  };

  const handleEdit = async () => {
    if (!selectedCategoryId || !token) return;
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

  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed && token) {
      try {
        await deleteCategory(id, token);
        removeCategory(id);
        Swal.fire("Eliminado", "Categoría eliminada correctamente.", "success");
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar la categoría.", "error");
        console.error(error);
      }
    }
  };

  const rows: GridRowsProp = categories.map((category) => ({
    id: category.id,
    name: category.name,
  }));

  const columns: GridColDef[] = [
    { field: "name", headerName: "Nombre", width: 200 },
    {
      field: "actions",
      headerName: "Acciones",
      width: 150,
      renderCell: (params) => (
        <Box display="flex" gap={1} justifyContent="center" sx={{ mt: 2 }}>
          <Button
            variant="contained"
            size="small"
            onClick={() => handleOpenEditModal(params.row.id, params.row.name)}
          >
            <FontAwesomeIcon icon={faEdit} />
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => handleDelete(params.row.id)}
          >
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        </Box>
      ),
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <LoadingLottie />
      </Box>
    );
  }

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

      <Box sx={{ height: 450, ml: 2 }}>
        <DataGrid
          rows={capitalizeFirstLetterTable(rows, ["name"])}
          columns={columns}
          localeText={esES.components.MuiDataGrid.defaultProps.localeText}
        />
      </Box>

      <CategoryModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSave={modalType === "create" ? handleCreate : handleEdit}
        nombre={nombre}
        setNombre={setNombre}
        errorNombre={errorNombre}
        modalType={modalType}
      />
    </Box>
  );
};

export default CategoriesTable;
