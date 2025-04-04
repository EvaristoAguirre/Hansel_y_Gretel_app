import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
} from "@mui/material";
import { MesaForm, MesaModalProps } from "../Interfaces/Cafe_interfaces";
import { validateTableByName, validateTableByNumber } from "@/api/tables";
import { useAuth } from "@/app/context/authContext";


interface Errors {
  [clave: string]: string;
}

const TableModal: React.FC<MesaModalProps> = ({
  open,
  type,
  form,
  onClose,
  onSave,
  onChange,
}) => {
  const { getAccessToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({
    name: "",
    number: "",
    coment: "",
  });
  const [isFormValid, setIsFormValid] = useState(false);


  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      setToken(token);
    }
  }, [getAccessToken]);


  // Etiquetas de los campos en español.
  const fieldLabels: Partial<Record<keyof MesaForm, string>> = {
    name: "Nombre",
    number: "Número",
    coment: "Comentarios",
    id: "ID",
  };

  // Función para validar el formulario.
  // Consideramos obligatorios "name" y "number".
  const validateForm = (errs = errors, currentForm = form) => {
    const hasErrors = Object.values(errs).some((error) => error !== "");
    const hasEmptyRequiredFields = ["name", "number"].some(
      (field) => !currentForm[field as keyof MesaForm]
    );
    setIsFormValid(!hasErrors && !hasEmptyRequiredFields);
  };

  // Validamos el campo que pierde el foco.
  // Si es "name" o "number" (campos requeridos) se ejecuta la validación.
  const validateField = async (field: string, value: any) => {
    let error = "";

    if ((field === "name" || field === "number") && !value) {
      error = "Este campo es obligatorio";

    } else if (field === "number") {
      const numValue = Number(value);
      if (numValue <= 0) {
        error = "Debe ser un número positivo";

      } else if (type === "edit" && form.number === numValue) {
        // Evita la validación si el número no cambió
        error = "";

      } else {
        // Validamos que el número de mesa no este en uso
        try {
          if (token) {
            const result = await validateTableByNumber(numValue, token);
            if (!result.ok && result.status === 200) {
              error = result.message;
            } else if (!result.ok) {
              error = result.message || "Error al validar el número";
            }
          } else {
            error = "No existe o caducó el token";
          }
        } catch (err) {
          console.error("Error al validar el número:", err);
          error = "No se pudo validar el número";
        }
      }
    } else if (field === "name") {
      if (type === "edit" && form.name === value) {
        // Evita la validación si el nombre no cambió
        error = "";
      } else {
        // Validamos que el nombre no este en uso
        try {
          if (token) {
            const result = await validateTableByName(value, token);
            if (!result.ok && result.status === 200) {
              error = result.message;
            } else if (!result.ok) {
              error = result.message || "Error al validar el nombre";
            }

          } else {
            error = "No existe o caducó el token";
          }
        } catch (err) {
          console.error("Error al validar el nombre:", err);
          error = "No se pudo validar el nombre";
        }
      }
    }

    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors, [field]: error };
      validateForm(newErrors, form);
      return newErrors;
    });
  };


  // Cada vez que cambien los errores o el formulario, revalida el formulario.
  useEffect(() => {
    validateForm(errors, form);
  }, [errors, form]);

  const clearErrors = () => {
    setErrors({
      name: "",
      number: "",
      coment: "",
    });
  }
  // Función para enviar los datos.
  const handleSave = () => {
    // Se chequea si el formulario es válido antes de guardar.
    if (!isFormValid) return;

    const dataToSend = {
      ...form,
      ...(type === "edit" ? { id: form.id } : {}),
    };
    onSave(dataToSend);
    clearErrors();
    onClose();
  };


  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        {type === "create" ? "Crear Mesa" : "Editar Mesa"}
      </DialogTitle>
      <DialogContent>
        {(["name", "number", "coment"] as Array<keyof MesaForm>).map(
          (field) => (
            <TextField
              key={field}
              margin="dense"
              label={fieldLabels[field]}
              type={field === "number" ? "number" : "text"}
              onChange={(e) => onChange(field, e.target.value)}
              onBlur={(e) => {
                // Validamos en blur solo los campos requeridos ("name" y "number")
                if (field === "name" || field === "number") {
                  validateField(field, e.target.value);
                }
              }}
              value={form[field] ?? ""}
              fullWidth
              variant="outlined"
              // Muestra el error y el mensaje correspondiente
              error={Boolean(errors[field])}
              helperText={errors[field]}
            />
          )
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => {
          clearErrors();
          onClose();
        }} color="primary">
          Cancelar
        </Button>
        <Button onClick={handleSave} color="primary" disabled={!isFormValid}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TableModal;
