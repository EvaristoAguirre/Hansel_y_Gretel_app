import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  CircularProgress,
} from "@mui/material";
import { I_DC_Open } from "@/components/Interfaces/IDailyCash";
import { useAuth } from "@/app/context/authContext";
import { closeDailyCash, openDailyCash } from "@/api/dailyCash";
import { NumericFormat } from "react-number-format";
import Swal from "sweetalert2";
import { dailyCashModalType } from "@/components/Enums/dailyCash";


interface Props {
  open: boolean;
  onClose: () => void;
  type: dailyCashModalType;
}

const OpenCashModal = ({ open, onClose, type }: Props) => {
  const initialForm: I_DC_Open = { comment: "", initialCash: 0 };
  const [form, setForm] = useState<I_DC_Open>(initialForm);
  const [loading, setLoading] = useState(false);
  const { getAccessToken } = useAuth();
  const token = getAccessToken();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "totalCash" ? Number(value) : value,
    }));
  };

  const handleClose = () => {
    setForm(initialForm);
    onClose();
  };

  const handleSubmit = async () => {
    setLoading(true);
    if (type === dailyCashModalType.OPEN) {
      try {
        const response = token && await openDailyCash(token, form);
        if (response) {
          Swal.fire("Éxito", "Caja abierta correctamente.", "success");
        } else {
          Swal.fire("Error", "No se pudo abrir la caja.", "error");
        }
        handleClose();
      } catch (error) {
        console.error("Error al abrir caja:", error);
        Swal.fire("Error", "No se pudo abrir la caja.", "error");
      } finally {
        setLoading(false);
      }

    } else {
      // try {
      //   const response = token && await closeDailyCash(token, id, form);
      //   if (response) {
      //     Swal.fire("Éxito", "Caja cerrada correctamente.", "success");
      //   } else {
      //     Swal.fire("Error", "No se pudo cerrar la caja.", "error");
      //   }
      //   handleClose();
      // } catch (error) {
      //   console.error("Error al abrir caja:", error);
      //   Swal.fire("Error", "No se pudo cerrar la caja.", "error");
      // } finally {
      //   setLoading(false);
      // }
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle color="primary" fontWeight="bold" fontSize="1rem">{type === dailyCashModalType.OPEN ? "Abrir" : "Cerrar"} Caja Diaria</DialogTitle>
      <DialogContent>
        <Box mt={2} display="flex" flexDirection="column" gap={2}>
          <NumericFormat
            customInput={TextField}
            label="Total en Caja"
            value={form.initialCash}
            thousandSeparator="."
            decimalSeparator=","
            decimalScale={2}
            allowNegative={false}
            type="text"
            fullWidth
            required
            onValueChange={(values) => {
              const num = values.floatValue ?? null;
              setForm((prev) => ({
                ...prev,
                initialCash: num,
              }));
            }}
          />
          <TextField
            name="comment"
            label="Comentario (opcional)"
            value={form.comment}
            onChange={handleChange}
            multiline
            rows={2}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {type === dailyCashModalType.OPEN ? "Abrir Caja" : "Cerrar Caja"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};


export default OpenCashModal;
