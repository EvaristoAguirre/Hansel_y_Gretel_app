import { addStock } from "@/api/stock";
import { SelectedItem } from "@/components/Interfaces/IStock";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { useState } from "react";

export interface ModalStockProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  selectedItem: SelectedItem;
  token: string | null;
}

const ModalStock: React.FC<ModalStockProps> = ({ open, onClose, onSave, selectedItem, token }) => {
  const [quantityInStock, setQuantityInStock] = useState("");
  const [minimumStock, setMinimumStock] = useState("");

  const handleSubmit = async () => {
    // Armar el payload
    const payload: any = {
      quantityInStock: parseInt(quantityInStock, 10),
      minimumStock: parseInt(minimumStock, 10)
    };

    // Agregar productId o ingredientId según corresponda
    if (selectedItem.type === "product") {
      payload.productId = selectedItem.id;
    } else if (selectedItem.type === "ingredient") {
      payload.ingredientId = selectedItem.id;
    }

    if (token) {
      try {
        const response = await addStock(payload, token);
        console.log("Stock agregado:", response);
        onSave();
        onClose();
      } catch (error) {
        console.error("Error al agregar stock:", error);
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Agregar Stock a {selectedItem?.name}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Cantidad en Stock"
          type="number"
          fullWidth
          variant="standard"
          value={quantityInStock}
          onChange={(e) => setQuantityInStock(e.target.value)}
        />
        <TextField
          margin="dense"
          label="Stock Mínimo"
          type="number"
          fullWidth
          variant="standard"
          value={minimumStock}
          onChange={(e) => setMinimumStock(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalStock;