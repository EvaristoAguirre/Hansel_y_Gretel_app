"use client";
import { useAuth } from "@/app/context/authContext";

import { useProducts } from "@/components/Hooks/useProducts";
import { IingredientForm } from "@/components/Interfaces/Ingredients";
import { IProductDataList, ProductForm, ProductForPromo, ProductsProps } from "@/components/Interfaces/IProducts";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Button } from "@mui/material";
import { GridCellParams } from "@mui/x-data-grid";
import React, { useEffect, useState } from "react";
import { ProductTable } from "./ProductTable";
import ProductCreationModal from "./Modal/ProductCreationModal";
import { useCategoryStore } from "@/components/Categories/useCategoryStore";
import { fetchUnits } from "@/api/unitOfMeasure";
import { IUnitOfMeasureForm } from "@/components/Interfaces/IUnitOfMeasure";
import { FormTypeProduct } from "@/components/Enums/view-products";
import LoadingLottie from '@/components/Loader/Loading';
import { useUnitContext } from "@/app/context/unitOfMeasureContext";


const Products: React.FC<ProductsProps> = ({ selectedCategoryId, onClearSelectedCategory }) => {
  const {
    loading,
    setLoading,
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
  } = useProducts();

  const {
    categories,
  } = useCategoryStore();


  useEffect(() => {
    connectWebSocket();
  }, [connectWebSocket]);

  const { getAccessToken } = useAuth();
  const token = getAccessToken();
  const { units } = useUnitContext()

  useEffect(() => {
    units.length === 0 ? setLoading(true) : setLoading(false);
  }, [units]);

  const handleSave = () => {
    if (token) {
      if (modalType === "create") {
        return handleCreateProduct(token);
      } else {
        if (selectedCategoryId) {
          return handleEdit(token, selectedCategoryId);

        } else {
          return handleEdit(token);
        }
      }
    }
  };

  const handleChangeProductInfo = (
    field: keyof ProductForm,
    value: string | number | string[] | IingredientForm[] | ProductForPromo[] | null
  ) => setForm({ ...form, [field]: value as ProductForm[keyof ProductForm] });

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
                price: parseFloat(params.row.price),
                cost: parseFloat(params.row.cost),
                categories: params.row.categories,
                ingredients: params.row.productIngredients || [],
                products: params.row.promotionDetails || [],
                isActive: true,
                allowsToppings: false,
                toppingsSettings: null
              });
              setModalType(FormTypeProduct.EDIT);
              setModalOpen(true);
            }}
            disabled={units.length === 0}
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

      <ProductTable
        loading={loading}
        rows={products}
        selectedCategoryId={selectedCategoryId}
        columns={columns}
        onClearSelectedCategory={onClearSelectedCategory}
        onCreate={() => {
          setModalType(FormTypeProduct.CREATE);
          setModalOpen(true);
        }}
      />

      {/* Product Dialog */}
      {modalOpen && (
        <ProductCreationModal
          modalType={modalType}
          form={form}
          units={units}
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