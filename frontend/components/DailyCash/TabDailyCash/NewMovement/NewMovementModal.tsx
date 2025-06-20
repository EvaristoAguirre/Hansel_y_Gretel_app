import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Typography,
  IconButton,
  Box,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { NumericFormat } from "react-number-format";
import { useState } from "react";
import { dailyCashType, paymentMethod } from "@/components/Enums/dailyCash";

const paymentMethods = [
  "Efectivo",
  "Tarjeta Débito",
  "Tarjeta Crédito",
  "Transferencia",
  "Mercado Pago",
  "Otros",
];

interface PaymentEntry {
  paymentMethod: paymentMethod;
  amount: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: {
    movementType: dailyCashType;
    payments: PaymentEntry[];
    description: string;
  }) => void;
}

const NewMovementModal = ({ open, onClose, onConfirm }: Props) => {
  const [movementType, setMovementType] = useState<dailyCashType>(dailyCashType.INCOME);
  const [payments, setPayments] = useState<PaymentEntry[]>([
    { paymentMethod: paymentMethod.CASH, amount: 0 },
  ]);
  const [description, setDescription] = useState("");

  const handlePaymentChange = (index: number, field: keyof PaymentEntry, value: any) => {
    const updated = [...payments];
    if (field === "amount") {
      updated[index][field] = Number(value);
    } else {
      updated[index][field] = value as paymentMethod;
    }
    setPayments(updated);
  };

  const addPayment = () => {
    setPayments([...payments, { paymentMethod: paymentMethod.CASH, amount: 0 }]);
  };

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const total = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

  const handleConfirm = () => {
    onConfirm({ movementType, payments, description });
    // Limpiamos:
    setMovementType(dailyCashType.INCOME);
    setPayments([{ paymentMethod: paymentMethod.CASH, amount: 0 }]);
    setDescription("");
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Nuevo Movimiento</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* Tipo de movimiento */}
          <Grid item xs={12}>
            <TextField
              select
              label="Tipo de Movimiento"
              fullWidth
              value={movementType}
              onChange={(e) => setMovementType(e.target.value as dailyCashType)}
              size="small"
            >
              <MenuItem value="Ingreso">Ingreso</MenuItem>
              <MenuItem value="Egreso">Egreso</MenuItem>
            </TextField>
          </Grid>

          {/* Métodos de pago */}
          {payments.map((p, i) => (
            <Grid container spacing={1} key={i} alignItems="center" sx={{ mt: 1, mx: 1 }}>
              <Grid item xs={5}>
                <TextField
                  select
                  label="Método de Pago"
                  fullWidth
                  size="small"
                  value={p.paymentMethod}
                  onChange={(e) => handlePaymentChange(i, "paymentMethod", e.target.value)}
                >
                  {paymentMethods.map((m) => (
                    <MenuItem key={m} value={m}>
                      {m}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={5}>
                <NumericFormat
                  customInput={TextField}
                  label="Monto"
                  value={p.amount}
                  thousandSeparator="."
                  decimalSeparator=","
                  decimalScale={2}
                  allowNegative={false}
                  fullWidth
                  size="small"
                  onValueChange={(values) => {
                    handlePaymentChange(i, "amount", values.floatValue ?? 0);
                  }}
                />
              </Grid>
              <Grid item xs={2}>
                {i > 0 && (
                  <IconButton onClick={() => removePayment(i)} color="error">
                    <RemoveCircleOutlineIcon />
                  </IconButton>
                )}
              </Grid>
            </Grid>
          ))}

          {/* Agregar otro método */}
          <Grid item xs={12}>
            <Button size="small" onClick={addPayment} startIcon={<AddIcon />} sx={{ textTransform: "none" }}>
              Agregar otro método de pago
            </Button>
          </Grid>

          {/* Descripción */}
          <Grid item xs={12}>
            <TextField
              label="Descripción"
              fullWidth
              multiline
              minRows={2}
              maxRows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ingrese una descripción..."
              size="small"
            />
          </Grid>
        </Grid>

        {/* Total */}
        <Box mt={3} bgcolor="#856D5E" color="white" p={1} textAlign="center" fontWeight="bold" fontSize={16}>
          TOTAL: $
          {new Intl.NumberFormat("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(total)}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleConfirm} variant="contained" color="primary">
          Confirmar
        </Button>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewMovementModal;
