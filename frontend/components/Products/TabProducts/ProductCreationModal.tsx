import React, { useEffect, useState } from 'react';
import { Modal, Box, Tabs, Tab, TextField, Button, FormControl, Autocomplete, Chip, DialogActions } from '@mui/material';
import { ProductCreated, ProductForm, ProductForPromo } from '@/components/Interfaces/IProducts';
import { ICategory } from '@/components/Interfaces/ICategories';
import { TypeProduct } from '@/components/Enums/view-products';
import * as path from 'path';
import { getProductByCode, searchProducts } from '@/api/products';
import { useAuth } from '@/app/context/authContext';
import { IingredientForm } from '@/components/Interfaces/Ingredients';
import IngredientDialog from './IngredientDialog';
import usePedido from '@/components/Hooks/usePedido';
import AutoCompleteProduct from '@/components/Utils/Autocomplete';
import InputsPromo from './InputsPromo';

interface ProductCreationModalProps {
  open: boolean;
  form: ProductForm;
  categories: ICategory[];
  onClose: () => void;
  onChange: (field: keyof ProductForm, value: string | number | null | string[] | IingredientForm[] | ProductForPromo[]) => void;
  onSave: () => void;
  modalType: "create" | "edit";
  products: ProductCreated[];
}

interface Errors {
  [clave: string]: string;
}

const ProductCreationModal: React.FC<ProductCreationModalProps> = ({
  open,
  onClose,
  form,
  categories,
  onChange,
  onSave,
  modalType,
  products
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [errors, setErrors] = useState<Errors>({
    code: "",
    name: "",
    price: "",
    cost: "",
    categories: "",
  });
  const [isFormValid, setIsFormValid] = useState(false);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [token, setToken] = useState<string | null>(null);


  const { getAccessToken } = useAuth();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    setToken(token);
  }, [getAccessToken]);


  const fieldLabels: Record<keyof ProductForm, string> = {
    code: "Código",
    name: "Nombre",
    description: "Descripción",
    price: "Precio",
    cost: "Costo",
    categories: "Categoría",
    ingredients: "Ingredientes",
    isActive: "Inactivo",
    id: "ID",
  };


  const validateField = async (field: string, value: any) => {
    let error = "";

    if (field === "categories" && Array.isArray(value) && value.length === 0) {
      error = "Debe seleccionar al menos una categoría";
    }
    if (["code", "name", "price", "cost"].includes(field)) {
      if (!value) {
        error = "Este campo es obligatorio";
      } else if (field === "code") {
        // Validación del código
        setIsCheckingCode(true);
        try {
          if (token) {
            const result = await getProductByCode(value, token)
            if (result.ok) {
              error = "El código ya está en uso";
            } else if (result.status === 404) {
              error = "";
            } else {
              error = result.error || "Error al validar el código";
            }
          }

        } catch (err) {
          console.error("Error al validar el código:", err);
          error = "Error al conectar con el servidor";
        } finally {
          setIsCheckingCode(false);
        }

      } else if ((field === "price" || field === "cost") && value <= 0) {
        error = "Debe ser un número positivo";
      }
    }

    setErrors((prevErrors) => ({ ...prevErrors, [field]: error }));
  };


  const validateForm = () => {
    const hasErrors = Object.values(errors).some((error) => error);
    const hasEmptyFields =
      ["code", "name", "price", "cost"].some((field) => !form[field as keyof ProductForm]) ||
      !Array.isArray(form.categories) ||
      form.categories.length === 0;

    setIsFormValid(!hasErrors && !hasEmptyFields);
  };

  useEffect(() => {
    validateForm();
  }, [errors, form]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Actualizamos el tipo según la pestaña seleccionada
    if (newValue === 0) {
      onChange("type", TypeProduct.PRODUCT);
    } else if (newValue === 1) {
      onChange("type", TypeProduct.PRODUCT);
    } else if (newValue === 2) {
      onChange("type", TypeProduct.PROMO);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // const { name, value } = e.target;
    // setFormData({ ...form, [name]: value });
  };


  const handleSaveIngredients = (ingredientsForm: IingredientForm[]) => {
    onChange("ingredients", ingredientsForm);
  };
  const handleProductsPromo = (productsForm: ProductForPromo[]) => {
    onChange("products", productsForm);
  }

  const handleSaveProduct = () => {
    // const productData = {
    //   ...form,
    //   ingredients: associatedIngredients,
    // };
    onSave();
    onClose();
  };





  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ width: 600, bgcolor: 'background.paper', p: 4, mx: 'auto', mt: 5 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Producto final" />
          <Tab label="Producto con ingredientes" />
          <Tab label="Promo" />
        </Tabs>

        {/* Campos comunes */}
        {["code", "name", "description", "price", "cost"].map((field) => (
          <TextField
            key={field}
            margin="dense"
            label={fieldLabels[field]}
            type={["code", "price", "cost"].includes(field) ? "number" : "text"}
            inputProps={["price", "cost"].includes(field) ? { step: "0.50" } : undefined}
            value={form[field] ?? ""}
            onChange={(e) => {
              const value = ["price", "cost"].includes(field)
                ? e.target.value === ""
                  ? null
                  : parseFloat(e.target.value)
                : ["code"].includes(field)
                  ? e.target.value === ""
                    ? null
                    : parseInt(e.target.value, 10)
                  : e.target.value;
              onChange(field as keyof ProductForm, value);
              if (field !== "code") {
                validateField(field, value);
              }
            }}
            onBlur={(e) => {
              if (field === "code") {
                validateField(field, e.target.value);
              }
            }}
            error={!!errors[field as keyof ProductForm]}
            helperText={
              isCheckingCode && field === "code"
                ? "Verificando código..."
                : errors[field as keyof ProductForm]
            }
            fullWidth
            variant="outlined"
          />
        ))}
        {/* CATEGORIAS */}
        <FormControl
          fullWidth
          margin="dense"
          //  error={!!errors.categories}
          variant="outlined">
          <Autocomplete
            multiple
            options={categories}
            getOptionLabel={(option) => option.name}
            value={categories.filter((category) => form.categories.includes(category.id))}
            onChange={(_, newValue) => {
              const selectedIds = newValue.map((category) => category.id);
              onChange("categories", selectedIds);
              validateField("categories", selectedIds);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label={fieldLabels.categories}
                placeholder="Selecciona categorías"
                error={!!errors.categories}
                helperText={errors.categories}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.id}
                  label={option.name}
                  sx={{ backgroundColor: "#f3d49ab8", color: "black", fontWeight: "bold" }}
                />
              ))
            }
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
        </FormControl>

        {/* Campos para ingredientes */}
        {tabValue === 1 && (
          <IngredientDialog onSave={handleSaveIngredients} form={form} />
        )}

        {/* Campos para promos */}
        {tabValue === 2 && (
          // <TextField
          //   fullWidth
          //   label="Productos (IDs y cantidades)"
          //   name="products"
          //   value={form.products}
          //   onChange={handleChange}
          //   margin="normal"
          //   helperText="Ej: id, cantidad"
          // />
          <InputsPromo onSave={handleProductsPromo} form={form} />

        )}

        <Button variant="contained" onClick={handleSaveProduct} sx={{ mt: 2 }}>
          Crear producto
        </Button>
      </Box>
    </Modal>
  );
};

export default ProductCreationModal;
