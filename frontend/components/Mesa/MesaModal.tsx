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

const MesaModal: React.FC<MesaModalProps> = ({
  open,
  type,
  form,
   onClose,
  onSave,
  onChange,
}) => {
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
        <Button
          onClick={onSave}
          color="primary"
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MesaModal;
