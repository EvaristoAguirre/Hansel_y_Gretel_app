import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Typography,
  Divider,
  Box,
} from "@mui/material";
import dayjs from "dayjs";
import { capitalizeFirstLetter } from '../../Utils/CapitalizeFirstLetter';

type Payment = {
  amount: number;
  paymentMethod: string;
};

type CashMovementDetailsDto = {
  type: string;
  amount: number;
  createdAt: string;
  payments: Payment[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  movementDetails: CashMovementDetailsDto | null;
};

const CashMovementDetailModal = ({
  open,
  onClose,
  movementDetails,
}: Props) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{ fontWeight: "bold", fontSize: "1rem", color: "primary.main" }}
      >
        Detalle del Movimiento
      </DialogTitle>

      <DialogContent dividers>
        {movementDetails ? (
          <>
            <Box mb={2}>
              <Typography variant="subtitle1">
                <strong>Tipo:</strong> {capitalizeFirstLetter(movementDetails.type)}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Monto total:</strong> ${Number(movementDetails.amount).toFixed(2)}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Fecha:</strong>{" "}
                {dayjs(movementDetails.createdAt).format("DD/MM/YYYY HH:mm")}
              </Typography>
            </Box>

            <Divider />
            <Typography variant="h6" mt={2} mb={1}>
              Pagos
            </Typography>
            <Table size="small">
              <TableBody>
                {movementDetails.payments.map((p, index) => (
                  <TableRow key={index}>
                    <TableCell>{capitalizeFirstLetter(p.paymentMethod)}</TableCell>
                    <TableCell align="right">
                      ${Number(p.amount).toFixed(2)}
                    </TableCell>
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
        <Button onClick={onClose} variant="outlined">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CashMovementDetailModal;
