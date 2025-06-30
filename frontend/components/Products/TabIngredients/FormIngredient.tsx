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
  Checkbox,
  FormControlLabel,
  Tooltip,
} from "@mui/material";
import { useIngredientsContext } from "@/app/context/ingredientsContext";
import { FormType } from "@/components/Enums/ingredients";
import { Iingredient } from "@/components/Interfaces/Ingredients";
import { IUnitOfMeasureForm } from "../../Interfaces/IUnitOfMeasure";
import { useAuth } from "@/app/context/authContext";
import { ingredientsByName } from "@/api/ingredients";
import NumericInput from "@/components/Utils/NumericInput";

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
  units: IUnitOfMeasureForm[]
}) => {
  const { formIngredients, setFormIngredients, formOpen, handleCloseForm } =
    useIngredientsContext();
  const { getAccessToken } = useAuth();
  const [errors, setErrors] = useState<Errors>({});
  const [isFormValid, setIsFormValid] = useState(false);

  const validateField = (field: string, value: any) => {
    let error = "";

    const requiredFields: (keyof Iingredient)[] = ["name", "cost"];

    if (requiredFields.includes(field as keyof Iingredient) && !value) {
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



  const checkNameAvailability = async (name: string) => {
    const token = getAccessToken();
    const result = token && await ingredientsByName(name, token);
    if (result && result.ok) {
      setErrors((prev) => ({ ...prev, name: "El nombre ya está en uso" }));
    } else {
      setErrors((prev) => ({ ...prev, name: "" }));
    }

  };

  const fields: {
    key: keyof Iingredient;
    label: string;
    type: "text" | "number";
  }[] = [
      { key: "name", label: "Nombre", type: "text" },
      { key: "description", label: "Descripción", type: "text" },
      { key: "cost", label: "Costo", type: "number" },
    ];

  const handleChangeField = (key: keyof Iingredient, value: string | number) => {
    setFormIngredients((prev) => ({ ...prev, [key]: value }));
    validateField(key, value);
  };




  return (
    <Dialog open={formOpen} onClose={handleCloseForm}>
      <DialogTitle sx={{ color: "primary", fontWeight: "bold" }}>
        {formType === FormType.CREATE ? "Crear Ingrediente" : "Editar Ingrediente"}
      </DialogTitle>
      <DialogContent>
        {fields.map(({ key, label, type }) =>
          key === 'cost' ? (
            <NumericInput
              key={key}
              label={label}
              value={formIngredients[key] ?? ''}
              onChange={(num) => {
                setFormIngredients((prev) => ({
                  ...prev,
                  [key]: num,
                }));
                validateField(key, num);
              }}
              error={!!errors[key]}
              helperText={errors[key]}
            />
          ) : (
            <TextField
              key={key}
              margin="dense"
              label={label}
              type={type}
              value={formIngredients[key] ?? ''}
              onChange={(e) => handleChangeField(key, e.target.value)}
              onBlur={() =>
                key === 'name' &&
                formType === FormType.CREATE &&
                checkNameAvailability(formIngredients.name)
              }
              error={!!errors[key]}
              helperText={errors[key]}
              fullWidth
              variant="outlined"
            />
          )
        )}

        {/* Select de unidad de medida */}
        <FormControl variant="outlined" fullWidth margin="dense">
          <InputLabel>Unidad de Medida</InputLabel>
          <Select
            label="Unidad de Medida"
            value={
              typeof formIngredients.unitOfMeasureId === 'object'
                ? formIngredients.unitOfMeasureId?.id
                : formIngredients.unitOfMeasureId
            }
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
            {units.map((unit) => (
              <MenuItem key={unit.id} value={unit.id}>
                {unit.name} ({unit.abbreviation})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Tooltip title="Un agregado puede ser una salsa de chocolate, por ejemplo, para agregar a un producto.">
          <FormControlLabel
            label="¿Es un agregado?"
            control={
              <Checkbox
                size="medium"
                checked={formIngredients.isTopping}
                onChange={(e) =>
                  setFormIngredients((prev) => ({
                    ...prev,
                    isTopping: e.target.checked,
                  }))
                }
              />
            }
            sx={{
              mt: 2,
              color: 'primary.main',
              fontSize: '1.2rem',
              fontWeight: 'bold',
            }}
          />
        </Tooltip>
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
