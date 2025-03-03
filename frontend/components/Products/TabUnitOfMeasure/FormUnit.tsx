import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Stack,
  Autocomplete,
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
    units,
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
    } else if (["equivalenceToBaseUnit"].includes(field) && Number(value) <= 0) {
      error = "Debe ser un número positivo";
    }

    setErrors((prevErrors) => ({ ...prevErrors, [field]: error }));
  };

  useEffect(() => {
    const hasErrors = Object.values(errors).some((error) => error);
    const hasEmptyFields = ["quantity", "name", "abbreviation", "equivalenceToBaseUnit", "baseUnitId"].some(
      (field) => !formUnit[field as keyof IUnitOfMeasure]
    );
    setIsFormValid(!hasErrors && !hasEmptyFields);
  }, [errors, formUnit]);

  return (
    <Dialog open={formOpenUnit} onClose={handleCloseFormUnit} fullWidth maxWidth="sm">
      <DialogTitle sx={{ color: "primary.main", fontWeight: "bold", fontSize: "1rem" }}>
        {formType === FormType.CREATE ? "Crear Unidad de Medida" : "Editar Unidad de Medida"}
      </DialogTitle>
      <DialogContent>
        <Stack direction="row" spacing={2} sx={{ my: 1 }}>
          <TextField
            label="Nombre de la nueva unidad"
            value={formUnit.name ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              setFormUnit((prev) => ({ ...prev, name: value }));
              validateField("name", value);
            }}
            error={!!errors.name}
            helperText={errors.name}
            sx={{ width: "50%" }}
            variant="outlined"
          />
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
            sx={{ width: "50%" }}
            variant="outlined"
          />
        </Stack>

        <Stack direction="row" spacing={2}>
          <TextField
            label="Equivale a la cantidad de: "
            type="number"
            inputProps={{ step: "0.50", min: "0" }}
            value={formUnit.equivalenceToBaseUnit ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              setFormUnit((prev) => ({ ...prev, equivalenceToBaseUnit: Number(value) }));
              validateField("equivalenceToBaseUnit", value);
            }}
            error={!!errors.equivalenceToBaseUnit}
            helperText={errors.equivalenceToBaseUnit}
            sx={{ width: "50%" }}
            variant="outlined"
          />
          <Autocomplete
            options={units}
            getOptionLabel={(option) => option.abbreviation}
            value={units.find((unit) => unit.id === formUnit.baseUnitId) || null}
            onChange={(event, newValue) => {
              setFormUnit((prev) => ({
                ...prev,
                baseUnitId: newValue?.id || "",
              }));
              if (newValue) {
                validateField("baseUnitId", newValue.id || "");
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Unidad de Equivalencia"
                variant="outlined"
                error={!!errors.baseUnitId}
                helperText={errors.baseUnitId}
              />
            )}
            sx={{ width: "50%" }}
          />


        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseFormUnit} color="secondary">
          Cancelar
        </Button>
        <Button onClick={onSave} color="primary">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
