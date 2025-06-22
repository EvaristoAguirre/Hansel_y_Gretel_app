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
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Card,
  CardContent,
  CardActions,
  Box,
} from "@mui/material";
import { FormType } from "@/components/Enums/ingredients";
import { useUnitContext } from "@/app/context/unitOfMeasureContext";
import { IUnitOfMeasureForm } from "@/components/Interfaces/IUnitOfMeasure";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { searchUnits } from "@/api/unitOfMeasure";
import { useAuth } from "@/app/context/authContext";
import { FieldUnitType } from "@/components/Enums/unitOfMeasure";

export const FormUnit = ({
  formType,
  onSave,
}: {
  formType: FormType;
  onSave: (unit: IUnitOfMeasureForm) => void;
}) => {
  const {
    units,
    conventionalUnits,
    formUnit,
    setFormUnit,
    formOpenUnit,
    handleCloseFormUnit,
  } = useUnitContext();

  const { getAccessToken } = useAuth();

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Para manejar una nueva conversión a agregar
  const [newConversion, setNewConversion] = useState({
    toUnitId: "",
    conversionFactor: "",
  });
  // Estado para editar (si se necesita editar una conversión ya agregada)
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const validateField = (field: string, value: any) => {
    let error = "";
    if (field === "name" || field === "abbreviation") {
      if (!value.trim()) {
        error = "Este campo es obligatorio";
      }
    }
    if (field === "conversionFactor" && (!value || Number(value) <= 0)) {
      error = "Debe ser un número positivo";
    }
    if (field === "toUnitId" && !value) {
      error = "Seleccione una unidad";
    }

    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors, [field]: error };
      // Si no hay error, eliminamos la clave del objeto
      if (!error) delete newErrors[field];
      return newErrors;
    });
  };


  useEffect(() => {
    const hasErrors = Object.values(errors).some((error) => error);
    const hasEmptyFields = ["name", "abbreviation"].some(
      (field) => !formUnit[field as keyof IUnitOfMeasureForm]
    );
    setIsFormValid(!hasErrors && !hasEmptyFields);
  }, [errors, formUnit]);

  const handleAddOrEditConversion = () => {
    validateField("conversionFactor", newConversion.conversionFactor);
    validateField("toUnitId", newConversion.toUnitId);

    // Esperar un render antes de comprobar errores
    setTimeout(() => {
      if (errors.conversionFactor || errors.toUnitId) return;

      const conversion = {
        toUnitId: newConversion.toUnitId,
        conversionFactor: Number(newConversion.conversionFactor),
      };

      setFormUnit((prev: IUnitOfMeasureForm) => {
        let updatedConversions = [...prev.conversions];
        if (editIndex !== null) {
          updatedConversions[editIndex] = conversion;
        } else {
          updatedConversions.push(conversion);
        }
        return { ...prev, conversions: updatedConversions };
      });

      setNewConversion({ toUnitId: "", conversionFactor: "" });
      setEditIndex(null);
    }, 0);
  };


  const handleEditConversion = (index: number) => {
    const conversion = formUnit.conversions[index];
    setNewConversion({
      toUnitId: conversion.toUnitId,
      conversionFactor: String(conversion.conversionFactor),
    });
    setEditIndex(index);
  };

  const handleRemoveConversion = (index: number) => {
    setFormUnit((prev: IUnitOfMeasureForm) => ({
      ...prev,
      conversions: prev.conversions.filter((_, i) => i !== index),
    }));
    // Si estábamos editando ese índice, reseteamos el input
    if (editIndex === index) {
      setNewConversion({ toUnitId: "", conversionFactor: "" });
      setEditIndex(null);
    }
  };
  const checkNameAvailability = async (name: string) => {
    const token = getAccessToken();
    const result = token && await searchUnits(name, token, FieldUnitType.NAME);
    if (result && result.length > 0) {
      setErrors((prev) => ({ ...prev, name: "El nombre ya está en uso" }));
    } else {
      setErrors((prev) => ({ ...prev, name: "" }));
    }
  };

  const checkAbbreviationAvailability = async (abbreviation: string) => {
    const token = getAccessToken();
    const result = token && await searchUnits(abbreviation, token, FieldUnitType.ABBREVIATION);
    if (result && result.length > 0) {
      setErrors((prev) => ({ ...prev, abbreviation: "La abreviatura ya está en uso" }));
    } else {
      setErrors((prev) => ({ ...prev, abbreviation: "" }));
    }
  };

  return (
    <Dialog open={formOpenUnit} onClose={handleCloseFormUnit} fullWidth maxWidth="sm">
      <DialogTitle sx={{ color: "primary.main", fontWeight: "bold", fontSize: "1rem" }}>
        {formType === FormType.CREATE ? "Crear Unidad de Medida Personalizada" : "Editar Unidad de Medida Personalizada"}
      </DialogTitle>
      <DialogContent>
        <Stack direction="row" spacing={2} sx={{ my: 1 }}>
          <TextField
            label="Nombre de la unidad"
            value={formUnit.name ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              setFormUnit((prev) => ({ ...prev, name: value }));
              validateField("name", value);
            }}
            onBlur={() => {
              if (formUnit.name?.trim()) {
                checkNameAvailability(formUnit.name);
              }
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
            onBlur={() => {
              if (formUnit.abbreviation?.trim()) {
                checkAbbreviationAvailability(formUnit.abbreviation);
              }
            }}
            error={!!errors.abbreviation}
            helperText={errors.abbreviation}
            sx={{ width: "50%" }}
            variant="outlined"
          />


        </Stack>
        <Divider sx={{ borderBottomWidth: 2, bgcolor: "primary.main", opacity: 0.5, my: 2 }} />
        <Stack direction="row" spacing={2} sx={{ my: 2 }}>
          <TextField
            label="Equivale a la cantidad de"
            type="number"
            inputProps={{ step: "0.01", min: "0" }}
            value={newConversion.conversionFactor}
            onChange={(e) => {
              const value = e.target.value;
              setNewConversion((prev) => ({ ...prev, conversionFactor: value }));
              validateField("conversionFactor", value);
            }}
            error={!!errors.conversionFactor}
            helperText={errors.conversionFactor}
            variant="outlined"
          />
          <Autocomplete
            options={conventionalUnits}
            getOptionLabel={(option) => option.abbreviation}
            value={
              conventionalUnits.find((unit) => unit.id === newConversion.toUnitId) ||
              null
            }
            onChange={(event, newValue) => {
              const id = newValue?.id || "";
              setNewConversion((prev) => ({ ...prev, toUnitId: id }));
              if (newValue) {
                validateField("toUnitId", id);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Unidad de Equivalencia"
                variant="outlined"
                error={!!errors.toUnitId}
                helperText={errors.toUnitId}
              />
            )}
            sx={{ width: "40%" }}
          />
          <Button variant="contained" color="primary" onClick={handleAddOrEditConversion}>
            {editIndex !== null ? "Editar" : "Agregar"}
          </Button>
        </Stack>


        <Box
          sx={{
            maxHeight: "230px",
            overflowY: "auto",
          }}
        >
          <List
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 2
            }}
          >
            {formUnit.conversions.map((conversion, index) => (
              <Card
                key={index}
                variant="outlined"
                sx={{ width: 250, display: "flex", flexDirection: "row", padding: 0, justifyContent: "space-around" }}>
                <CardContent sx={{ padding: 0 }}>
                  <ListItem disableGutters >
                    <ListItemText
                      primary={`Cantidad: ${Number(conversion.conversionFactor).toFixed(2)}`}
                      secondary={`Unidad: ${units.find((unit) => unit.id === conversion.toUnitId)
                        ?.abbreviation || "Desconocida"
                        }`}
                    />
                  </ListItem>
                </CardContent>
                <CardActions >
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => handleEditConversion(index)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleRemoveConversion(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            ))}
          </List>
        </Box>


      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseFormUnit} color="secondary">
          Cancelar
        </Button>
        <Button onClick={() => onSave(formUnit)} color="primary" disabled={!isFormValid}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
