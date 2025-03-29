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
import LoadingLottie from '@/components/Loader/Loading';

interface Errors {
  [key: string]: string;
}

export const FormIngredient = ({
  formType,
  onSave,
  units
}: {
  formType: FormType;
  onSave: () => void;
  units: IUnitOfMeasureResponse[]
}) => {
  const { formIngredients, setFormIngredients, formOpen, handleCloseForm } =
    useIngredientsContext();

  const [errors, setErrors] = useState<Errors>({});
  const [isFormValid, setIsFormValid] = useState(false);

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
    unitOfMeasureId: "Unidad de Medida",
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
            value={typeof formIngredients.unitOfMeasureId === 'object' ? formIngredients.unitOfMeasureId?.id : formIngredients.unitOfMeasureId}
            onChange={(e) => {
              setFormIngredients({
                ...formIngredients,
                unitOfMeasureId: e.target.value,
              });
            }}
            MenuProps={{
              PaperProps: {
                style: {
                  display: 'flex',
                },
              },
            }}
          >
            {
              units.length === 0 ? (
                <MenuItem>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '200px' }}>
                    <LoadingLottie />
                  </div>
                </MenuItem>
              ) : (
                units.map((unit) => (
                  <MenuItem
                    key={unit.id} value={unit.id}>
                    {unit.name} ({unit.abbreviation})
                  </MenuItem>
                ))
              )
            }
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
