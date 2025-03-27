import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useIngredientsContext } from "@/app/context/ingredientsContext";
import { FormType } from "@/components/Enums/Ingredients";
import { Iingredient } from "@/components/Interfaces/Ingredients";
import { IUnitOfMeasureResponse } from "../../Interfaces/IUnitOfMeasure";
import { useAuth } from "@/app/context/authContext";
import { fetchUnits } from "@/api/unitOfMeasure";

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
  const { formIngredients, setFormIngredients, formOpen, handleCloseForm } =
    useIngredientsContext();
  const { getAccessToken } = useAuth();

  const [errors, setErrors] = useState<Errors>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [units, setUnits] = useState<IUnitOfMeasureResponse[]>([]);

  // Efecto para obtener las unidades de medida solo una vez
  useEffect(() => {
    console.time("API Call");

    const fetchAllUnits = async () => {
      try {
        const token = getAccessToken();
        if (!token) return;
        const response = await fetchUnits(token);
        const data = await response.json();
        setUnits(data);
        console.log(data);

      } catch (error) {
        console.error("Error al obtener las unidades de medida:", error);
      }
    };

    fetchAllUnits();
    console.timeEnd("API Call");

  }, []);

  useEffect(() => {
    console.log("🩵Unidades de medida:", units);

  }, [units]);

  const validateField = (field: string, value: any) => {
    let error = "";

    if (!value) {
      error = "Este campo es obligatorio";
    } else if (field === "cost" && value <= 0) {
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
    stock: "Stock",
    unitOfMeasure: "Unidad de Medida",
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
            type={field === "cost" ? "number" : "text"}
            inputProps={field === "cost" ? { step: "0.50" } : undefined}
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

        {/* Select de unidad de medida */}
        <FormControl variant="outlined" fullWidth margin="dense">
          <InputLabel>Unidad de Medida</InputLabel>
          <Select
            label="Unidad de Medida"
            value={formIngredients.unitOfMeasure?.id ?? ""}
            onChange={(e) => {
              const selectedUnit = units.find((unit) => unit.id === e.target.value);
              setFormIngredients((prev) => ({
                ...prev,
                unitOfMeasure: selectedUnit || null,
              }));
            }}
          >
            {units.map((unit) => (
              <MenuItem key={unit.id} value={unit.id}>
                {unit.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
