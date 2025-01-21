import React from "react";
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from "@mui/material";
import { ProductForm } from "../Interfaces/IProducts";

interface ProductDialogProps {
  open: boolean;
  modalType: "create" | "edit";
  form: ProductForm;
  onChange: (field: keyof ProductForm, value: string | number | null) => void;
  onClose: () => void;
  onSave: () => void;
}

export const ProductDialog: React.FC<ProductDialogProps> = ({
  open,
  modalType,
  form,
  onChange,
  onClose,
  onSave,
}) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>{modalType === "create" ? "Crear Producto" : "Editar Producto"}</DialogTitle>
    <DialogContent>
      {["code", "name", "description", "price", "cost"].map((field) => (
        <TextField
          key={field}
          margin="dense"
          label={field}
          type={["code", "price", "cost"].includes(field) ? "number" : "text"}
          inputProps={["price", "cost"].includes(field) ? { step: "0.50" } : undefined}
          value={form[field] ?? ""}
          onChange={(e) =>
            onChange(
              field as keyof ProductForm,
              ["price", "cost"].includes(field)
                ? e.target.value === ""
                  ? null
                  : parseFloat(e.target.value)
                : e.target.value
            )
          }
          fullWidth
          variant="outlined"
        />
      ))}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="primary">
        Cancelar
      </Button>
      <Button onClick={onSave} color="primary">
        Guardar
      </Button>
    </DialogActions>
  </Dialog>
);
