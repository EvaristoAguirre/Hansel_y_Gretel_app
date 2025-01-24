import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
} from "@mui/material";
import { ProductForm, ProductCreated } from "../Interfaces/IProducts";
import { ICategory } from "../Interfaces/ICategories";

interface ProductDialogProps {
  open: boolean;
  modalType: "create" | "edit";
  form: ProductCreated;
  products: ProductCreated[];
  categories: ICategory[];
  onChange: (field: keyof ProductForm, value: string | number | null | string[]) => void;
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
  products,
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

  const validateField = (field: string, value: any) => {
    let error = "";

    if (field === "categories" && Array.isArray(value) && value.length === 0) {
      error = "Debe seleccionar al menos una categoría";
    }
    if (["code", "name", "price", "cost"].includes(field)) {
      if (!value) {
        error = "Este campo es obligatorio";
      } else if (field === "code" && products.some((p) => p.code === value && p.id !== form.id)) {
        error = "El código ya está en uso";
      } else if ((field === "price" || field === "cost") && value <= 0) {
        error = "Debe ser un número positivo";
      }
    }

    setErrors((prevErrors) => ({ ...prevErrors, [field as string]: error }));
  };

  const validateForm = () => {
    const hasErrors = Object.values(errors).some((error) => error);
    
    const hasEmptyFields = ["code", "name", "price", "cost"].some(
      (field) => !form[field as keyof ProductForm]
    ) || !Array.isArray(form.categories) || form.categories.length === 0;
  
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

  return (
    <Dialog open={open} onClose={onClose}>
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
              validateField(field, value);
            }}
            error={!!errors[field as keyof ProductForm]}
            helperText={errors[field as keyof ProductForm]}
            fullWidth
            variant="outlined"
          />
        ))}

        {/* CATEGORIAS */}
        <FormControl
          fullWidth
          margin="dense"
          error={!!errors.categories}
          variant="outlined"
        >
          <InputLabel>{fieldLabels.categories}</InputLabel>
          <Select
            multiple 
            value={form.categories || []} 
            onChange={(e) => {
              const value = e.target.value; 

              onChange("categories", value);
              validateField("categories", value);
            }}
            label={fieldLabels.categories}
            renderValue={(selected: string[]) => {
              if (Array.isArray(selected)) {
                const categoriesFiltered = categories
                .filter((categories) => selected.includes(categories.id))
  
                const selectedValue = categoriesFiltered.map((cat) => cat.name).join(", ");
  
                return selectedValue;
              }
              return [];
            }}
          >
            {categories.map((categories) => (
              <MenuItem key={categories.id} value={categories.id}>
                {categories.name}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>{errors.categories}</FormHelperText>
        </FormControl>

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancelar
        </Button>
        <Button onClick={onSave} color="primary" disabled={!isFormValid}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
