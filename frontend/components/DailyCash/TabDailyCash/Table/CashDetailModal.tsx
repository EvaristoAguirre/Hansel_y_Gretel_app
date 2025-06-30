import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Chip,
} from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import { capitalizeFirstLetter } from "@/components/Utils/CapitalizeFirstLetter";
import { dailyCashState } from "@/components/Enums/dailyCash";
import { IDailyCash } from "@/components/Interfaces/IDailyCash";

interface Props {
  open: boolean;
  onClose: () => void;
  data: IDailyCash | null;
}

const CashDetailModal = ({ open, onClose, data }: Props) => {
  if (!data) return null;

  const totals = [
    {
      label: "Efectivo",
      value: data.totalCash,
      icon: <AttachMoneyIcon color="success" fontSize="small" />,
    },
    {
      label: "Tarjeta Débito",
      value: data.totalDebitCard,
      icon: <CreditCardIcon color="primary" fontSize="small" />,
    },
    {
      label: "Tarjeta Crédito",
      value: data.totalCreditCard,
      icon: <CreditCardIcon color="primary" fontSize="small" />,
    },
    {
      label: "Transferencia",
      value: data.totalTransfer,
      icon: <AccountBalanceIcon color="info" fontSize="small" />,
    },
    {
      label: "Mercado Pago",
      value: data.totalMercadoPago,
      icon: <AccountBalanceWalletIcon color="secondary" fontSize="small" />,
    },
    {
      label: "Otros",
      value: data.totalOtherPayments,
      icon: <MonetizationOnIcon color="warning" fontSize="small" />,
    },
  ];


  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle color="primary" fontWeight="bold" fontSize="1rem"
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }} >
        Detalle de Caja –{" "}
        {new Date(data.date ?? '').toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}
        <Chip
          label={data.state === dailyCashState.OPEN ? "Abierta" : "Cerrada"}
          color={data.state === dailyCashState.OPEN ? "success" : "error"}
          size="small"
          sx={{ fontWeight: 500, ml: 2 }}
        />
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="subtitle1" gutterBottom>
          Comentario: {data.comment && (data.comment.length < 0 ? capitalizeFirstLetter(data.comment) : "Sin comentarios")}
        </Typography>
        <Grid container spacing={2} mt={1}>
          {totals.map((t) => (
            <Grid item xs={6} key={t.label}>
              <Typography display="flex" alignItems="center" gap={1}>
                {t.icon}
                <strong>{t.label}:</strong> ${Number(t.value).toFixed(2)}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CashDetailModal;
