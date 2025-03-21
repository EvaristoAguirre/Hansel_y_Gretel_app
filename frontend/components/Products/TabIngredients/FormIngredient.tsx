import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
} from "@mui/material";
import { useIngredientsContext } from "@/app/context/ingredientsContext";
import { FormType } from "@/components/Enums/Ingredients";
import { Iingredient } from "@/components/Interfaces/Ingredients"; // Usar solo una importación de `Iingredient`

interface Errors {
  [key: string]: string;
}

export const FormIngredient = ({
  formType,
  onSave,
}: {
  formType: FormType;
  onSave: () => void;
}) => {
  const {
    formIngredients,
    setFormIngredients,
    formOpen,
    handleCloseForm,
  } = useIngredientsContext();

  const [errors, setErrors] = useState<Errors>({});
  const [isFormValid, setIsFormValid] = useState(false);

  const validateField = (field: string, value: any) => {
    let error = "";

    if (!value) {
      error = "Este campo es obligatorio";
    } else if ((field === "cost") && value <= 0) {
      error = "Debe ser un número positivo";
    }

    setErrors((prevErrors) => ({ ...prevErrors, [field]: error }));
  };

  useEffect(() => {
    const hasErrors = Object.values(errors).some((error) => error);
    const hasEmptyFields = ["name", "cost"].some(
      (field) => !formIngredients[field as keyof Iingredient]
    );
    setIsFormValid(!hasErrors && !hasEmptyFields);
  }, [errors, formIngredients]);

  const fieldLabels: Record<keyof Iingredient, string> = {
    id: "ID",
    isActive: "Activo",
    name: "Nombre",
    description: "Descripción",
    cost: "Costo",
  };

  return (
    <Dialog open={formOpen} onClose={handleCloseForm}>
      <DialogTitle sx={{ color: "primary", fontWeight: "bold" }}>
        {formType === FormType.CREATE ? "Crear Ingrediente" : "Editar Ingrediente"}
      </DialogTitle>
      <DialogContent>
        {["name", "description", "cost"].map((field) => (
          <TextField
            key={field}
            margin="dense"
            label={fieldLabels[field as keyof Iingredient]}
            type={["cost"].includes(field) ? "number" : "text"}
            inputProps={["cost"].includes(field) ? { step: "0.50" } : undefined}
            value={formIngredients[field as keyof Iingredient] ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              setFormIngredients((prev) => ({
                ...prev,
                [field]: value,
              }));
              validateField(field, value);
            }}
            error={!!errors[field]}
            helperText={errors[field]}
            fullWidth
            variant="outlined"
          />
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseForm} color="primary">
          Cancelar
        </Button>
        <Button onClick={onSave} color="primary" disabled={!isFormValid}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
