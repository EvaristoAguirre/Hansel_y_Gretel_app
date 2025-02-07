import React from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
} from "@mui/material";
import { MesaForm, MesaModalProps } from "../Interfaces/Cafe_interfaces";
import { on } from "events";
import { useEffect } from 'react';

const MesaModal: React.FC<MesaModalProps> = ({
  open,
  type,
  form,
  onClose,
  onSave,
  onChange,
}) => {

  const handleSave = () => {
    const dataToSend = {
      ...form,
      ...(type === "edit" ? { id: form.id } : {}),
    };
    onSave(dataToSend);
    console.log(" info para editar mesa o crear", dataToSend);


  };

  useEffect(() => {
    console.log("form", form);
  }, [form]);

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
              label={field}
              type={field === "number" ? "number" : "text"}
              onChange={(e) => onChange(field, e.target.value)}

              value={form[field] ?? ""}
              fullWidth
              variant="outlined"
            />
          )
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancelar
        </Button>
        <Button onClick={handleSave} color="primary">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MesaModal;
