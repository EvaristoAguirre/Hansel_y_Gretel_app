import { Print } from "@mui/icons-material";
import {
  Button,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useOrderContext } from "../../app/context/order.context";
import { orderToPending, orderToReprint } from "@/api/order";
import { SelectedProductsI } from "../Interfaces/IProducts";
import { useRoomContext } from "@/app/context/room.context";
import { editTable } from "@/api/tables";
import { OrderState, TableState } from "../Enums/order";
import { useOrderStore } from "./useOrderStore";
import { useTableStore } from "../Table/useTableStore";
import { useAuth } from "@/app/context/authContext";
import { ITable } from "../Interfaces/ITable";

export interface OrderProps {
  imprimirComanda: any;
  handleDeleteOrder: any;
  selectedTable: ITable;
  handleNextStep: () => void;
  handleCompleteStep: () => void;
  handleReset: () => void;
}

const Order: React.FC<OrderProps> = ({
  handleNextStep,
  handleCompleteStep,
  handleReset
}) => {
  const {
    selectedOrderByTable,
    setSelectedOrderByTable,
    confirmedProducts,
    setConfirmedProducts,
    handleCancelOrder,
  } = useOrderContext();
  const { selectedTable, setSelectedTable, setOrderSelectedTable } = useRoomContext();
  const { addOrder } = useOrderStore();
  const [total, setTotal] = useState(0);
  const { tables, updateTable } = useTableStore();
  const { getAccessToken } = useAuth();

  useEffect(() => {
    const calcularTotal = () => {
      if (confirmedProducts?.length > 0) {
        setTotal(
          confirmedProducts?.reduce((acc: number, item: SelectedProductsI) => {
            return acc + (item.unitaryPrice ?? 0) * item.quantity;
          }, 0)
        );
      }
    };
    calcularTotal();
  }, [confirmedProducts]);

  const handlePayOrder = async (selectedTable: ITable) => {
    const token = getAccessToken();
    if (!token) return;

    if (selectedOrderByTable) {
      const ordenPendingPay = await orderToPending(
        selectedOrderByTable.id,
        token
      );

      setSelectedOrderByTable(ordenPendingPay);
      setOrderSelectedTable(ordenPendingPay.id);
      addOrder(ordenPendingPay);
      // updateOrder(ordenPendingPay);
    }

    const tableEdited = await editTable(
      { ...selectedTable, state: TableState.PENDING_PAYMENT },
      token
    );
    if (tableEdited) {
      setSelectedTable({ ...selectedTable, state: tableEdited.state });
      updateTable(tableEdited);

    }
    handleCompleteStep();
    handleNextStep();
  };

  const handleReprintOrder = async (selectedTable: ITable) => {
    const token = getAccessToken();
    if (!token) return;

    if (selectedOrderByTable) {
      const ordenPendingPay = await orderToReprint(
        selectedOrderByTable.id,
        token
      );

      setSelectedOrderByTable(ordenPendingPay);
      setOrderSelectedTable(ordenPendingPay.id);
      addOrder(ordenPendingPay);
    }

    const tableEdited = await editTable(
      { ...selectedTable, state: TableState.PENDING_PAYMENT },
      token
    );
    if (tableEdited) {
      setSelectedTable({ ...selectedTable, state: tableEdited.state });
      updateTable(tableEdited);

    }
    handleCompleteStep();
    handleNextStep();
  };
  const cancelOrder = async (orderId: string) => {
    const token = getAccessToken();
    if (!token) return;
    const deletedOrder = await handleCancelOrder(orderId);
    setSelectedOrderByTable(null);
    setConfirmedProducts([]);
    handleReset();
  }

  const isPendingPayment = selectedOrderByTable?.state === OrderState.PENDING_PAYMENT;
  const isClosed = selectedOrderByTable?.state === OrderState.CLOSED;
  const shouldShowPrintButton = !isClosed && !isPendingPayment;

  const commonButtonStyles = {
    backgroundColor: "#7e9d8a",
    "&:hover": { backgroundColor: "#f9b32d", color: "black" },
  };

  return (
    <>
      {selectedTable &&
        (selectedTable.state === TableState.OPEN ||
          selectedTable.state === TableState.PENDING_PAYMENT) ? (
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            border: "1px solid #d4c0b3",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            padding: "1rem",
            justifyContent: "space-between",
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
                color: "black",
                margin: "1rem 0",
                width: "100%",
              }}
            >
              <h2>PEDIDO</h2>
            </div>
            <List
              className="custom-scrollbar"
              style={{
                maxHeight: "14rem",
                overflowY: "auto",
                padding: "0.5rem",
                border: "2px solid #7e9d8a",
                borderRadius: "5px",
                marginTop: "0.5rem",
              }}
            >
              {confirmedProducts?.map((item: any, index: number) => (
                <ListItem
                  key={index}
                  style={{
                    backgroundColor: "#eceae8",
                    margin: "0.3rem 0",
                    display: "flex",
                    alignItems: "center",
                    borderRadius: "5px",
                    height: "3rem",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    sx={{ border: "1px solid #856D5E", color: "#856D5E" }}
                    style={{
                      color: "black",
                      width: "2rem",
                      textAlign: "center",
                      borderRadius: "5px",
                    }}
                  >
                    {item.quantity}
                  </Typography>
                  <Tooltip title={item.productName} arrow>
                    <ListItemText
                      style={{
                        margin: "0 1rem 0 0.5rem",
                        fontSize: "1rem",
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 1,
                        overflow: "hidden",
                      }}
                      primary={item.productName}
                    />
                  </Tooltip>
                  <Typography
                    style={{
                      margin: "0 1rem 0 0.5rem",
                      fontSize: "1rem",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {`$ ${item.unitaryPrice * item.quantity}`}
                  </Typography>
                </ListItem>
              ))}
            </List>
            <Typography
              style={{
                width: "100%",
                padding: "0.5rem",
                textAlign: "left",
                fontWeight: "bold",
              }}
            >
              Total: ${total}
            </Typography>
            <Typography
              style={{
                width: "100%",
                padding: "0.5rem",
                textAlign: "left",
                fontWeight: "bold",
              }}
            >
              Cantidad de productos: {confirmedProducts?.length}
            </Typography>
          </div>
          <div>
            {isPendingPayment && (
              <Button
                fullWidth
                variant="contained"
                sx={commonButtonStyles}
                onClick={() => handleReprintOrder(selectedTable)}
              >
                <Print style={{ marginRight: "5px" }} /> Reimprimir ticket
              </Button>
            )}

            {shouldShowPrintButton && (
              <Button
                fullWidth
                variant="contained"
                sx={commonButtonStyles}
                onClick={() => handlePayOrder(selectedTable)}
              >
                <Print style={{ marginRight: "5px" }} /> Imprimir ticket
              </Button>
            )}

            {confirmedProducts?.length > 0 && (
              <Button
                fullWidth
                color="error"
                variant="outlined"
                style={{
                  marginTop: "1rem",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                }}
                onClick={() => cancelOrder(selectedOrderByTable?.id!)}
              >
                Anular Pedido
              </Button>
            )}
          </div>

        </div>
      ) : (
        <div className="flex justify-center text-red-500 font-bold my-16">
          COMPLETAR PASO 1
        </div>
      )}
    </>
  );
};

export default Order;
