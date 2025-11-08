import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  Typography,
  Button,
  Divider,
  Box,
} from '@mui/material';
import dayjs from 'dayjs';
import { OrderCash } from '@/components/Interfaces/IDailyCash';
import { capitalizeFirstLetter } from '@/components/Utils/CapitalizeFirstLetter';
import { formatNumber } from '@/components/Utils/FormatNumber';

type Props = {
  open: boolean;
  onClose: () => void;
  orderDetails: OrderCash | null;
};

const OrderDetailModal = ({ open, onClose, orderDetails }: Props) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle
        sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'primary.main' }}
      >
        Detalle de la Orden
      </DialogTitle>
      <DialogContent dividers>
        {orderDetails ? (
          <>
            <Box mb={2}>
              <Typography variant="body1">
                <strong>Fecha:</strong>{' '}
                {dayjs(orderDetails.date).format('DD/MM/YYYY HH:mm')}
              </Typography>
              <Typography variant="body1">
                <strong>Sala:</strong> {orderDetails.room} |{' '}
                <strong>Mesa:</strong> {orderDetails.table}
              </Typography>
              <Typography variant="body1">
                <strong>Clientes:</strong> {orderDetails.numberCustomers}
              </Typography>
              <Typography variant="body1">
                <strong>Hora de apertura:</strong>{' '}
                {dayjs(orderDetails.createdAt).format('HH:mm')}
              </Typography>
              {orderDetails.closedAt && (
                <Typography variant="body1">
                  <strong>Hora de cierre:</strong>{' '}
                  {dayjs(orderDetails.closedAt).format('HH:mm')}
                </Typography>
              )}
              <Typography variant="h6" mt={1.5} color="primary">
                Total: ${formatNumber(Number(orderDetails.total))}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Métodos de Pago
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Método</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Monto</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orderDetails.paymentMethods.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      {capitalizeFirstLetter(p.methodOfPayment)}
                    </TableCell>
                    <TableCell>${formatNumber(Number(p.amount))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Typography
              variant="subtitle1"
              gutterBottom
              fontWeight="bold"
              mt={2}
            >
              Productos
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Cantidad</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Producto</strong>
                  </TableCell>
                  <TableCell>
                    <strong>N° Comanda</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orderDetails.products.map((prod, i) => (
                  <TableRow key={i}>
                    <TableCell>{prod.quantity}</TableCell>
                    <TableCell>{capitalizeFirstLetter(prod.name)}</TableCell>
                    <TableCell>{prod.commandNumber}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        ) : (
          <Typography>Cargando detalle...</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="primary" onClick={onClose}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderDetailModal;
