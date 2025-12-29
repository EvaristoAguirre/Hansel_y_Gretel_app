import React, { useState } from "react";
import {
  Modal,
  Box,
  TextField,
  Button,
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
  DialogActions,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { ProductResponse, SlotForm } from "@/components/Interfaces/IProducts";
import { TypeProduct } from "@/components/Enums/view-products";

interface SlotCreationModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (slotData: SlotForm) => void;
  products: ProductResponse[];
}

const initialSlotForm: SlotForm = {
  name: "",
  description: "",
  products: [],
};

const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const SlotCreationModal: React.FC<SlotCreationModalProps> = ({
  open,
  onClose,
  onSave,
  products,
}) => {
  // Filtrar productos que no sean de tipo "promotion"
  const filteredProducts = products.filter(
    (product) => product.type !== TypeProduct.PROMO
  );

  const [form, setForm] = useState<SlotForm>(initialSlotForm);
  const [errors, setErrors] = useState<{ name?: string; products?: string }>(
    {}
  );

  // IDs de productos seleccionados
  const selectedIds = form.products.map((p) => p.id);

  const handleChange = (
    field: keyof SlotForm,
    value: string | ProductResponse[]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    // Limpiar error al escribir
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleProductToggle = (product: ProductResponse) => {
    const isSelected = selectedIds.includes(product.id);
    let newProducts: ProductResponse[];

    if (isSelected) {
      newProducts = form.products.filter((p) => p.id !== product.id);
    } else {
      newProducts = [...form.products, product];
    }

    handleChange("products", newProducts);
  };

  const validateForm = (): boolean => {
    const newErrors: { name?: string; products?: string } = {};

    if (!form.name.trim()) {
      newErrors.name = "El nombre es obligatorio";
    }

    if (form.products.length === 0) {
      newErrors.products = "Debe seleccionar al menos un producto";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(form);
      handleClose();
    }
  };

  const handleClose = () => {
    setForm(initialSlotForm);
    setErrors({});
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
    >
      <Box
        sx={{
          width: 500,
          bgcolor: "background.paper",
          p: 4,
          mx: "auto",
          mt: 2,
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: 2,
          boxShadow: 24,
        }}
      >
        <Grid container spacing={2}>
          {/* Campo Nombre */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nombre"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              variant="outlined"
              size="small"
              placeholder="Ingrese el nombre del slot"
            />
          </Grid>

          {/* Campo Descripción */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descripción"
              multiline
              minRows={3}
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              variant="outlined"
              size="small"
              placeholder="Ingrese una descripción (opcional)"
            />
          </Grid>

          {/* Selector Múltiple de Productos */}
          <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary" mb={1}>
              Productos
            </Typography>
            <div
              style={{
                maxHeight: "250px",
                overflowY: "auto",
                border: errors.products
                  ? "1px solid #d32f2f"
                  : "1px solid #ccc",
                borderRadius: "4px",
                padding: "8px",
              }}
            >
              <FormGroup key={selectedIds.join(",")}>
                {filteredProducts.map((product) => (
                  <FormControlLabel
                    key={product.id}
                    control={
                      <Checkbox
                        checked={selectedIds.includes(product.id)}
                        onChange={() => handleProductToggle(product)}
                      />
                    }
                    label={capitalizeFirstLetter(product.name)}
                  />
                ))}
              </FormGroup>
              {filteredProducts.length === 0 && (
                <Typography
                  variant="body2"
                  color="textSecondary"
                  textAlign="center"
                >
                  No hay productos disponibles
                </Typography>
              )}
            </div>
            {errors.products && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                {errors.products}
              </Typography>
            )}
          </Grid>
        </Grid>

        <DialogActions sx={{ justifyContent: "space-between", mt: 3, px: 0 }}>
          <Button onClick={handleClose} color="warning">
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!form.name.trim() || form.products.length === 0}
          >
            Crear Slot
          </Button>
        </DialogActions>
      </Box>
    </Modal>
  );
};

export default SlotCreationModal;
