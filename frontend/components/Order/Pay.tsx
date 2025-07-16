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
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { capitalizeFirstLetter } from "../Utils/CapitalizeFirstLetter";
import { OrderState } from "../Enums/order";

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

  const [draftPayment, setDraftPayment] = useState<DraftPayment>({
    productIds: [],
    method: '',
    tipType: 'none',
    customTip: 0
  });
  const [confirmedPayments, setConfirmedPayments] = useState<ConfirmedPayment[]>([]);


  useEffect(() => {
    setConfirmedPayments([]);
    setDraftPayment({ productIds: [], method: '', tipType: 'none', customTip: 0 });
  }, [selectedOrderByTable?.id]);


  const toggleProductSelection = (id: string) => {
    setDraftPayment(prev => ({
      ...prev,
      productIds: prev.productIds.includes(id)
        ? prev.productIds.filter(pid => pid !== id)
        : [...prev.productIds, id]
    }));
  };


  const unpaidIds = confirmedProducts
    .map(p => p.internalId!)  // all units
    .filter(id => !confirmedPayments.some(cp => cp.productIds.includes(id)));
  const allSelected = unpaidIds.every(id => draftPayment.productIds.includes(id));

  const toggleAllProducts = () => {
    const nextAll = !allSelected;
    setDraftPayment(prev => ({
      ...prev,
      productIds: nextAll ? unpaidIds : []
    }));
    // Si el usuario desactiva el switch, limpio pagos y restauro el draft
    if (!nextAll) {
      setConfirmedPayments([]);
      setDraftPayment(prev => ({
        ...prev,
        method: '',
        tipType: 'none',
        customTip: 0
      }));
    }
  };



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
    const base = productIds.reduce((sum, id) => {
      const p = confirmedProducts.find(x => x.internalId === id);
      return sum + (p?.unitaryPrice || 0);
    }, 0);
    const finalAmount =
      tipType === '10' ? base * 1.1 :
        tipType === 'custom' ? base + customTip : base;

    setConfirmedPayments(prev => [...prev, { productIds, methodOfPayment: method, amount: finalAmount }]);
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
    const payments = confirmedPayments.map(cp => ({ amount: cp.amount, methodOfPayment: cp.methodOfPayment }));
    try {
      const paidOrder = await orderToClosed(selectedOrderByTable.id, token, payments);
      if (paidOrder) Swal.fire("Orden cerrada con éxito", "", "success");
      const closedTable = await editTable({ ...selectedTable, state: TableState.CLOSED }, token);
      if (paidOrder) { setSelectedOrderByTable(paidOrder); updateOrder(paidOrder); }
      if (closedTable) { setSelectedTable(closedTable); updateTable(closedTable); }
      setConfirmedPayments([]);
      setDraftPayment({ productIds: [], method: '', tipType: 'none', customTip: 0 });
      handleComplete();
    } catch (e: any) {
      console.error(e);
      Swal.fire(e.statusCode === 409 ? "No hay caja abierta" : "Error", e.message || "No se pudo cerrar.", "error");
    }
  };

  // Totales
  const baseAmount = draftPayment.productIds.reduce((sum, id) => {
    const p = confirmedProducts.find(x => x.internalId === id);
    return sum + (p?.unitaryPrice || 0);
  }, 0);
  const total10 = (baseAmount * 1.1).toFixed(2);
  const totalCustom = (baseAmount + draftPayment.customTip).toFixed(2);

  const orderStates = { pending_payment: "PENDIENTE DE PAGO", open: "ORDEN ABIERTA", cancelled: "ORDEN CANCELADA", closed: "ORDEN PAGADA/CERRADA" };
  const orderStyles = { pending_payment: "text-red-500", open: "text-orange-500", cancelled: "text-gray-500", closed: "text-green-500" };

  const isAllPaid = confirmedProducts.every(p =>
    confirmedPayments.flatMap(cp => cp.productIds).includes(p.internalId!)
  );
  const total = selectedOrderByTable?.total || 0;

  // Auto-confirmar todos los productos si cumple condiciones
  useEffect(() => {
    const isFullPaymentReady =
      allSelected &&
      draftPayment.method &&
      draftPayment.tipType &&
      draftPayment.productIds.length === unpaidIds.length &&
      confirmedPayments.length === 0;

    if (isFullPaymentReady) {
      const base = draftPayment.productIds.reduce((sum, id) => {
        const p = confirmedProducts.find(x => x.internalId === id);
        return sum + (p?.unitaryPrice || 0);
      }, 0);
      const finalAmount =
        draftPayment.tipType === '10'
          ? base * 1.1
          : draftPayment.tipType === 'custom'
            ? base + draftPayment.customTip
            : base;

      // Evitar duplicar el mismo pago si ya existe
      const alreadyConfirmed = confirmedPayments.some(cp =>
        cp.productIds.length === unpaidIds.length &&
        cp.methodOfPayment === draftPayment.method
      );
      if (!alreadyConfirmed) {
        setConfirmedPayments([
          {
            productIds: [...draftPayment.productIds],
            methodOfPayment: draftPayment.method as paymentMethod,
            amount: finalAmount
          }
        ]);
      }
    }
  }, [allSelected, draftPayment, unpaidIds.length, confirmedPayments.length]);

  // Detecta si ya se generó el pago completo
  const isBulkPaid = allSelected && draftPayment.method !== '' && confirmedPayments.length > 0;


  return (
    <Box width="100%" p={2} mt={2} border="1px solid #d4c0b3" boxShadow={3} borderRadius={2}>
      {/* estado de la orden */}
      <Typography variant="h6" sx={{ backgroundColor: "#7e9d8a", color: "white", p: 1, textAlign: "center", borderRadius: 1, mb: 2 }}>ESTADO DE LA ORDEN</Typography>
      <Grid container spacing={2} mb={2}>
        <Grid item xs={4}><Typography fontWeight="bold">Total:</Typography><Typography>${total.toFixed(2)}</Typography></Grid>
        <Grid item xs={4}><Typography fontWeight="bold">Unidades:</Typography><Typography>{confirmedProducts.length}</Typography></Grid>
        <Grid item xs={4}><Typography fontWeight="bold">Estado:</Typography><Typography className={orderStyles[selectedOrderByTable?.state as keyof typeof orderStyles]}>{orderStates[selectedOrderByTable?.state as keyof typeof orderStates]}</Typography></Grid>
      </Grid>
      <Divider />

      {selectedOrderByTable?.state === OrderState.PENDING_PAYMENT ? (
        <Box>
          {/* check de productos */}
          <Box sx={{ display: "flex", direction: "row", rowGap: 3, width: "100%" }}>
            <Box display="flex" flexDirection="column" width="50%" >
              <Typography fontWeight="bold" mt={3}>1. Seleccionar productos:</Typography>
              <FormControlLabel
                control={
                  <Tooltip
                    title={
                      confirmedPayments.length > 0
                        ? "No puedes seleccionar todos los productos cuando hay pagos parciales"
                        : ""
                    }
                  >
                    {/* span necesario para que Tooltip funcione sobre el Switch deshabilitado */}
                    <span>
                      <Switch
                        checked={allSelected}
                        onChange={toggleAllProducts}
                        disabled={confirmedPayments.length > 0 && !allSelected}
                      />
                    </span>
                  </Tooltip>
                }
                label="Paga todos los productos"
                sx={{ mt: 1 }}
              />
              <List>
                {confirmedProducts.map(p => {
                  const checked = draftPayment.productIds.includes(p.internalId!);
                  const disabled = confirmedPayments.flatMap(cp => cp.productIds).includes(p.internalId!);
                  return (
                    <ListItem
                      key={p.internalId}
                      disableGutters
                      sx={{
                        py: 0,
                        // opcional: cambias también el color de todo el ListItem
                        color: disabled ? "text.secondary" : "text.primary"
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 32, mr: 1 }}>
                        <Checkbox
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleProductSelection(p.internalId!)}
                        />
                      </ListItemIcon>

                      <ListItemText
                        primary={`${capitalizeFirstLetter(p.productName)} - $${p.unitaryPrice}`}
                        primaryTypographyProps={{
                          sx: {
                            // aquí cambiamos el color del texto según el estado disabled
                            color: disabled ? "text.disabled" : "text.primary",
                          }
                        }}
                      />
                    </ListItem>

                  );
                })}
              </List>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mr: 2 }} />

            {/* Diferentes totales */}
            <Grid item xs={6} mt={3}>
              <Typography fontWeight="bold">2. Tipo de total:</Typography>

              <Box
                display="grid"
                gridTemplateColumns="30px 3fr 1fr"
                alignItems="center"
                rowGap={1}
                mt={1}
              >
                {/* Sin propina */}
                <Radio
                  checked={draftPayment.tipType === "none"}
                  onChange={() =>
                    setDraftPayment({ ...draftPayment, tipType: "none" })
                  }
                  value="none"
                />
                <Typography>Total sin propina</Typography>
                <Typography>${baseAmount.toFixed(2)}</Typography>

                {/* 10% propina */}
                <Radio
                  checked={draftPayment.tipType === "10"}
                  onChange={() =>
                    setDraftPayment({ ...draftPayment, tipType: "10" })
                  }
                  value="10"
                />
                <Typography>Total + 10% propina</Typography>
                <Typography>${total10}</Typography>

                {/* Propina personalizada */}
                <Radio
                  checked={draftPayment.tipType === "custom"}
                  onChange={() =>
                    setDraftPayment({ ...draftPayment, tipType: "custom" })
                  }
                  value="custom"
                />
                <Typography>Total + propina personalizada</Typography>
                <Typography>${totalCustom}</Typography>
              </Box>

              {draftPayment.tipType === "custom" && (
                <TextField
                  type="number"
                  placeholder="Propina"
                  value={draftPayment.customTip}
                  onChange={(e) =>
                    setDraftPayment({
                      ...draftPayment,
                      customTip: Number(e.target.value),
                    })
                  }
                  fullWidth
                  sx={{ mt: 1 }}
                />
              )}
            </Grid>

          </Box>
          <Divider sx={{ my: 2 }} />

          {/* Select del metodo de pago */}
          <Typography fontWeight="bold">3. Método de pago:</Typography>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Método</InputLabel>
            <Select value={draftPayment.method} label="Método" onChange={(e) => setDraftPayment({ ...draftPayment, method: e.target.value as paymentMethod })}>
              {Object.values(paymentMethod).map(m => <MenuItem key={m} value={m}>{capitalizeFirstLetter(m)}</MenuItem>)}
            </Select>
          </FormControl>
          {
            !isBulkPaid && (
              <Button
                variant="outlined"
                color="success"
                fullWidth
                sx={{ mt: 2 }}
                disabled={
                  !draftPayment.method ||
                  !draftPayment.productIds.length ||
                  (allSelected && confirmedPayments.length > 0)
                }
                onClick={handleAddDraftAsConfirmed}
              >
                Confirmar pago parcial
              </Button>
            )
          }

          {/* Pagos confirmados */}

          {
            !isBulkPaid && (
              <>
                <Typography fontWeight="bold" mt={4}>Pagos parciales:</Typography>
                <Grid container spacing={2} mt={1}>
                  {confirmedPayments.map((cp, i) => (
                    <Grid item xs={12} sm={6} key={i}>
                      <Paper sx={{ p: 2 }}>
                        <Typography fontWeight="bold">Pago #{i + 1}</Typography>
                        <Typography>Total: ${cp.amount.toFixed(2)}</Typography>
                        <Typography>Método: {capitalizeFirstLetter(cp.methodOfPayment)}</Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </>

            )
          }
        </Box>

      ) :
        <div className="flex justify-center text-red-500 font-bold my-16">
          Para poder cobrar la orden, debe primero imprimir el ticket en paso anterior.
        </div>
      }
      {selectedOrderByTable?.state === "pending_payment" && isAllPaid &&
        <Button
          fullWidth variant="contained"
          sx={{ mt: 3, backgroundColor: "#7e9d8a", "&:hover": { backgroundColor: "#f9b32d", color: "black" } }}
          onClick={handlePayOrder}>
          <Payment sx={{ mr: 1 }} />
          Confirmar Orden Pagada
        </Button>}
    </Box>
  );
};

export default PayOrder;
