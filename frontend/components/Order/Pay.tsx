import { orderToClosed } from "@/api/order";
import { editTable } from "@/api/tables";
import { useAuth } from "@/app/context/authContext";
import { useRoomContext } from "@/app/context/room.context";
import { Payment, TableBar } from "@mui/icons-material";
import { Button, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useOrderContext } from "../../app/context/order.context";
import { useTableStore } from "../Table/useTableStore";
import { useOrderStore } from "./useOrderStore";
import { UserRole } from "../Enums/user";
import { ITable } from "../Interfaces/ITable";
import { TableState } from "../Enums/table";
import { PaymentMethod } from "../Enums/dailyCash";

export interface PayOrderProps {
  handleComplete: () => void;
}

const PayOrder: React.FC<PayOrderProps> = ({ handleComplete }) => {
  const { selectedOrderByTable, setSelectedOrderByTable, confirmedProducts, fetchOrderBySelectedTable } =
    useOrderContext();
  const { selectedTable, setSelectedTable } = useRoomContext();
  const { updateTable } = useTableStore();
  const { updateOrder } = useOrderStore();
  const { getAccessToken, userRoleFromToken } = useAuth();

  const [method, setMethod] = useState<PaymentMethod | ''>('');


  const token = getAccessToken();


  const handleChangeMethod = (event: SelectChangeEvent<PaymentMethod>) => {
    setMethod(event.target.value as PaymentMethod);
  };


  const handlePayOrder = async () => {
    const token = getAccessToken();
    if (!token) return;

    if (!method) {
      Swal.fire("Selecciona un método de pago", "", "warning");
      return;
    }

    try {
      if (selectedOrderByTable && selectedTable) {
        const paidOrder = await orderToClosed(
          selectedOrderByTable,
          token,
          method
        );

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
        }

        updateTable(closedTable);
      }
    } catch (error: any) {
      if (error.statusCode === 409) {
        Swal.fire({
          icon: "info",
          title: "Caja no abierta",
          text: "Debes abrir una caja diaria antes de registrar un pago.",
        });
      } else {
        Swal.fire("Error", error.message || "Error al cerrar la orden", "error");
      }
    }
  };


  const handleTableAvailable = async (
    selectedTable: ITable,
    token: string
  ) => {
    const tableEdited = await editTable(
      { ...selectedTable, state: TableState.AVAILABLE },
      token
    );
    if (tableEdited) {
      setSelectedTable(tableEdited);
      updateTable(tableEdited);
      setSelectedOrderByTable(null);
      fetchOrderBySelectedTable();
    }
    handleComplete();
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


  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "1rem",
        border: "1px solid #d4c0b3",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        marginTop: "1rem",
      }}
    >
      <div>
        <div
          style={{
            height: "2rem",
            backgroundColor: "#7e9d8a",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
            margin: "1rem 0",
            width: "100%",
          }}
        >
          <h2>ESTADO DE LA ORDEN:</h2>
        </div>

        <Typography
          style={{
            width: "100%",
            padding: "0.5rem",
            textAlign: "left",
            fontWeight: "bold",
          }}
        >
          Total: ${selectedOrderByTable?.total}
        </Typography>
        <Typography
          style={{
            width: "100%",
            padding: "0.5rem",
            textAlign: "left",
            fontWeight: "bold",
          }}
        >
          Cantidad de productos: {confirmedProducts.length}
        </Typography>
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            padding: "0.5rem",
            textAlign: "left",
            fontWeight: "bold",
            gap: "0.5rem",
          }}
        >
          Pago:
          {selectedOrderByTable ? (
            <p
              className={
                orderStyles[
                selectedOrderByTable?.state as keyof typeof orderStates
                ]
              }
            >
              {orderStates[
                selectedOrderByTable?.state as keyof typeof orderStates
              ] || "MESA SIN ORDEN"}
            </p>
          ) : (
            selectedTable &&
            selectedTable.state === TableState.CLOSED && (
              <p className="text-red-500">MESA SIN ORDEN ABIERTA</p>
            )
          )}
        </div>
      </div>

      {
        (userRoleFromToken() === UserRole.ADMIN || userRoleFromToken() === UserRole.ENCARGADO) &&
        <div>
          <>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="payment-method-label">Método de Pago</InputLabel>
              <Select
                labelId="payment-method-label"
                value={method}
                label="Método de Pago"
                onChange={handleChangeMethod}
              >
                <MenuItem value={PaymentMethod.CASH}>Efectivo</MenuItem>
                <MenuItem value={PaymentMethod.CREDIT_CARD}>Tarjeta de Crédito</MenuItem>
                <MenuItem value={PaymentMethod.DEBIT_CARD}>Tarjeta de Débito</MenuItem>
                <MenuItem value={PaymentMethod.TRANSFER}>Transferencia</MenuItem>
                <MenuItem value={PaymentMethod.MERCADOPAGO}>MercadoPago</MenuItem>
              </Select>
            </FormControl>

            {selectedOrderByTable &&
              selectedOrderByTable.state === "pending_payment" && (
                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: 2,
                    backgroundColor: "#7e9d8a",
                    "&:hover": { backgroundColor: "#f9b32d", color: "black" },
                  }}
                  disabled={confirmedProducts.length === 0}
                  onClick={() => handlePayOrder()}
                >
                  <Payment style={{ marginRight: "5px" }} /> Cambiar a Orden
                  Pagada
                </Button>
              )}
            {(selectedTable && selectedTable.state === TableState.CLOSED) ||
              (selectedTable &&
                orderStates[
                selectedOrderByTable?.state as keyof typeof orderStates
                ] === "ORDEN PAGADA/CERRADA") ? (
              <Button
                fullWidth
                variant="outlined"
                sx={{
                  mt: 2,
                  borderColor: "#7e9d8a",
                  color: "black",
                  "&:hover": { backgroundColor: "#f9b32d", color: "black" },
                }}
                onClick={() => handleTableAvailable(selectedTable, token!)}
              >
                <TableBar style={{ marginRight: "5px" }} /> Pasar Mesa a:
                <span style={{ color: "green", marginLeft: "5px" }}>
                  {" "}
                  Disponible{" "}
                </span>
              </Button>
            ) : null}
          </>
        </div>
      }
    </div>
  );
};

export default PayOrder;
