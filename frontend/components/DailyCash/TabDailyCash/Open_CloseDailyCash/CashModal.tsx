import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { I_DC_Open_Close } from "@/components/Interfaces/IDailyCash";
import { NumericFormat } from "react-number-format";
import Swal from "sweetalert2";
import { dailyCashModalType } from "@/components/Enums/dailyCash";
import { useDailyCash } from "@/app/context/dailyCashContext";


interface Props {
  open: boolean;
  onClose: () => void;
  type: dailyCashModalType;
}

const CashModal = ({ open, onClose, type }: Props) => {
  const initialForm: I_DC_Open_Close = { comment: "", initialCash: 0 };
  const [form, setForm] = useState<I_DC_Open_Close>(initialForm);
  const [loading, setLoading] = useState(false);

  const { openCash, closeCash } = useDailyCash();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "finalCash" || name === "initialCash" ? Number(value) : value,
    }));
  };

  const isFormValid = () => {
    if (type === dailyCashModalType.OPEN) {
      return form.initialCash && form.initialCash !== undefined && form.initialCash !== null;
    } else {
      return form.finalCash !== undefined && form.finalCash !== null;
    }
  };


  const handleClose = () => {
    setForm(initialForm);
    onClose();

  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (type === dailyCashModalType.OPEN) {
        await openCash(form);
      } else {
        await closeCash(form);
      }
      handleClose();
    } catch (error) {
      console.error("Error al procesar caja:", error);
      Swal.fire("Error", `No se pudo ${type === dailyCashModalType.OPEN ? "abrir" : "cerrar"} la caja.`, "error");
    } finally {
      setLoading(false);
    }
  };




  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle color="primary" fontWeight="bold" fontSize="1rem">{type === dailyCashModalType.OPEN ? "Abrir" : "Cerrar"} Caja Diaria</DialogTitle>
      <DialogContent>
        <Box mt={2} display="flex" flexDirection="column" gap={2}>
          <NumericFormat
            customInput={TextField}
            label={type === dailyCashModalType.OPEN ? "Monto inicial" : "Monto final en caja"}
            name={type === dailyCashModalType.OPEN ? "initialCash" : "totalCash"}
            value={type === dailyCashModalType.OPEN ? form.initialCash : form.finalCash}
            thousandSeparator="."
            decimalSeparator=","
            decimalScale={2}
            allowNegative={false}
            type="text"
            fullWidth
            required
            onValueChange={(values) => {
              const num = values.floatValue ?? 0;
              setForm((prev) => ({
                ...prev,
                [type === dailyCashModalType.OPEN ? "initialCash" : "finalCash"]: num,
              }));
            }}
            onBlur={isFormValid}
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
        <Button onClick={handleSubmit} variant="contained" disabled={loading || !isFormValid()}>
          {type === dailyCashModalType.OPEN ? "Abrir Caja" : "Cerrar Caja"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};


export default CashModal;
