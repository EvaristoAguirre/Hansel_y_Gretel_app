import { orderToClosed } from "@/api/order";
import { Payment } from "@mui/icons-material";
import { Button, Typography } from "@mui/material";
import { useState, useEffect } from "react";
import { useOrderContext } from '../../app/context/order.context';

export interface PayOrderProps {
  handleNextStep: () => void
}

const PayOrder: React.FC<PayOrderProps> = (
  { handleNextStep }
) => {
  const { selectedOrderByTable, setSelectedOrderByTable, confirmedProducts } = useOrderContext();
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const calcularTotal = () => {
      if (confirmedProducts.length > 0) {
        setTotal(
          confirmedProducts.reduce((acc: number, item: any) => {
            return acc + item.price * item.quantity;
          }, 0)
        );
      }
    };
    calcularTotal();
  }, [confirmedProducts]);



  const handleCloseOrder = async () => {

    if (selectedOrderByTable) {
      const ordenPendingPay = await orderToClosed(selectedOrderByTable.id);

      setSelectedOrderByTable(ordenPendingPay);
    }
    handleNextStep();
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
          Total: ${total}
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
          <p className={"text-red-500"}>
            {selectedOrderByTable?.state}
          </p>
        </div>
      </div>

      <div>
        {
          // selectedOrderByTable
          //   ? (
          //     <Box display="flex" justifyContent="center" alignItems="center">
          //       <CircularProgress />
          //       <Typography sx={{ marginLeft: "1rem" }}>Procesando pago...</Typography>
          //     </Box>
          //   )
          //   : (
          <Button
            fullWidth
            variant="contained"
            sx={{
              backgroundColor: "#7e9d8a", "&:hover": { backgroundColor: "#f9b32d", color: "black" },
            }}

            disabled={confirmedProducts.length === 0}
            onClick={() => handleCloseOrder()}
          >
            <Payment style={{ marginRight: "5px" }} /> Cambiar a Orden Pagada
          </Button>
          // )
        }
      </div>
    </div>
  );
};

export default PayOrder;
