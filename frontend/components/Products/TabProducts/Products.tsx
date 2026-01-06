"use client";
import { useAuth } from "@/app/context/authContext";
import { useProducts } from "@/components/Hooks/useProducts";
import { IingredientForm } from "@/components/Interfaces/Ingredients";
import {
  IProductToppingsGroupResponse,
  ProductForm,
  ProductForPromo,
  ProductsProps,
  ProductToppingsGroupDto,
  SlotForPromo,
} from "@/components/Interfaces/IProducts";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Button, Typography } from "@mui/material";
import { GridCellParams, GridColDef } from "@mui/x-data-grid";
import React, { useEffect, useState } from "react";
import { ProductTable } from "./ProductTable";
import ProductCreationModal from "./Modal/ProductCreationModal";
import SlotCreationModal from "./Modal/SlotCreationModal";
import { useCategoryStore } from "@/components/Categories/useCategoryStore";
import { FormTypeProduct } from "@/components/Enums/view-products";
import { useUnitContext } from "@/app/context/unitOfMeasureContext";
import { ICategory } from "@/components/Interfaces/ICategories";
import { mapIngredientResponseToForm } from "@/components/Hooks/useProductStore";
import { normalizeNumber } from "@/components/Utils/NormalizeNumber";
import { getPromotionSlots } from "@/api/promotionSlot";
import { createPromoWithSlots } from "@/api/products";
import DataGridComponent from "@/components/Utils/DataGridComponent";

const Products: React.FC<ProductsProps> = ({
  selectedCategoryId,
  onClearSelectedCategory,
}) => {
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
    handleEditProduct,
    handleDelete,
    handleCloseModal,
    connectWebSocket,
  } = useProducts();

  const { categories } = useCategoryStore();

  useEffect(() => {
    connectWebSocket();
  }, [connectWebSocket]);

  const { getAccessToken } = useAuth();
  const token = getAccessToken();
  const { units } = useUnitContext();

  useEffect(() => {
    units.length === 0 ? setLoading(true) : setLoading(false);
  }, [units]);

  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [slots, setSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Cargar slots al montar el componente
  const fetchSlots = async () => {
    if (!token) return;
    setLoadingSlots(true);
    const result = await getPromotionSlots(token);
    setLoadingSlots(false);
    if (result.ok && result.data) {
      setSlots(result.data);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSlots();
    }
  }, [token]);

  // Columnas para la tabla de slots
  const slotColumns: GridColDef[] = [
    { field: "name", headerName: "Nombre", width: 200 },
    { field: "description", headerName: "Descripción", width: 300 },
    {
      field: "options",
      headerName: "Productos",
      width: 400,
      renderCell: (params: any) => {
        const options = params.value || [];
        return (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {options.map((opt: any) => opt.name || opt.product.name).join(", ")}
          </Box>
        );
      },
    },
  ];

  const handleSave = () => {
    if (token) {
      if (modalType === "create") {
        return handleCreateProduct(token);
      } else {
        if (selectedCategoryId) {
          return handleEditProduct(token, selectedCategoryId);
        } else {
          return handleEditProduct(token);
        }
      }
    }
  };

  const handleSaveCombo = async () => {
    if (!token) return;

    const result = await createPromoWithSlots(form, token);
    if (result.ok) {
      handleCloseModal();
    } else {
      console.error("Error al crear promo con slots:", result.error);
    }
  };

  const handleChangeProductInfo = (
    field: keyof ProductForm,
    value:
      | string
      | number
      | boolean
      | ICategory[]
      | IingredientForm[]
      | ProductForPromo[]
      | null
      | ProductToppingsGroupDto[]
      | SlotForPromo[]
      | null
  ) => setForm({ ...form, [field]: value as ProductForm[keyof ProductForm] });

  const columns = [
    { field: "code", headerName: "Código", width: 100 },
    { field: "name", headerName: "Nombre", width: 200 },
    { field: "description", headerName: "Descripción", width: 300 },
    {
      field: "price",
      headerName: "Precio",
      width: 100,
      renderCell: (params: any) => <>$ {params.value}</>,
    },
    {
      field: "cost",
      headerName: "Costo",
      width: 100,
      renderCell: (params: any) => <>$ {params.value}</>,
    },
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
              console.log(params.row);

              // Mapear promotionSlotAssignments a slots para el formulario
              const slotsFromAssignments =
                params.row.promotionSlotAssignments?.map(
                  (assignment: {
                    slot: { id: string; name: string };
                    quantity: number;
                    isOptional: boolean;
                  }) => ({
                    slotId: assignment.slot.id,
                    name: assignment.slot.name,
                  })
                ) || [];

              setForm({
                id: params.row.id,
                code: params.row.code,
                name: params.row.name,
                description: params.row.description,
                type: params.row.type,
                price: normalizeNumber(params.row.price),
                cost: normalizeNumber(params.row.cost),
                baseCost: normalizeNumber(params.row.baseCost),
                categories: params.row.categories,
                ingredients:
                  params.row.productIngredients?.map(
                    mapIngredientResponseToForm
                  ) || [],
                products: params.row.promotionDetails || [],
                isActive: true,
                allowsToppings: params.row.allowsToppings,
                toppingsSettings:
                  params.row.availableToppingGroups?.settings || [],
                unitOfMeasure: params.row.unitOfMeasure,
                unitOfMeasureId: params.row.unitOfMeasureId,
                unitOfMeasureConversions: params.row.unitOfMeasureConversions,
                availableToppingGroups:
                  params.row.availableToppingGroups?.map(
                    (group: IProductToppingsGroupResponse) => ({
                      toppingsGroupId: group.id,
                      quantityOfTopping: parseFloat(group.quantityOfTopping),
                      settings: group.settings,
                      unitOfMeasureId: group.unitOfMeasure.id ?? undefined,
                    })
                  ) || [],
                slots: slotsFromAssignments,
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
        </div>
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
        onCreateSlot={() => {
          setSlotModalOpen(true);
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
          onSaveCombo={handleSaveCombo}
          categories={categories}
          products={products}
        />
      )}

      {/* Tabla de Slots */}
      <Box mt={4}>
        <Typography variant="h6" mb={2}>
          Slots de Promoción
        </Typography>
        <DataGridComponent
          rows={slots}
          columns={slotColumns}
          capitalize={["name", "description"]}
        />
      </Box>

      {/* Slot Dialog */}
      <SlotCreationModal
        open={slotModalOpen}
        onClose={() => setSlotModalOpen(false)}
        onSave={() => fetchSlots()}
        products={products}
      />
    </Box>
  );
};

export default Products;
