import { orderToClosed } from "@/api/order";
import { editTable } from "@/api/tables";
import { useAuth } from "@/app/context/authContext";
import { useRoomContext } from "@/app/context/room.context";
import { Payment } from "@mui/icons-material";
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Paper,
  TextField,
  Radio,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Grid,
  Box,
  Switch,
  Tooltip
} from "@mui/material";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useOrderContext } from "../../app/context/order.context";
import { useTableStore } from "../Table/useTableStore";
import { useOrderStore } from "./useOrderStore";
import { paymentMethod } from "../Enums/dailyCash";
import { TableState } from "../Enums/table";
import { capitalizeFirstLetter } from "../Utils/CapitalizeFirstLetter";
import { OrderState } from "../Enums/order";
import { formatNumber } from "../Utils/FormatNumber";

interface DraftPayment {
  productIds: string[];
  method: paymentMethod | '';
  tipType: 'none' | '10' | 'custom';
  customTip: number;
}

interface ConfirmedPayment {
  productIds: string[];
  methodOfPayment: paymentMethod;
  amount: number;
}

export interface PayOrderProps {
  handleComplete: () => void;
}

const PayOrder: React.FC<PayOrderProps> = ({ handleComplete }) => {
  const { selectedOrderByTable, setSelectedOrderByTable, confirmedProducts } = useOrderContext();
  const { selectedTable, setSelectedTable } = useRoomContext();
  const { updateTable } = useTableStore();
  const { updateOrder } = useOrderStore();
  const { getAccessToken } = useAuth();
  const token = getAccessToken();

  // Estado separado para switch de pago total
  const [fullPaymentMode, setFullPaymentMode] = useState(false);
  const [draftPayment, setDraftPayment] = useState<DraftPayment>({ productIds: [], method: '', tipType: 'none', customTip: 0 });
  const [confirmedPayments, setConfirmedPayments] = useState<ConfirmedPayment[]>([]);

  useEffect(() => {
    setFullPaymentMode(false);
    setDraftPayment({ productIds: [], method: '', tipType: 'none', customTip: 0 });
    setConfirmedPayments([]);
  }, [selectedOrderByTable?.id]);

  const unpaidIds = confirmedProducts.map(p => p.internalId!).filter(id => !confirmedPayments.some(cp => cp.productIds.includes(id)));

  const handleFullToggle = () => {
    setFullPaymentMode(prev => {
      const next = !prev;
      if (next) {
        // Al activar, seleccionar todos y limpiar parciales
        setDraftPayment(prevDp => ({ ...prevDp, productIds: unpaidIds }));
        setConfirmedPayments([]);
      } else {
        // Al desactivar, deseleccionar todos
        setDraftPayment(prevDp => ({ ...prevDp, productIds: [] }));
      }
      return next;
    });
  };

  const toggleProductSelection = (id: string) => {
    setDraftPayment(prev => ({
      ...prev,
      productIds: prev.productIds.includes(id)
        ? prev.productIds.filter(pid => pid !== id)
        : [...prev.productIds, id]
    }));
  };

  const allSelected = unpaidIds.length > 0 && unpaidIds.every(id => draftPayment.productIds.includes(id));

  const handleAddDraftAsConfirmed = () => {
    const { productIds, method, tipType, customTip } = draftPayment;
    if (!productIds.length || !method) {
      Swal.fire("Selecciona productos y método de pago", "", "warning");
      return;
    }
    const used = confirmedPayments.flatMap(cp => cp.productIds);
    if (productIds.some(id => used.includes(id))) {
      Swal.fire("Producto ya asignado a otro pago", "", "error");
      return;
    }
    const base = productIds.reduce(
      (sum, id) =>
        sum +
        Number(confirmedProducts.find(p => p.internalId === id)?.unitaryPrice ?? 0),
      0
    );
    const amount = tipType === '10' ? base * 1.1 : tipType === 'custom' ? base + customTip : base;
    setConfirmedPayments(prev => [...prev, { productIds, methodOfPayment: method, amount }]);
    setDraftPayment({ productIds: [], method: '', tipType: 'none', customTip: 0 });
  };

  const handlePayOrder = async () => {
    if (!token || !selectedOrderByTable || !selectedTable) return;
    const allIds = confirmedProducts.map(p => p.internalId!);
    const paidIds = confirmedPayments.flatMap(cp => cp.productIds);
    if (allIds.some(id => !paidIds.includes(id))) {
      Swal.fire("Faltan productos por pagar", "", "warning");
      return;
    }
    try {
      const payments = confirmedPayments.map(cp => ({ amount: cp.amount, methodOfPayment: cp.methodOfPayment }));
      const paidOrder = await orderToClosed(selectedOrderByTable.id, token, payments);
      if (paidOrder) Swal.fire("Orden cerrada con éxito", "", "success");
      const closedTable = await editTable({ ...selectedTable, state: TableState.CLOSED }, token);
      if (paidOrder) { setSelectedOrderByTable(paidOrder); updateOrder(paidOrder); }
      if (closedTable) { setSelectedTable(closedTable); updateTable(closedTable); }
      handleComplete();
    } catch (e: any) {
      console.error(e);
      Swal.fire(e.statusCode === 409 ? "No hay caja abierta" : "Error", e.message || "No se pudo cerrar.", "error");
    }
  };

  // Totales
  const baseAmount = draftPayment.productIds.reduce(
    (sum, id) =>
      sum +
      Number(confirmedProducts.find(p => p.internalId === id)?.unitaryPrice ?? 0),
    0
  );
  const total10 = (baseAmount * 1.1).toFixed(2);
  const totalCustom = (baseAmount + draftPayment.customTip).toFixed(2);

  // Auto-confirmación pago completo
  const isBulkPaid = fullPaymentMode && draftPayment.method && allSelected && confirmedPayments.length === 0;
  useEffect(() => {
    if (isBulkPaid) {
      const amount = draftPayment.tipType === '10'
        ? baseAmount * 1.1
        : draftPayment.tipType === 'custom'
          ? baseAmount + draftPayment.customTip
          : baseAmount;
      setConfirmedPayments([{ productIds: [...draftPayment.productIds], methodOfPayment: draftPayment.method as paymentMethod, amount }]);
    }
  }, [isBulkPaid]);

  const orderStates = { pending_payment: "PENDIENTE DE PAGO", open: "ORDEN ABIERTA", cancelled: "ORDEN CANCELADA", closed: "ORDEN PAGADA/CERRADA" };
  const orderStyles = { pending_payment: "text-red-500", open: "text-orange-500", cancelled: "text-gray-500", closed: "text-green-500" };
  const total = selectedOrderByTable?.total || 0;

  return (
    <Box width="100%" p={2} mt={2} border="1px solid #d4c0b3" boxShadow={3} borderRadius={2}>
      <Typography variant="h6" sx={{ backgroundColor: "#7e9d8a", color: "white", p: 1, textAlign: "center", borderRadius: 1, mb: 2 }}>
        ESTADO DE LA ORDEN
      </Typography>

      <Grid container spacing={2} mb={2}>
        <Grid item xs={4}>
          <Typography fontWeight="bold">Total:</Typography>
          <Typography>${formatNumber(total)}</Typography>

        </Grid>
        <Grid item xs={4}><Typography fontWeight="bold">Unidades:</Typography><Typography>{confirmedProducts.length}</Typography></Grid>
        <Grid item xs={4}><Typography fontWeight="bold">Estado:</Typography><Typography className={orderStyles[selectedOrderByTable?.state as keyof typeof orderStyles]}>{orderStates[selectedOrderByTable?.state as keyof typeof orderStates]}</Typography></Grid>
      </Grid>

      <Divider />

      {selectedOrderByTable?.state === OrderState.PENDING_PAYMENT ? (
        <Box>
          <FormControlLabel
            control={
              <Tooltip title={confirmedPayments.length > 0 ? "No puedes cambiar al pago total con pagos parciales" : ""}>
                <span>
                  <Switch checked={fullPaymentMode} onChange={handleFullToggle} disabled={confirmedPayments.length > 0} />
                </span>
              </Tooltip>
            }
            label="PAGA EL TOTAL DE LA ORDEN"
            sx={{ mt: 1, fontWeight: "bold", color: fullPaymentMode ? "red" : "black" }}
          />

          {/* Modo Parcial */}
          {!fullPaymentMode && (
            <>
              <Box display="flex" width="100%" mt={2}>
                <Box flex={1} width="60%">
                  <Typography fontWeight="bold">1. Seleccionar productos:</Typography>
                  <Box overflow="auto"
                    sx={{
                      maxHeight: 300,
                      '&::-webkit-scrollbar': {
                        width: 8,
                        backgroundColor: '#d9ccbc',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: '#7e9d8a',
                        borderRadius: 4,
                      },
                      '&::-webkit-scrollbar-thumb:hover': {
                        backgroundColor: '#555',
                      },
                    }}
                  >
                    <List >
                      {confirmedProducts.map(p => {
                        const checked = draftPayment.productIds.includes(p.internalId!);
                        const disabled = confirmedPayments.flatMap(cp => cp.productIds).includes(p.internalId!);
                        return (
                          <ListItem key={p.internalId} disableGutters sx={{ py: 0, color: disabled ? "text.secondary" : "text.primary" }}>
                            <ListItemIcon sx={{ minWidth: 32, mr: 1 }}>
                              <Checkbox checked={checked} disabled={disabled} onChange={() => toggleProductSelection(p.internalId!)} />
                            </ListItemIcon>
                            <ListItemText
                              primary={`${capitalizeFirstLetter(p.productName)} - $${formatNumber(Number(p.unitaryPrice ?? 0))}`}
                              primaryTypographyProps={{ sx: { color: disabled ? "text.disabled" : "text.primary" } }}
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  </Box>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
                <Box flex={1} width="40%" >
                  <Typography fontWeight="bold">2. Tipo de total:</Typography>
                  <Box display="grid" gridTemplateColumns="30px 3fr 1fr" alignItems="center" rowGap={1} mt={1}>
                    <Radio checked={draftPayment.tipType === "none"} onChange={() => setDraftPayment({ ...draftPayment, tipType: "none" })} />
                    <Typography>Total sin propina</Typography>
                    <Typography>${formatNumber(baseAmount)}</Typography>

                    <Radio checked={draftPayment.tipType === "10"} onChange={() => setDraftPayment({ ...draftPayment, tipType: "10" })} />
                    <Typography>Total + 10% propina</Typography>
                    <Typography>${formatNumber(Number(total10))}</Typography>

                    <Radio checked={draftPayment.tipType === "custom"} onChange={() => setDraftPayment({ ...draftPayment, tipType: "custom" })} />
                    <Typography>Total + propina personalizada</Typography>
                    <Typography>${formatNumber(Number(totalCustom))}</Typography>
                  </Box>
                  {draftPayment.tipType === "custom" && (
                    <TextField type="number" placeholder="Propina" value={draftPayment.customTip} onChange={e => setDraftPayment({ ...draftPayment, customTip: Number(e.target.value) })} fullWidth sx={{ mt: 1 }} />
                  )}
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography fontWeight="bold">3. Método de pago:</Typography>
              <FormControl fullWidth sx={{ mt: 1 }}>
                <InputLabel>Método</InputLabel>
                <Select value={draftPayment.method} label="Método" onChange={e => setDraftPayment({ ...draftPayment, method: e.target.value as paymentMethod })}>
                  {Object.values(paymentMethod).map(m => <MenuItem key={m} value={m}>{capitalizeFirstLetter(m)}</MenuItem>)}
                </Select>
              </FormControl>
              <Button variant="outlined" color="success" fullWidth sx={{ mt: 2 }} disabled={!draftPayment.method || !draftPayment.productIds.length} onClick={handleAddDraftAsConfirmed}>Confirmar pago parcial</Button>
              {confirmedPayments.length > 0 && (
                <>
                  <Typography fontWeight="bold" mt={4}>Pagos parciales:</Typography>
                  <Grid container spacing={2} mt={1}>
                    {confirmedPayments.map((cp, i) => (
                      <Grid item xs={12} sm={6} key={i}>
                        <Paper sx={{ p: 2 }}>
                          <Typography fontWeight="bold">Pago #{i + 1}</Typography>
                          <Typography>Total: ${formatNumber(cp.amount)}</Typography>
                          <Typography>Método: {capitalizeFirstLetter(cp.methodOfPayment)}</Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}
            </>
          )}

          {/* Modo Total */}
          {fullPaymentMode && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography fontWeight="bold">Tipo de total:</Typography>
              <Box display="grid" gridTemplateColumns="30px 3fr 1fr" alignItems="center" rowGap={1} mt={1}>
                <Radio checked={draftPayment.tipType === "none"} onChange={() => setDraftPayment({ ...draftPayment, tipType: "none" })} />
                <Typography>Total sin propina</Typography>
                <Typography>${baseAmount.toFixed(2)}</Typography>

                <Radio checked={draftPayment.tipType === "10"} onChange={() => setDraftPayment({ ...draftPayment, tipType: "10" })} />
                <Typography>Total + 10% propina</Typography>
                <Typography>${total10}</Typography>

                <Radio checked={draftPayment.tipType === "custom"} onChange={() => setDraftPayment({ ...draftPayment, tipType: "custom" })} />
                <Typography>Total + propina personalizada</Typography>
                <Typography>${totalCustom}</Typography>
              </Box>
              {draftPayment.tipType === "custom" && (
                <TextField type="number" placeholder="Propina" value={draftPayment.customTip} onChange={e => setDraftPayment({ ...draftPayment, customTip: Number(e.target.value) })} fullWidth sx={{ mt: 1 }} />
              )}

              <Divider sx={{ my: 2 }} />
              <Typography fontWeight="bold">Método de pago:</Typography>
              <FormControl fullWidth sx={{ mt: 1 }}>
                <InputLabel>Método</InputLabel>
                <Select value={draftPayment.method} label="Método" onChange={e => setDraftPayment({ ...draftPayment, method: e.target.value as paymentMethod })}>
                  {Object.values(paymentMethod).map(m => <MenuItem key={m} value={m}>{capitalizeFirstLetter(m)}</MenuItem>)}
                </Select>
              </FormControl>

              {/* Resumen pago total */}
              {confirmedPayments.length > 0 && (
                <Paper sx={{ p: 2, mt: 2 }}>
                  <Typography fontWeight="bold">Pago total</Typography>
                  <Typography>Total: ${confirmedPayments[0].amount.toFixed(2)}</Typography>
                  <Typography>Método: {capitalizeFirstLetter(confirmedPayments[0].methodOfPayment)}</Typography>
                </Paper>
              )}
            </>
          )}

          {selectedOrderByTable?.state === "pending_payment" && confirmedPayments.flatMap(cp => cp.productIds).length === confirmedProducts.length && (
            <Button fullWidth variant="contained" sx={{ mt: 3, backgroundColor: "#7e9d8a", "&:hover": { backgroundColor: "#f9b32d", color: "black" } }} onClick={handlePayOrder}>
              <Payment sx={{ mr: 1 }} />
              Confirmar Orden Pagada
            </Button>
          )}
        </Box>
      ) : (
        <div className="flex justify-center text-red-500 font-bold my-16">
          Para poder cobrar la orden, debe primero imprimir el ticket en paso anterior.
        </div>
      )}
    </Box>
  );
};

export default PayOrder;
