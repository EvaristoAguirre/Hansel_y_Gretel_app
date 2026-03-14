import { orderToClosed } from "@/api/order";
import { editTable } from "@/api/tables";
import { useAuth } from "@/app/context/authContext";
import { useRoomContext } from "@/app/context/room.context";
import { AddCircleOutline, Close, Payment } from "@mui/icons-material";
import {
  Button,
  FormControl,
  IconButton,
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
  Tooltip,
} from "@mui/material";
import InputAdornment from "@mui/material/InputAdornment";
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
  method: paymentMethod | "";
  tipType: "none" | "10" | "custom";
  customTip: number;
}

interface ConfirmedPayment {
  productIds: string[];
  methodOfPayment: paymentMethod;
  amount: number;
}

interface FullSplit {
  id: string;
  method: paymentMethod | "";
  amount: string;
}

interface TipInputsProps {
  baseAmount: number;
  customTip: number;
  onChangeCustomTip: (next: number) => void;
}

const TipInputs: React.FC<TipInputsProps> = ({
  baseAmount,
  customTip,
  onChangeCustomTip,
}) => {
  const computedTotal = baseAmount + (customTip || 0);
  const [propinaInput, setPropinaInput] = useState<string>(
    formatNumber(customTip || 0)
  );
  const [totalInput, setTotalInput] = useState<string>(
    formatNumber(computedTotal)
  );

  useEffect(() => {
    setTotalInput(formatNumber(baseAmount + (customTip || 0)));
    setPropinaInput(formatNumber(customTip || 0));
  }, [baseAmount, customTip]);

  return (
    <Box
      sx={{
        mt: 1,
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        gap: 1,
      }}
    >
      <TextField
        type="text"
        label="Propina"
        placeholder="Ingresá el monto de propina"
        value={propinaInput}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          setPropinaInput(digits);
          const nextTip = parseInt(digits || "0", 10);
          const safeTip = isNaN(nextTip) ? 0 : Math.max(0, nextTip);
          onChangeCustomTip(safeTip);
        }}
        onBlur={() => setPropinaInput(formatNumber(customTip || 0))}
        fullWidth
        inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
        InputProps={{
          startAdornment: <InputAdornment position="start">$</InputAdornment>,
        }}
        helperText={`$ ${formatNumber(customTip || 0)}`}
      />
      <TextField
        type="text"
        label="Total (consumo + propina)"
        placeholder="Ingresá el total a pagar"
        value={totalInput}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          setTotalInput(digits);
          const nextTotal = parseInt(digits || "0", 10);
          const safeTotal = isNaN(nextTotal) ? 0 : Math.max(0, nextTotal);
          const computedTip = Math.max(0, safeTotal - baseAmount);
          onChangeCustomTip(computedTip);
        }}
        onBlur={() =>
          setTotalInput(formatNumber(baseAmount + (customTip || 0)))
        }
        fullWidth
        inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
        InputProps={{
          startAdornment: <InputAdornment position="start">$</InputAdornment>,
        }}
        helperText={`$ ${formatNumber(baseAmount + (customTip || 0))}`}
      />
    </Box>
  );
};

export interface PayOrderProps {
  handleComplete: () => void;
}

