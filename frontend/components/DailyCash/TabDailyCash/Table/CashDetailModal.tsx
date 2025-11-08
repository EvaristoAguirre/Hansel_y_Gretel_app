import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Chip,
  Divider,
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import { capitalizeFirstLetter } from '@/components/Utils/CapitalizeFirstLetter';
import { dailyCashState } from '@/components/Enums/dailyCash';
import { IDailyCash } from '@/components/Interfaces/IDailyCash';
import DifferenceIcon from '@mui/icons-material/CompareArrows';
import { GridArrowDownwardIcon, GridArrowUpwardIcon } from '@mui/x-data-grid';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import { formatNumber } from '@/components/Utils/FormatNumber';

interface Props {
  open: boolean;
  onClose: () => void;
  data: IDailyCash | null;
}

const CashDetailModal = ({ open, onClose, data }: Props) => {
  if (!data) return null;

  const totals = [
    {
      label: 'Efectivo',
      value: data.totalCash,
      icon: <AttachMoneyIcon color="success" fontSize="small" />,
    },
    {
      label: 'Tarjeta Débito',
      value: data.totalDebitCard,
      icon: <CreditCardIcon color="primary" fontSize="small" />,
    },
    {
      label: 'Tarjeta Crédito',
      value: data.totalCreditCard,
      icon: <CreditCardIcon color="primary" fontSize="small" />,
    },
    {
      label: 'Transferencia',
      value: data.totalTransfer,
      icon: <AccountBalanceIcon color="info" fontSize="small" />,
    },
    {
      label: 'Mercado Pago',
      value: data.totalMercadoPago,
      icon: <AccountBalanceWalletIcon color="secondary" fontSize="small" />,
    },
  ];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        color="primary"
        fontWeight="bold"
        fontSize="1rem"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        Detalle de Caja –{' '}
        {new Date(data.date ?? '').toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })}
        <Chip
          label={data.state === dailyCashState.OPEN ? 'Abierta' : 'Cerrada'}
          color={data.state === dailyCashState.OPEN ? 'success' : 'error'}
          size="small"
          sx={{ fontWeight: 500, ml: 2 }}
        />
      </DialogTitle>
      <DialogContent dividers>
        {/* Sección: Resumen de caja */}
        <Typography
          variant="subtitle1"
          mt={1}
          gutterBottom
          fontWeight="bold"
          color="primary"
        >
          Cierre de Caja
        </Typography>

        <Grid container spacing={2}>
          {/* Columna izquierda */}
          <Grid item xs={6}>
            <Typography display="flex" alignItems="center" gap={1}>
              <AttachMoneyIcon color="info" fontSize="small" />
              <strong>Dinero Inicial:</strong> ${' '}
              {formatNumber(Number(data.initialCash) || 0)}
            </Typography>

            <Typography display="flex" alignItems="center" gap={1}>
              <MonetizationOnIcon color="success" fontSize="small" />
              <strong>Dinero Final:</strong> ${' '}
              {formatNumber(Number(data.finalCash) || 0)}
            </Typography>

            <Typography display="flex" alignItems="center" gap={1}>
              <DifferenceIcon color="warning" fontSize="small" />
              <strong>Diferencia:</strong> ${' '}
              {formatNumber(Number(data.cashDifference) || 0)}
            </Typography>
          </Grid>

          {/* Columna derecha */}
          <Grid item xs={6}>
            <Typography display="flex" alignItems="center" gap={1}>
              <GridArrowDownwardIcon color="warning" fontSize="small" />
              <strong>Total de Ingresos:</strong> ${' '}
              {formatNumber(Number(data.totalIncomes) || 0)}
            </Typography>

            <Typography display="flex" alignItems="center" gap={1}>
              <GridArrowUpwardIcon color="error" fontSize="small" />
              <strong>Total de Egresos:</strong> ${' '}
              {formatNumber(Number(data.totalExpenses) || 0)}
            </Typography>

            <Typography display="flex" alignItems="center" gap={1}>
              <PointOfSaleIcon color="success" fontSize="small" />
              <strong>Total de Ventas:</strong> ${' '}
              {formatNumber(Number(data.totalSales) || 0)}
            </Typography>

            <Typography display="flex" alignItems="center" gap={1}>
              <VolunteerActivismIcon color="info" fontSize="small" />
              <strong>Total de Propinas:</strong> ${' '}
              {formatNumber(Number(data.totalTips) || 0)}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ mt: 2, mb: 2, borderWidth: 2 }} />

        {/* Métodos de pago */}
        <Typography
          variant="subtitle1"
          mt={3}
          gutterBottom
          fontWeight="bold"
          color="primary"
        >
          Total por Medio de Pago
        </Typography>
        <Grid container spacing={2}>
          {totals.map((t) => (
            <Grid item xs={6} key={t.label}>
              <Typography display="flex" alignItems="center" gap={1}>
                {t.icon}
                <strong>{t.label}:</strong> ${' '}
                {formatNumber(Number(t.value) || 0)}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <Typography
        variant="subtitle1"
        gutterBottom
        fontFamily={'italic'}
        sx={{ mx: 2 }}
      >
        Comentario:{' '}
        {data.comment && data.comment.length > 0
          ? capitalizeFirstLetter(data.comment)
          : 'Sin comentarios'}
      </Typography>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CashDetailModal;
