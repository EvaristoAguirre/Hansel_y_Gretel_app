import React from "react";
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from "@mui/material";
import { ProductForm, ProductCreated } from '../Interfaces/IProducts';

interface ProductDialogProps {
  open: boolean;
  modalType: "create" | "edit";
  form: ProductCreated;
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
}) => {
  const fieldLabels: Record<keyof ProductForm, string> = {
    code: "Código",
    name: "Nombre",
    description: "Descripción",
    price: "Precio",
    cost: "Costo",
    inActive: "Inactivo",
    id: "ID", 
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle sx={{ color: "primary", fontWeight: "bold"}}>
        {modalType === "create" ? "Crear Producto" : "Editar Producto"}
      </DialogTitle>
      <DialogContent>
        {["code", "name", "description", "price", "cost"].map((field) => (
          <TextField
            key={field}
            margin="dense"
            label={fieldLabels[field]}
            type={["code", "price", "cost"].includes(field) ? "number" : "text"}
            inputProps={["price", "cost"].includes(field) ? { step: "0.50" } : undefined}
            value={form[field] ?? ""}
            onChange={(e) =>
              onChange(
                field as keyof ProductCreated,
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
}