const PayOrder: React.FC<PayOrderProps> = ({ handleComplete }) => {
  const {
    selectedOrderByTable,
    setSelectedOrderByTable,
    confirmedProducts,
    setConfirmedProducts,
    clearSelectedProducts,
  } = useOrderContext();
  const { selectedTable, setSelectedTable } = useRoomContext();
  const { updateTable } = useTableStore();
  const { updateOrder } = useOrderStore();
  const { getAccessToken } = useAuth();
  const token = getAccessToken();

  // ─── Estado modo parcial ───────────────────────────────────────────────────
  const [fullPaymentMode, setFullPaymentMode] = useState(false);
  const [draftPayment, setDraftPayment] = useState<DraftPayment>({
    productIds: [],
    method: "",
    tipType: "none",
    customTip: 0,
  });
  const [confirmedPayments, setConfirmedPayments] = useState<
    ConfirmedPayment[]
  >([]);

  // ─── Estado modo total (multi-método) ─────────────────────────────────────
  const [fullTipType, setFullTipType] = useState<"none" | "10" | "custom">(
    "none"
  );
  const [fullCustomTip, setFullCustomTip] = useState(0);
  const [fullSplits, setFullSplits] = useState<FullSplit[]>([
    { id: "split-0", method: "", amount: "" },
  ]);

  useEffect(() => {
    setFullPaymentMode(false);
    setDraftPayment({
      productIds: [],
      method: "",
      tipType: "none",
      customTip: 0,
    });
    setConfirmedPayments([]);
    setFullTipType("none");
    setFullCustomTip(0);
    setFullSplits([{ id: "split-0", method: "", amount: "" }]);
  }, [selectedOrderByTable?.id]);

  const unpaidIds = confirmedProducts
    .map((p) => p.internalId!)
    .filter(
      (id) => !confirmedPayments.some((cp) => cp.productIds.includes(id))
    );

  const handleFullToggle = () => {
    setFullPaymentMode((prev) => {
      const next = !prev;
      if (next) {
        setDraftPayment((prevDp) => ({ ...prevDp, productIds: unpaidIds }));
        setConfirmedPayments([]);
        setFullTipType("none");
        setFullCustomTip(0);
        setFullSplits([{ id: `split-${Date.now()}`, method: "", amount: "" }]);
      } else {
        setDraftPayment((prevDp) => ({ ...prevDp, productIds: [] }));
      }
      return next;
    });
  };

  const toggleProductSelection = (id: string) => {
    setDraftPayment((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(id)
        ? prev.productIds.filter((pid) => pid !== id)
        : [...prev.productIds, id],
    }));
  };

  // ─── Gestión de filas de splits (modo total) ───────────────────────────────
  const addFullSplit = () => {
    setFullSplits((prev) => [
      ...prev,
      { id: `split-${Date.now()}`, method: "", amount: "" },
    ]);
  };

  const removeFullSplit = (id: string) => {
    setFullSplits((prev) => prev.filter((s) => s.id !== id));
  };

  const updateFullSplit = (
    id: string,
    field: "method" | "amount",
    value: string
  ) => {
    setFullSplits((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleAddDraftAsConfirmed = () => {
    const { productIds, method, tipType, customTip } = draftPayment;
    if (!productIds.length || !method) {
      Swal.fire("Selecciona productos y método de pago", "", "warning");
      return;
    }
    const used = confirmedPayments.flatMap((cp) => cp.productIds);
    if (productIds.some((id) => used.includes(id))) {
      Swal.fire("Producto ya asignado a otro pago", "", "error");
      return;
    }
    const base = productIds.reduce(
      (sum, id) =>
        sum +
        Number(
          confirmedProducts.find((p) => p.internalId === id)?.unitaryPrice ?? 0
        ),
      0
    );
    const amount =
      tipType === "10"
        ? base * 1.1
        : tipType === "custom"
        ? base + customTip
        : base;
    setConfirmedPayments((prev) => [
      ...prev,
      { productIds, methodOfPayment: method, amount },
    ]);
    setDraftPayment({
      productIds: [],
      method: "",
      tipType: "none",
      customTip: 0,
    });
  };

  // ─── Cálculos modo total ────────────────────────────────────────────────────
  const fullBaseAmount = confirmedProducts.reduce(
    (sum, p) => sum + Number(p.unitaryPrice ?? 0),
    0
  );
  const fullTotalWithTip =
    fullTipType === "10"
      ? Math.round(fullBaseAmount * 1.1)
      : fullTipType === "custom"
      ? fullBaseAmount + fullCustomTip
      : fullBaseAmount;
  const fullPaid = fullSplits.reduce(
    (sum, s) => sum + (parseInt(s.amount.replace(/\D/g, ""), 10) || 0),
    0
  );
  const fullRemaining = Math.round(fullTotalWithTip) - Math.round(fullPaid);
  const fullSplitsValid =
    fullSplits.length > 0 &&
    fullSplits.every(
      (s) => s.method && parseInt(s.amount.replace(/\D/g, ""), 10) > 0
    );

  // ─── Cálculos modo parcial ─────────────────────────────────────────────────
  const baseAmount = draftPayment.productIds.reduce(
    (sum, id) =>
      sum +
      Number(
        confirmedProducts.find((p) => p.internalId === id)?.unitaryPrice ?? 0
      ),
    0
  );
  const total10 = (baseAmount * 1.1).toFixed(2);
  const totalCustom = (baseAmount + draftPayment.customTip).toFixed(2);

  const handlePayOrder = async () => {
    if (!token || !selectedOrderByTable || !selectedTable) return;

    if (fullPaymentMode) {
      if (!fullSplitsValid) {
        Swal.fire(
          "Completá todos los métodos y montos de pago",
          "",
          "warning"
        );
        return;
      }
      if (fullRemaining !== 0) {
        Swal.fire(
          "Los montos no coinciden con el total",
          `Diferencia: $${formatNumber(Math.abs(fullRemaining))} ${
            fullRemaining > 0 ? "faltante" : "de más"
          }`,
          "warning"
        );
        return;
      }
      try {
        const payments = fullSplits.map((s) => ({
          amount: parseInt(s.amount.replace(/\D/g, ""), 10),
          methodOfPayment: s.method as paymentMethod,
        }));
        const paidOrder = await orderToClosed(
          selectedOrderByTable.id,
          token,
          payments
        );
        if (paidOrder) Swal.fire("Orden cerrada con éxito", "", "success");
        setConfirmedProducts([]);
        clearSelectedProducts();
        const closedTable = await editTable(
          { ...selectedTable, state: TableState.CLOSED },
          token
        );
        if (paidOrder) {
          setSelectedOrderByTable(paidOrder);
          updateOrder(paidOrder);
        }
        if (closedTable) {
          setSelectedTable(closedTable);
          updateTable(closedTable);
        }
        handleComplete();
      } catch (e: any) {
        console.error(e);
        Swal.fire(
          e.statusCode === 409 ? "No hay caja abierta" : "Error",
          e.message || "No se pudo cerrar.",
          "error"
        );
      }
      return;
    }

    // ─── Modo parcial ──────────────────────────────────────────────────────
    const allIds = confirmedProducts.map((p) => p.internalId!);
    const paidIds = confirmedPayments.flatMap((cp) => cp.productIds);
    if (allIds.some((id) => !paidIds.includes(id))) {
      Swal.fire("Faltan productos por pagar", "", "warning");
      return;
    }
    try {
      const payments = confirmedPayments.map((cp) => ({
        amount: cp.amount,
        methodOfPayment: cp.methodOfPayment,
      }));
      const paidOrder = await orderToClosed(
        selectedOrderByTable.id,
        token,
        payments
      );
      if (paidOrder) Swal.fire("Orden cerrada con éxito", "", "success");

      setConfirmedProducts([]);
      clearSelectedProducts();

      const closedTable = await editTable(
        { ...selectedTable, state: TableState.CLOSED },
        token
      );
      if (paidOrder) {
        setSelectedOrderByTable(paidOrder);
        updateOrder(paidOrder);
      }
      if (closedTable) {
        setSelectedTable(closedTable);
        updateTable(closedTable);
      }
      handleComplete();
    } catch (e: any) {
      console.error(e);
      Swal.fire(
        e.statusCode === 409 ? "No hay caja abierta" : "Error",
        e.message || "No se pudo cerrar.",
        "error"
      );
    }
  };

  const orderStates = {
    pending_payment: "PENDIENTE DE PAGO",
    open: "ORDEN ABIERTA",
    cancelled: "ORDEN CANCELADA",
    closed: "ORDEN PAGADA/CERRADA",
  };
  const orderStyles = {
    pending_payment: "text-red-500",
    open: "text-orange-500",
    cancelled: "text-gray-500",
    closed: "text-green-500",
  };
  const total = selectedOrderByTable?.total || 0;

  const canConfirmPartial =
    selectedOrderByTable?.state === OrderState.PENDING_PAYMENT &&
    confirmedPayments.flatMap((cp) => cp.productIds).length ===
      confirmedProducts.length;

  const canConfirmFull =
    selectedOrderByTable?.state === OrderState.PENDING_PAYMENT &&
    fullSplitsValid &&
    fullRemaining === 0;

  return (
    <Box
      width="100%"
      p={2}
      mt={2}
      border="1px solid #d4c0b3"
      boxShadow={3}
      borderRadius={2}
    >
      <Typography
        variant="h6"
        sx={{
          backgroundColor: "#7e9d8a",
          color: "white",
          p: 1,
          textAlign: "center",
          borderRadius: 1,
          mb: 2,
        }}
      >
        ESTADO DE LA ORDEN
      </Typography>

      <Grid container spacing={2} mb={2}>
        <Grid item xs={4}>
          <Typography fontWeight="bold">Total:</Typography>
          <Typography>${formatNumber(total)}</Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography fontWeight="bold">Unidades:</Typography>
          <Typography>{confirmedProducts.length}</Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography fontWeight="bold">Estado:</Typography>
          <Typography
            className={
              orderStyles[
                selectedOrderByTable?.state as keyof typeof orderStyles
              ]
            }
          >
            {
              orderStates[
                selectedOrderByTable?.state as keyof typeof orderStates
              ]
            }
          </Typography>
        </Grid>
      </Grid>

      <Divider />

      {selectedOrderByTable?.state === OrderState.PENDING_PAYMENT ? (
        <Box>
          <FormControlLabel
            control={
              <Tooltip
                title={
                  confirmedPayments.length > 0
                    ? "No puedes cambiar al pago total con pagos parciales confirmados"
                    : ""
                }
              >
                <span>
                  <Switch
                    checked={fullPaymentMode}
                    onChange={handleFullToggle}
                    disabled={confirmedPayments.length > 0}
                  />
                </span>
              </Tooltip>
            }
            label="PAGA EL TOTAL DE LA ORDEN"
            sx={{
              mt: 1,
              fontWeight: "bold",
              color: fullPaymentMode ? "red" : "black",
            }}
          />

          {/* ─── Modo Parcial ─────────────────────────────────────────────── */}
          {!fullPaymentMode && (
            <>
              <Box display="flex" width="100%" mt={2}>
                <Box flex={1} width="60%">
                  <Typography fontWeight="bold">
                    1. Seleccionar productos:
                  </Typography>
                  <Box
                    overflow="auto"
                    sx={{
                      maxHeight: 300,
                      "&::-webkit-scrollbar": {
                        width: 8,
                        backgroundColor: "#d9ccbc",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        backgroundColor: "#7e9d8a",
                        borderRadius: 4,
                      },
                      "&::-webkit-scrollbar-thumb:hover": {
                        backgroundColor: "#555",
                      },
                    }}
                  >
                    <List>
                      {confirmedProducts.map((p) => {
                        const checked = draftPayment.productIds.includes(
                          p.internalId!
                        );
                        const disabled = confirmedPayments
                          .flatMap((cp) => cp.productIds)
                          .includes(p.internalId!);
                        return (
                          <ListItem
                            key={p.internalId}
                            disableGutters
                            sx={{
                              py: 0,
                              color: disabled
                                ? "text.secondary"
                                : "text.primary",
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 32, mr: 1 }}>
                              <Checkbox
                                checked={checked}
                                disabled={disabled}
                                onChange={() =>
                                  toggleProductSelection(p.internalId!)
                                }
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={`${capitalizeFirstLetter(
                                p.productName
                              )} - $${formatNumber(
                                Number(p.unitaryPrice ?? 0)
                              )}`}
                              primaryTypographyProps={{
                                sx: {
                                  color: disabled
                                    ? "text.disabled"
                                    : "text.primary",
                                },
                              }}
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  </Box>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
                <Box flex={1} width="40%">
                  <Typography fontWeight="bold">2. Tipo de total:</Typography>
                  <Box
                    display="grid"
                    gridTemplateColumns="30px 3fr 1fr"
                    alignItems="center"
                    rowGap={1}
                    mt={1}
                  >
                    <Radio
                      checked={draftPayment.tipType === "none"}
                      onChange={() =>
                        setDraftPayment({ ...draftPayment, tipType: "none" })
                      }
                    />
                    <Typography>Total sin propina</Typography>
                    <Typography>${formatNumber(baseAmount)}</Typography>

                    <Radio
                      checked={draftPayment.tipType === "10"}
                      onChange={() =>
                        setDraftPayment({ ...draftPayment, tipType: "10" })
                      }
                    />
                    <Typography>Total + 10% propina</Typography>
                    <Typography>${formatNumber(Number(total10))}</Typography>

                    <Radio
                      checked={draftPayment.tipType === "custom"}
                      onChange={() =>
                        setDraftPayment({ ...draftPayment, tipType: "custom" })
                      }
                    />
                    <Typography>Total + propina personalizada</Typography>
                    <Typography>
                      ${formatNumber(Number(totalCustom))}
                    </Typography>
                  </Box>
                  {draftPayment.tipType === "custom" && (
                    <TipInputs
                      baseAmount={baseAmount}
                      customTip={draftPayment.customTip}
                      onChangeCustomTip={(v) =>
                        setDraftPayment({ ...draftPayment, customTip: v })
                      }
                    />
                  )}
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography fontWeight="bold">3. Método de pago:</Typography>
              <FormControl fullWidth sx={{ mt: 1 }}>
                <InputLabel>Método</InputLabel>
                <Select
                  value={draftPayment.method}
                  label="Método"
                  onChange={(e) =>
                    setDraftPayment({
                      ...draftPayment,
                      method: e.target.value as paymentMethod,
                    })
                  }
                >
                  {Object.values(paymentMethod).map((m) => (
                    <MenuItem key={m} value={m}>
                      {capitalizeFirstLetter(m)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                color="success"
                fullWidth
                sx={{ mt: 2 }}
                disabled={
                  !draftPayment.method || !draftPayment.productIds.length
                }
                onClick={handleAddDraftAsConfirmed}
              >
                Confirmar pago parcial
              </Button>
              {confirmedPayments.length > 0 && (
                <>
                  <Typography fontWeight="bold" mt={4}>
                    Pagos parciales:
                  </Typography>
                  <Grid container spacing={2} mt={1}>
                    {confirmedPayments.map((cp, i) => (
                      <Grid item xs={12} sm={6} key={i}>
                        <Paper sx={{ p: 2 }}>
                          <Typography fontWeight="bold">
                            Pago #{i + 1}
                          </Typography>
                          <Typography>
                            Total: ${formatNumber(cp.amount)}
                          </Typography>
                          <Typography>
                            Método: {capitalizeFirstLetter(cp.methodOfPayment)}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}
            </>
          )}

          {/* ─── Modo Total (multi-método) ────────────────────────────────── */}
          {fullPaymentMode && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography fontWeight="bold">Tipo de total:</Typography>
              <Box
                display="grid"
                gridTemplateColumns="30px 3fr 1fr"
                alignItems="center"
                rowGap={1}
                mt={1}
              >
                <Radio
                  checked={fullTipType === "none"}
                  onChange={() => setFullTipType("none")}
                />
                <Typography>Total sin propina</Typography>
                <Typography>${formatNumber(fullBaseAmount)}</Typography>

                <Radio
                  checked={fullTipType === "10"}
                  onChange={() => setFullTipType("10")}
                />
                <Typography>Total + 10% propina</Typography>
                <Typography>
                  ${formatNumber(Math.round(fullBaseAmount * 1.1))}
                </Typography>

                <Radio
                  checked={fullTipType === "custom"}
                  onChange={() => setFullTipType("custom")}
                />
                <Typography>Total + propina personalizada</Typography>
                <Typography>
                  ${formatNumber(fullBaseAmount + fullCustomTip)}
                </Typography>
              </Box>
              {fullTipType === "custom" && (
                <TipInputs
                  baseAmount={fullBaseAmount}
                  customTip={fullCustomTip}
                  onChangeCustomTip={setFullCustomTip}
                />
              )}

              <Divider sx={{ my: 2 }} />

              {/* Indicador de montos */}
              <Box
                display="grid"
                gridTemplateColumns="1fr 1fr 1fr"
                sx={{
                  mb: 2,
                  p: 1.5,
                  bgcolor: "#f5f0ea",
                  borderRadius: 1,
                  border: "1px solid #d4c0b3",
                }}
                gap={1}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total a pagar
                  </Typography>
                  <Typography fontWeight="bold">
                    ${formatNumber(fullTotalWithTip)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Ingresado
                  </Typography>
                  <Typography fontWeight="bold" color="success.main">
                    ${formatNumber(fullPaid)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Restante
                  </Typography>
                  <Typography
                    fontWeight="bold"
                    color={fullRemaining === 0 ? "success.main" : "error.main"}
                  >
                    ${formatNumber(fullRemaining)}
                  </Typography>
                </Box>
              </Box>

              {/* Filas de métodos de pago */}
              <Typography fontWeight="bold" mb={1}>
                Distribución del pago:
              </Typography>
              {fullSplits.map((split) => (
                <Box
                  key={split.id}
                  display="flex"
                  alignItems="center"
                  gap={1}
                  mb={1}
                >
                  <FormControl sx={{ flex: 1 }} size="small">
                    <InputLabel>Método</InputLabel>
                    <Select
                      value={split.method}
                      label="Método"
                      onChange={(e) =>
                        updateFullSplit(split.id, "method", e.target.value)
                      }
                    >
                      {Object.values(paymentMethod).map((m) => (
                        <MenuItem key={m} value={m}>
                          {capitalizeFirstLetter(m)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    sx={{ flex: 1 }}
                    size="small"
                    label="Monto"
                    value={split.amount}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      updateFullSplit(split.id, "amount", digits);
                    }}
                    onBlur={() => {
                      const parsed = parseInt(
                        split.amount.replace(/\D/g, ""),
                        10
                      );
                      if (!isNaN(parsed) && parsed > 0) {
                        updateFullSplit(
                          split.id,
                          "amount",
                          formatNumber(parsed)
                        );
                      }
                    }}
                    inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">$</InputAdornment>
                      ),
                    }}
                  />
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => removeFullSplit(split.id)}
                    disabled={fullSplits.length === 1}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
              ))}

              <Button
                variant="text"
                size="small"
                startIcon={<AddCircleOutline />}
                onClick={addFullSplit}
                sx={{ mt: 0.5, color: "#7e9d8a" }}
              >
                Agregar método de pago
              </Button>
            </>
          )}

          {/* ─── Botón confirmar ──────────────────────────────────────────── */}
          {((!fullPaymentMode && canConfirmPartial) ||
            (fullPaymentMode && canConfirmFull)) && (
            <Button
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                backgroundColor: "#7e9d8a",
                "&:hover": { backgroundColor: "#f9b32d", color: "black" },
              }}
              onClick={handlePayOrder}
            >
              <Payment sx={{ mr: 1 }} />
              Confirmar Orden Pagada
            </Button>
          )}
        </Box>
      ) : (
        <div className="flex justify-center text-red-500 font-bold my-16">
          Para poder cobrar la orden, debe primero imprimir el ticket en paso
          anterior.
        </div>
      )}
    </Box>
  );
};

export default PayOrder;
