import { orderToClosed } from "@/api/order";
import { editTable } from "@/api/tables";
import { useRoomContext } from "@/app/context/room.context";
import { Payment, TableBar } from "@mui/icons-material";
import { Button, Typography } from "@mui/material";
import { useState } from "react";
import Swal from "sweetalert2";
import { useOrderContext } from '../../app/context/order.context';
import { TableState } from "../Enums/Enums";
import { MesaInterface } from "../Interfaces/Cafe_interfaces";
import { useTableStore } from "../Table/useTableStore";
import { useOrderStore } from "./useOrderStore";

export interface PayOrderProps {
  handleComplete: () => void

}

const PayOrder: React.FC<PayOrderProps> = (
  { handleComplete }
) => {
  const { selectedOrderByTable, setSelectedOrderByTable, confirmedProducts } = useOrderContext();
  const [total, setTotal] = useState(0);
  const { selectedMesa, setSelectedMesa } = useRoomContext();
  const { updateTable } = useTableStore();
  const { updateOrder } = useOrderStore();


  const handlePayOrder = async () => {
    if (selectedOrderByTable && selectedMesa) {
      const paidOrder = await orderToClosed(selectedOrderByTable.id);
      const closedTable = await editTable(selectedMesa.id, { ...selectedMesa, state: TableState.CLOSED });
      if (paidOrder) {
        setSelectedOrderByTable(paidOrder);
        updateOrder(paidOrder);

      } else if (closedTable) {
        // setSelectedMesa(closedTable);
      }
      else {
        Swal.fire("Error", "No se pudo pagar la orden.", "error");
      }
      updateTable(closedTable);

    }
  };

  const handleTableAvailable = async (selectedMesa: MesaInterface) => {
    const tableEdited = await editTable(selectedMesa.id, { ...selectedMesa, state: TableState.AVAILABLE });
    if (tableEdited) {
      setSelectedMesa(tableEdited);
      updateTable(tableEdited);
    }
    handleComplete();
  }

  const orderStates = {
    "pending_payment": "PENDIENTE DE PAGO",
    "open": "ORDEN ABIERTA",
    "cancelled": "ORDEN CANCELADA",
    "closed": "ORDEN PAGADA",
  };
  const orderStyles = {
    "pending_payment": "text-red-500",
    "open": "text-orange-500",
    "cancelled": "text-gray-500",
    "closed": "text-green-500"
  };

  return (
    <div style={{
      width: "100%", display: "flex", flexDirection: "column", padding: "1rem",
      border: "1px solid #d4c0b3", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", marginTop: "1rem"
    }}>
      <div>
        <div
          style={{
            height: "2rem", backgroundColor: "#7e9d8a", display: "flex", justifyContent: "center",
            alignItems: "center", color: "white", margin: "1rem 0", width: "100%",
          }}
        >
          <h2>ESTADO DE LA ORDEN:</h2>

        </div>

        <Typography
          style={{
            width: "100%", padding: "0.5rem", textAlign: "left", fontWeight: "bold",
          }}
        >
          Total: ${selectedOrderByTable?.total}
        </Typography>
        <Typography
          style={{
            width: "100%", padding: "0.5rem", textAlign: "left", fontWeight: "bold",
          }}
        >
          Cantidad de productos: {confirmedProducts.length}
        </Typography>
        <div
          style={{
            width: "100%", display: "flex", flexDirection: "row", padding: "0.5rem",
            textAlign: "left", fontWeight: "bold", gap: "0.5rem"
          }}
        >
          Pago:
          {
            selectedOrderByTable ?
              <p className={orderStyles[selectedOrderByTable?.state as keyof typeof orderStates]}>
                {orderStates[selectedOrderByTable?.state as keyof typeof orderStates] || "MESA SIN ORDEN"}
              </p>
              :
              <p className="text-red-500">MESA SIN ORDEN ABIERTA</p>
          }
        </div>
      </div>

      <div>
        {
          <>
            {
              selectedOrderByTable && selectedOrderByTable.state === "pending_payment" &&
              <Button
                fullWidth
                variant="contained"
                sx={{
                  mt: 2, backgroundColor: "#7e9d8a", "&:hover": { backgroundColor: "#f9b32d", color: "black" },
                }}

                disabled={confirmedProducts.length === 0}
                onClick={() => handlePayOrder()}
              >
                <Payment style={{ marginRight: "5px" }} /> Cambiar a Orden Pagada
              </Button>
            }
            {
              selectedOrderByTable && selectedMesa && selectedOrderByTable.state === "closed" &&
              <Button
                fullWidth
                variant="outlined"
                sx={{
                  mt: 2, borderColor: "#7e9d8a", color: "black", "&:hover": { backgroundColor: "#f9b32d", color: "black" },
                }}

                disabled={confirmedProducts.length === 0}
                onClick={() => handleTableAvailable(selectedMesa)}
              >
                <TableBar style={{ marginRight: "5px" }} /> Pasar Mesa a:
                <span style={{ color: "green", marginLeft: "5px" }}> Disponible </span>
              </Button>
            }
          </>

        }
      </div>
    </div>
  );
};

export default PayOrder;
