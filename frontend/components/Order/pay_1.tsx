import { orderToClosed } from "@/api/order";
import { editTable } from "@/api/tables";
import { useAuth } from "@/app/context/authContext";
import { useRoomContext } from "@/app/context/room.context";
import { Payment, TableBar } from "@mui/icons-material";
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
  Paper,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from "@mui/material";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useOrderContext } from "../../app/context/order.context";
import { useTableStore } from "../Table/useTableStore";
import { useOrderStore } from "./useOrderStore";
import { UserRole } from "../Enums/user";
import { ITable } from "../Interfaces/ITable";
import { TableState } from "../Enums/table";
import { paymentMethod } from "../Enums/dailyCash";
import { Box } from "@mui/system";
import Grid from '@mui/material/Grid';
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { capitalizeFirstLetter } from "../Utils/CapitalizeFirstLetter";


export interface PayOrderProps {
  handleComplete: () => void;
}

const PayOrder: React.FC<PayOrderProps> = ({ handleComplete }) => {
  const { selectedOrderByTable, setSelectedOrderByTable, confirmedProducts, fetchOrderBySelectedTable } = useOrderContext();
  const { selectedTable, setSelectedTable } = useRoomContext();
  const { updateTable } = useTableStore();
  const { updateOrder } = useOrderStore();
  const { getAccessToken } = useAuth();
  const token = getAccessToken();

  const [draftPayment, setDraftPayment] = useState<{ productIds: string[], method: paymentMethod | '', tipType: 'none' | '10' | 'custom', customTip: number }>({ productIds: [], method: '', tipType: 'none', customTip: 0 });
  const [confirmedPayments, setConfirmedPayments] = useState<{ productIds: string[], methodOfPayment: paymentMethod, amount: number }[]>([]);



  const total = selectedOrderByTable?.total || 0;
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


  useEffect(() => {
    // Limpiar mini órdenes y draft al cambiar de mesa
    setConfirmedPayments([]);
    setDraftPayment({ productIds: [], method: '', tipType: 'none', customTip: 0 });
  }, [selectedOrderByTable?.id]);


  //  * 
  //  * @param compositeId - El ID compuesto del producto que se desea seleccionar
  //  * @returns La función `toggleProductSelection` agrega o elimina un ID 
  //  * de producto de la lista de IDs seleccionados en el estado `draftPayment`.
  //  * Si el ID ya estaba en la lista, se elimina; de lo contrario, se agrega.
  //  * 

  const toggleProductSelection = (compositeId: string) => {
    setDraftPayment(prev => ({
      ...prev,
      productIds: prev.productIds.includes(compositeId)
        ? prev.productIds.filter(id => id !== compositeId)
        : [...prev.productIds, compositeId]
    }));
  };


  const toggleAllProducts = () => {
    const unpaidProducts = confirmedProducts.flatMap((p) => {
      const quantity = p.quantity || 1;
      return Array.from({ length: quantity }, (_, index) => {
        const compositeId = `${p.productId}-${index}`;
        const isAlreadyPaid = confirmedPayments.some(cp => cp.productIds.includes(compositeId));
        return isAlreadyPaid ? null : compositeId;
      }).filter(Boolean) as string[];
    });

    const allSelected = unpaidProducts.every(id => draftPayment.productIds.includes(id));

    setDraftPayment(prev => ({
      ...prev,
      productIds: allSelected ? [] : unpaidProducts
    }));


  };


  const handleAddDraftAsConfirmed = () => {
    const { productIds, method, tipType, customTip } = draftPayment;
    if (!productIds.length || !method) {
      Swal.fire("Selecciona productos y método de pago", "", "warning");
      return;
    }

    // Contar unidades por producto, extrayendo bien el baseId
    const unitMap: Record<string, number> = {};
    productIds.forEach(id => {
      const idx = id.lastIndexOf("-");
      const baseId = id.slice(0, idx);
      unitMap[baseId] = (unitMap[baseId] || 0) + 1;
    });

    // Calcular baseAmount
    let baseAmount = 0;
    productIds.forEach(id => {
      const idx = id.lastIndexOf("-");
      const baseId = id.slice(0, idx);
      const product = confirmedProducts.find(p => p.productId === baseId);
      if (product) baseAmount += product.unitaryPrice || 0;
    });

    // Aplicar propina
    let finalAmount = baseAmount;
    if (tipType === "10") finalAmount = baseAmount * 1.1;
    else if (tipType === "custom") finalAmount = baseAmount + customTip;

    // Verificar duplicados
    const alreadyUsed = confirmedPayments.flatMap(p => p.productIds);
    if (productIds.some(id => alreadyUsed.includes(id))) {
      Swal.fire("Producto ya asignado a otro pago", "", "error");
      return;
    }

    // Agregar mini orden
    setConfirmedPayments(prev => [
      ...prev,
      { productIds, methodOfPayment: method, amount: finalAmount }
    ]);

    // Resetear draft
    setDraftPayment({ productIds: [], method: "", tipType: "none", customTip: 0 });

    console.log("✔️ Pago parcial agregado:", { productIds, amount: finalAmount, method });
  };


  const handlePayOrder = async () => {
    if (!token || !selectedOrderByTable || !selectedTable) return;

    // Validar que todo esté pagado (ya lo tenés bien)
    const allUnitIds = confirmedProducts.flatMap(p =>
      Array.from({ length: p.quantity || 1 }, (_, i) => `${p.productId}-${i}`)
    );
    const paidUnitIds = confirmedPayments.flatMap(p => p.productIds);
    if (allUnitIds.some(id => !paidUnitIds.includes(id))) {
      Swal.fire("Faltan productos por pagar", "", "warning");
      return;
    }

    // Preparar payments
    const payments = confirmedPayments.map(p => ({
      amount: p.amount,
      methodOfPayment: p.methodOfPayment
    }));

    // **Calcular el total a enviar** (suma de todos los amounts)
    const totalToSend = payments.reduce((sum, x) => sum + x.amount, 0);


    try {
      const paidOrder = await orderToClosed(
        selectedOrderByTable.id,
        token,
        payments
      );

      if (paidOrder) {
        Swal.fire("Orden cerrada con exito", "", "success");
      }

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

    } catch (error: any) {
      console.error(error);

      if (error.statusCode === 409) {
        Swal.fire("No se pudo cerrar la orden", "No hay una caja del dia abierta", "warning");
      } else {
        Swal.fire("Error", error.message || "No se pudo cerrar la mesa.", "error");
      }
    }
  };

  const allUnitIds = confirmedProducts.flatMap((p) => {
    const quantity = p.quantity || 1;
    return Array.from({ length: quantity }, (_, index) => `${p.productId}-${index}`);
  });

  const paidUnitIds = confirmedPayments.flatMap(p => p.productIds);

  const isAllPaid = allUnitIds.every(id => paidUnitIds.includes(id));


  // Agrupar cuántas unidades de cada producto se seleccionaron
  const unitCountMap: Record<string, number> = {};
  draftPayment.productIds.forEach((unitId) => {
    const [baseId] = unitId.split("-");
    unitCountMap[baseId] = (unitCountMap[baseId] || 0) + 1;
  });

  // Calcular baseAmount sumando el precio unitario por la cantidad seleccionada
  const baseAmount = confirmedProducts.reduce((acc, p) => {
    const count = draftPayment.productIds.filter(id => id.startsWith(p.productId)).length;
    return acc + count * (p.unitaryPrice || 0);
  }, 0);

  const total10 = (baseAmount * 1.1).toFixed(2);
  const totalCustom = (baseAmount + Number(draftPayment.customTip)).toFixed(2);


  const unpaidProducts = confirmedProducts.flatMap((p) => {
    const quantity = p.quantity || 1;
    return Array.from({ length: quantity }, (_, index) => {
      const compositeId = `${p.productId}-${index}`;
      const isAlreadyPaid = confirmedPayments.some(cp => cp.productIds.includes(compositeId));
      return isAlreadyPaid ? null : compositeId;
    }).filter(Boolean) as string[];
  });

  const allSelected = unpaidProducts.every(id => draftPayment.productIds.includes(id));

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

      <Box mt={2} mb={2}>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Typography fontWeight="bold">Total:</Typography>
            <Typography>${total.toFixed(2)}</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography fontWeight="bold">Productos:</Typography>
            <Typography>
              {confirmedProducts.reduce((acc, p) => acc + (p.quantity || 1), 0)}
            </Typography>

          </Grid>
          <Grid item xs={4}>
            <Typography fontWeight="bold">Estado:</Typography>
            <Typography color={orderStyles[selectedOrderByTable?.state as keyof typeof orderStyles]}>
              {orderStates[selectedOrderByTable?.state as keyof typeof orderStates]}
            </Typography>
          </Grid>
        </Grid>
      </Box>

      <Divider />

      <Box mt={2} display="flex" flexDirection="row">
        {/* Paso 1: Selección de productos */}
        <Box display="flex" flexDirection="column" width="50%">
          <Typography mt={3} fontWeight="bold">
            1. Seleccionar productos:
          </Typography>
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={allSelected}
                  onChange={toggleAllProducts}
                />
              }
              label="Todos los productos."
              sx={{ mt: 1 }}
            />
            <Box
              display="grid"
              gridTemplateColumns="20px 3fr 1fr"
              alignItems="center"
              overflow="auto"
              maxHeight="200px"
              sx={{
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: '#f0e6dc',
                  borderRadius: '8px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#7e9d8a',
                  borderRadius: '8px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  backgroundColor: '#5d786a',
                },
              }}
            >
              {confirmedProducts.map((p) => {
                const isPaid = (index: number) =>
                  confirmedPayments.some((cp) => cp.productIds.includes(`${p.productId}-${index}`));

                return Array.from({ length: p.quantity || 1 }, (_, index) => {
                  const compositeId = `${p.productId}-${index}`;
                  const isDisabled = isPaid(index);
                  const isChecked = draftPayment.productIds.includes(compositeId);

                  return (
                    <>

                      <Checkbox
                        checked={isChecked}
                        onChange={() => toggleProductSelection(compositeId)}
                        disabled={isDisabled}
                      />
                      <Typography sx={{ ml: 1.5 }} color={isDisabled ? "text.disabled" : "text.primary"}>
                        {capitalizeFirstLetter(p.productName)}
                      </Typography>
                      <Typography sx={{ display: "flex", justifyContent: "flex-end", mr: 1 }} color={isDisabled ? "text.disabled" : "text.primary"}>
                        ${p.unitaryPrice}
                      </Typography>
                    </>
                  );
                });
              })}
            </Box>
          </Box>

        </Box>
        <Divider orientation="vertical" flexItem sx={{ mr: 2 }} />
        {/* Paso 2: Tipo de total */}
        <Box width="50%" mt={3}>
          <Typography fontWeight="bold">2. Seleccionar tipo de total:</Typography>
          <Box
            display="grid"
            gridTemplateColumns="30px 3fr 1fr"
            alignItems="center"
            mt={1}
          >
            <Radio
              checked={draftPayment.tipType === "none"}
              onChange={() => setDraftPayment({ ...draftPayment, tipType: "none" })}
              value="none"
            />
            <Typography>Total sin propina</Typography>
            <Typography>${baseAmount.toFixed(2)}</Typography>

            <Radio
              checked={draftPayment.tipType === "10"}
              onChange={() => setDraftPayment({ ...draftPayment, tipType: "10" })}
              value="10"
            />
            <Typography>Total + 10% propina</Typography>
            <Typography>${total10}</Typography>

            <Radio
              checked={draftPayment.tipType === "custom"}
              onChange={() => setDraftPayment({ ...draftPayment, tipType: "custom" })}
              value="custom"
            />
            <Typography>Total + propina personalizada</Typography>
            <Typography>${totalCustom}</Typography>
          </Box>

          {draftPayment.tipType === "custom" && (
            <TextField
              type="number"
              inputProps={{ min: 0 }}
              value={draftPayment.customTip}
              onChange={(e) =>
                setDraftPayment({ ...draftPayment, customTip: Number(e.target.value) })
              }
              fullWidth
              placeholder="Ingresá monto de propina"
              sx={{ mt: 2 }}
            />
          )}
        </Box>


      </Box>

      <Divider sx={{ mt: 3 }} />


      <Box mt={3}>
        {/* Paso 3: Método de pago */}
        <Typography mt={3} fontWeight="bold">
          3. Seleccionar el método de pago:
        </Typography>

        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id="method-label">Método de Pago</InputLabel>
          <Select
            labelId="method-label"
            value={draftPayment.method}
            label="Método de Pago"
            onChange={(e) =>
              setDraftPayment({ ...draftPayment, method: e.target.value as paymentMethod })
            }
          >
            <MenuItem value={paymentMethod.CASH}>Efectivo</MenuItem>
            <MenuItem value={paymentMethod.CREDIT_CARD}>Tarjeta de Crédito</MenuItem>
            <MenuItem value={paymentMethod.DEBIT_CARD}>Tarjeta de Débito</MenuItem>
            <MenuItem value={paymentMethod.TRANSFER}>Transferencia</MenuItem>
            <MenuItem value={paymentMethod.MERCADOPAGO}>MercadoPago</MenuItem>
          </Select>
        </FormControl>

        <Button variant="outlined"
          color="success"
          fullWidth sx={{ mt: 2 }}
          onClick={handleAddDraftAsConfirmed}
          disabled={(draftPayment.productIds.length === 0) || (draftPayment.method === "")}        >
          Confirmar pago parcial
        </Button>
      </Box>


      {/* Pagos confirmados */}
      <Typography mt={4} fontWeight="bold">
        Pagos confirmados:
      </Typography>
      <Grid container spacing={2} mt={2}>
        {confirmedPayments.map((pay, index) => {
          // Contar cantidades por ID
          const quantities: Record<string, number> = {};
          pay.productIds.forEach((id) => {
            quantities[id] = (quantities[id] || 0) + 1;
          });

          // Filtrar productos únicos de esta orden parcial
          const products = confirmedProducts.filter((p) =>
            pay.productIds.some(id => id.startsWith(p.productId))
          );

          return (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper key={index} elevation={3} sx={{ p: 2 }}>
                <Typography fontWeight="bold">Orden Parcial #{index + 1}</Typography>
                <List dense>
                  {products.map((p) => {
                    // Encontrar cuántas veces aparece este producto en los IDs
                    const count = Object.entries(quantities).filter(([id]) =>
                      id.startsWith(p.productId)
                    ).reduce((acc, [_, qty]) => acc + qty, 0);

                    return (
                      <ListItem key={p.productId} disableGutters>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <FiberManualRecordIcon fontSize="small" sx={{ color: "#7e9d8a" }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${count} x ${capitalizeFirstLetter(p?.productName || '')} - $${p?.unitaryPrice}`}
                        />
                      </ListItem>
                    );
                  })}
                </List>

                <Typography>Total: ${pay.amount.toFixed(2)}</Typography>
                <Typography>Método: {capitalizeFirstLetter(pay.methodOfPayment)}</Typography>
              </Paper>
            </Grid>
          );
        })}

      </Grid>




      {/* Confirmar orden pagada */}
      {selectedOrderByTable?.state === "pending_payment" && isAllPaid && (
        <Button
          fullWidth
          variant="contained"
          sx={{
            mt: 3,
            backgroundColor: "#7e9d8a",
            "&:hover": {
              backgroundColor: "#f9b32d",
              color: "black",
            },
          }}
          onClick={handlePayOrder}
        >
          <Payment sx={{ mr: 1 }} />
          Confirmar Orden Pagada
        </Button>
      )}


    </Box>

  );
};

export default PayOrder;
