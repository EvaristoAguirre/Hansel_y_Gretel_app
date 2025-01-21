"use client";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Button } from "@mui/material";
import { GridCellParams } from "@mui/x-data-grid";
import React, { useEffect } from "react";
import { useProductos } from "../Hooks/useProducts";
import { ProductDialog } from "./ProductDialog";
import { ProductTable } from "./ProductTable";
import { Sidebar } from "./Sidebar";
import { TabsNavigation } from "./tabsNavigations";

const Productos: React.FC = () => {
  const {
    loading,
    modalOpen,
    modalType,
    form,
    products,
    setModalOpen,
    setModalType,
    setForm,
    handleCreate,
    handleEdit,
    handleDelete,
    handleCloseModal,
    connectWebSocket,
  } = useProductos();

  useEffect(() => {
    connectWebSocket();
  }, [connectWebSocket]);

  const columns = [
    { field: "code", headerName: "Código", width: 100 },
    { field: "name", headerName: "Nombre", width: 200 },
    { field: "description", headerName: "Descripción", width: 300 },
    { field: "price", headerName: "Precio", width: 100 },
    { field: "cost", headerName: "Costo", width: 100 },
    {
      field: "actions",
      headerName: "Acciones",
      width: 150,
      renderCell: (params: GridCellParams) => (
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <Button
            variant="contained"
            color="secondary"
            size="small"
            onClick={() => {
              setForm({
                id: params.row.id,
                code: params.row.code,
                name: params.row.name,
                description: params.row.description,
                price: params.row.price,
                cost: params.row.cost,
                inActive: true,
              });
              setModalType("edit");
              setModalOpen(true);
            }}
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

  return (
    <Box display="flex" flexDirection="column" height="100vh">
      {/* Tabs Navigation */}
      <TabsNavigation tabIndex={0} onTabChange={() => { }} />

      {/* Main Content */}
      <Box display="flex" flex={1} overflow="hidden">
        {/* Sidebar */}
        <Sidebar categories={["Cafetería", "Bebidas", "Pastelería"]} />

        {/* Main Content */}
        <Box flex={1} p={2} overflow="auto">

          {/* Product Table */}
          <ProductTable
            loading={loading}
            rows={products}
            columns={columns}
            onCreate={() => {
              setModalType("create");
              setModalOpen(true);
            }}
          />

          {/* Product Dialog */}
          <ProductDialog
            open={modalOpen}
            modalType={modalType}
            form={form}
            onChange={(field, value) => setForm({ ...form, [field]: value })}
            onClose={handleCloseModal}
            onSave={modalType === "create" ? handleCreate : handleEdit}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Productos;
