import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  FormControl,
  Chip,
} from "@mui/material";
import { ProductForm, ProductCreated } from "../../Interfaces/IProducts";
import { ICategory } from "../../Interfaces/ICategories";
import { Autocomplete } from "@mui/material";
import { getProductByCode } from "@/api/products";
import { Iingredient, IingredientForm } from "@/components/Interfaces/Ingredients";
import IngredientDialog from "./AssociateIngredients";

interface ProductDialogProps {
  open: boolean;
  modalType: "create" | "edit";
  form: ProductForm;
  products: ProductCreated[];
  categories: ICategory[];
  onChange: (field: keyof ProductForm, value: string | number | null | string[] | IingredientForm[]) => void;
  onClose: () => void;
  onSave: () => void;
}

interface Errors {
  [clave: string]: string;
}

export const ProductDialog: React.FC<ProductDialogProps> = ({
  open,
  modalType,
  form,
  categories,
  onChange,
  onClose,
  onSave,
}) => {
  const [errors, setErrors] = useState<Errors>({
    code: "",
    name: "",
    price: "",
    cost: "",
    categories: "",
  });
  const [isFormValid, setIsFormValid] = useState(false);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [isIngredientDialogOpen, setIngredientDialogOpen] = useState(false);
  const [associatedIngredients, setAssociatedIngredients] = useState<IingredientForm[]>([]);
  const [modalPosition, setModalPosition] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

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
          const result = await getProductByCode(value);

          if (result.ok) {
            error = "El código ya está en uso";
          } else if (result.status === 404) {
            error = "";
          } else {
            error = result.error || "Error al validar el código";
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

  const fieldLabels: Record<keyof ProductForm, string> = {
    code: "Código",
    name: "Nombre",
    description: "Descripción",
    price: "Precio",
    cost: "Costo",
    categories: "Categoría",
    isActive: "Inactivo",
    id: "ID",
  };

  const handleDelete = (id: string) => {
    const updatedCategories = form.categories.filter((category) => category !== id);
    onChange("categories", updatedCategories);
  };

  const handleOpenIngredientDialog = () => {
    const dialogElement = document.getElementById("product-dialog");
    if (dialogElement) {
      const rect = dialogElement.getBoundingClientRect();
      setModalPosition({
        left: rect.right + 10, // Justo al lado derecho del modal principal
        top: rect.top, // Mantiene la alineación vertical
      });
    }
    setIngredientDialogOpen(true);
  };

  const handleSaveIngredients = (ingredientsForm: IingredientForm[]) => {
    onChange("ingredients", ingredientsForm);
  };

  const handleSaveProduct = () => {
    const productData = {
      ...form,
      ingredients: associatedIngredients,
    };
    onSave();
    onClose();
  };



  return (
    <Dialog id="product-dialog" open={open} onClose={onClose}>
      <DialogTitle sx={{ color: "primary", fontWeight: "bold" }}>
        {modalType === "create" ? "Crear Producto" : "Editar Producto"}
      </DialogTitle>
      <DialogContent>
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
        <FormControl fullWidth margin="dense" error={!!errors.categories} variant="outlined">
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="error">
          Cancelar
        </Button>
        <Button onClick={handleSaveProduct} color="primary" disabled={!isFormValid}>
          Guardar
        </Button>
        <Button onClick={handleOpenIngredientDialog} color="secondary">
          Asociar Ingredientes
        </Button>
      </DialogActions>
      <IngredientDialog
        open={isIngredientDialogOpen}
        onClose={() => setIngredientDialogOpen(false)}
        onSave={handleSaveIngredients}
        PaperProps={{
          sx: {
            position: "absolute",
            left: "calc(100% + 16px)", // Ajusta según la posición deseada
            top: 0,
          },
        }}
      />
    </Dialog>
  );
};
