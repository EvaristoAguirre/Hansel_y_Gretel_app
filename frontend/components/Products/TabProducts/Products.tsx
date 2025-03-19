"use client";
import { useAuth } from "@/app/context/authContext";

import { useProductos } from "@/components/Hooks/useProducts";
import { IingredientForm } from "@/components/Interfaces/Ingredients";
import { ProductForm, ProductForPromo, ProductsProps } from "@/components/Interfaces/IProducts";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Button } from "@mui/material";
import { GridCellParams } from "@mui/x-data-grid";
import React, { useEffect, useState } from "react";
import { ProductDialog } from "./ProductDialog";
import { ProductTable } from "./ProductTable";
import ProductCreationModal from "./ProductCreationModal";


const Products: React.FC<ProductsProps> = ({ selectedCategoryId, onClearSelectedCategory }) => {

  const {
    loading,
    modalOpen,
    modalType,
    form,
    products,
    setModalOpen,
    setModalType,
    setForm,
    handleCreateProduct,
    handleEdit,
    handleDelete,
    handleCloseModal,
    connectWebSocket,
  } = useProductos();

  const {
    categories,
  } = useCategoryStore();

  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    connectWebSocket();
  }, [connectWebSocket]);

  const { getAccessToken } = useAuth();

  useEffect(() => {
    const accessToken = getAccessToken();
    if (accessToken) {
      setToken(accessToken);
    }
  }, [getAccessToken]);

  const handleSave = () => {
    if (token) {
      if (modalType === "create") {
        return handleCreateProduct(token);
      } else {
        return handleEdit(token!);
      }
    }
  };

  const handleChangeProductInfo = (
    field: keyof ProductForm,
    value: string | number | null | string[] | IingredientForm[] | ProductForPromo[]
  ) => setForm({ ...form, [field]: value });

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
        <div>
          <Button
            variant="contained"
            sx={{ mr: 1 }}
            className="bg-[--color-primary]"
            size="small"
            onClick={() => {
              setForm({
                id: params.row.id,
                code: params.row.code,
                name: params.row.name,
                description: params.row.description,
                type: params.row.type,
                price: params.row.price,
                cost: params.row.cost,
                categories: params.row.categories,
                ingredients: params.row.productIngredients,
                products: params.row.promotionDetails,
                isActive: true,
              });
              setModalType("edit");
              setModalOpen(true);
            }}
          >
            <FontAwesomeIcon icon={faEdit} />
          </Button>
          <Button
            className="bg-[--color-primary]"
            variant="contained"
            size="small"
            onClick={() => handleDelete(params.row.id, token!)}
          >
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        </div >
      ),
    },
  ];

  return (
    <Box flex={1} p={2} overflow="auto">
      {/* Product Table */}
      <ProductTable
        loading={loading}
        rows={products}
        selectedCategoryId={selectedCategoryId}
        columns={columns}
        onClearSelectedCategory={onClearSelectedCategory}
        onCreate={() => {
          setModalType("create");
          setModalOpen(true);
        }}
      />

      {/* Product Dialog */}
      {modalOpen && (
        // <ProductDialog
        //   open={modalOpen}
        //   modalType={modalType}
        //   form={form}
        //   categories={categories}
        //   products={products}
        //   onChange={handleChangeProductInfo}
        //   onClose={handleCloseModal}
        //   onSave={handleSave}
        // />
        <ProductCreationModal
          modalType={modalType}
          form={form}
          open={modalOpen}
          onClose={handleCloseModal}
          onChange={handleChangeProductInfo}
          onSave={handleSave}
          categories={categories}
          products={products}
        />
      )}
    </Box>

  );
};

export default Products;