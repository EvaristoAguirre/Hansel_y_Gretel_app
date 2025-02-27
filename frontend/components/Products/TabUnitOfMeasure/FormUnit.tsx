import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Box,
  Stack,
} from "@mui/material";
import { FormType } from "@/components/Enums/Ingredients";
import { useUnitContext } from "@/app/context/unitOfMeasureContext";
import { IUnitOfMeasure } from "@/components/Interfaces/IUnitOfMeasure";

interface Errors {
  [key: string]: string;
}

export const FormUnit = ({
  formType,
  onSave,
}: {
  formType: FormType;
  onSave: () => void;
}) => {
  const {
    formUnit,
    setFormUnit,
    formOpenUnit,
    handleCloseFormUnit,
  } = useUnitContext();

  const [errors, setErrors] = useState<Errors>({});
  const [isFormValid, setIsFormValid] = useState(false);

  const validateField = (field: string, value: any) => {
    let error = "";

    if (!value.trim()) {
      error = "Este campo es obligatorio";
    } else if (["quantity", "equivalent_quantity"].includes(field) && Number(value) <= 0) {
      error = "Debe ser un número positivo";
    }

    setErrors((prevErrors) => ({ ...prevErrors, [field]: error }));
  };

  useEffect(() => {
    const hasErrors = Object.values(errors).some((error) => error);
    const hasEmptyFields = ["quantity", "name", "abbreviation", "equivalent_quantity", "equivalent_unit"].some(
      (field) => !formUnit[field as keyof IUnitOfMeasure]
    );
    setIsFormValid(!hasErrors && !hasEmptyFields);
  }, [errors, formUnit]);

  return (
    <Dialog open={formOpenUnit} onClose={handleCloseFormUnit} fullWidth maxWidth="sm">
      <DialogTitle sx={{ color: "primary.main", fontWeight: "bold" }}>
        {formType === FormType.CREATE ? "Crear Unidad de Medida" : "Editar Unidad de Medida"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Cantidad"
              type="number"
              inputProps={{ step: "0.50", min: "0" }}
              value={formUnit.quantity ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                setFormUnit((prev) => ({ ...prev, quantity: Number(value) }));
                validateField("quantity", value);
              }}
              error={!!errors.quantity}
              helperText={errors.quantity}
              fullWidth
              variant="outlined"
            />
            <TextField
              label="Nombre"
              value={formUnit.name ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                setFormUnit((prev) => ({ ...prev, name: value }));
                validateField("name", value);
              }}
              error={!!errors.name}
              helperText={errors.name}
              fullWidth
              variant="outlined"
            />
          </Stack>
          <TextField
            label="Abreviatura"
            value={formUnit.abbreviation ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              setFormUnit((prev) => ({ ...prev, abbreviation: value }));
              validateField("abbreviation", value);
            }}
            error={!!errors.abbreviation}
            helperText={errors.abbreviation}
            fullWidth
            variant="outlined"
          />
          <Stack direction="row" spacing={1}>
            <TextField
              label="Equivalencia Numérica"
              type="number"
              inputProps={{ step: "0.50", min: "0" }}
              value={formUnit.equivalent_quantity ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                setFormUnit((prev) => ({ ...prev, equivalent_quantity: Number(value) }));
                validateField("equivalent_quantity", value);
              }}
              error={!!errors.equivalent_quantity}
              helperText={errors.equivalent_quantity}
              fullWidth
              variant="outlined"
            />
            <TextField
              label="Unidad de Equivalencia"
              value={formUnit.equivalent_unit ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                setFormUnit((prev) => ({ ...prev, equivalent_unit: value }));
                validateField("equivalent_unit", value);
              }}
              error={!!errors.equivalent_unit}
              helperText={errors.equivalent_unit}
              fullWidth
              variant="outlined"
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseFormUnit} color="secondary">
          Cancelar
        </Button>
        <Button onClick={onSave} color="primary" disabled={!isFormValid}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
