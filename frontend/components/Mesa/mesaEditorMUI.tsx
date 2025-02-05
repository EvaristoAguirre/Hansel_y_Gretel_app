import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { ISala, MesaInterface } from "../Interfaces/Cafe_interfaces";
import { Button, Box, TextField, Typography } from "@mui/material";
import PedidoEditor from "../Pedido/PedidoEditor";
import useMesa from "../Hooks/useMesa";
import usePedido from "../Hooks/usePedido";
import { OrderCreated, useOrderStore } from "../Pedido/useOrderStore";
import { ICreacionPedido } from "../Interfaces/Pedido_interfaces";
import {
  OrderDetailsCreated,
  useOrderDetailsStore,
} from "../Pedido/useOrderDetailsStore";
import { TableCreated, useTableStore } from "./useTableStore";

const MesaEditorMUI = ({
  mesa,
  view,
  onAbrirPedido,
}: {
  mesa: MesaInterface;
  view: string;
  onAbrirPedido: () => void;
}) => {
  const [cantidadPersonas, setCantidadPersonas] = useState(0);
  const [comentario, setComentario] = useState("");
  const [ordenAbierta, setOrdenAbierta] = useState<OrderCreated>();
  const { handleCreateOrder } = usePedido();
  const { orders } = useOrderStore();
  const { tables } = useTableStore();

  useEffect(() => {
    const mesaTableCreated: TableCreated | undefined = tables.find(
      (table) => table.id === mesa.id
    );

    if (!mesaTableCreated) {
      console.warn("No se encontró una mesa con el ID proporcionado.");
      return;
    }

    if (
      !Array.isArray(mesaTableCreated.orders) ||
      mesaTableCreated.orders.length === 0
    ) {
      console.warn("La mesa no tiene órdenes asociadas o el formato no es válido.");
      return;
    }

    const order = orders.find((order) =>
      mesaTableCreated.orders.some((orderId) => orderId === order.id)
    );

    if (!order) {
      console.warn("No se encontró una orden correspondiente.");
    } else {
      setOrdenAbierta(order);
    }
  }, [orders, mesa.id, tables, view]);

  return (
    <Box display="flex" flexDirection="column" alignItems="center">
      {view === "mesaEditor" && (
        <Box width="90%">
          <Box mb={2}>
            <Typography
              variant="h6"
              sx={{
                height: "3rem",
                fontSize: "1.2rem",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "#ffffff",
                margin: "1rem 0",
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            >
              {mesa.name}
            </Typography>
          </Box>
          <form>
            <Box
              sx={{
                border: "1px solid #a7c5b5", borderRadius: "10px",
                shadow: "0 0 10px rgba(0, 0, 0, 0.2)",
                padding: "10px",
              }}
            >
              <Box
                sx={{
                  margin: "10px 0",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                }}
              >

                <TextField
                  variant="outlined"
                  label="Cantidad de personas"
                  type="number"
                  value={cantidadPersonas}
                  onChange={(e) => setCantidadPersonas(Number(e.target.value))}
                  size="small"
                  sx={{ label: { color: "white" } }}
                />
              </Box>
              <Box
                sx={{
                  margin: "10px 0",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "fl",
                  justifyContent: "space-between",
                }}
              >

                <TextField
                  multiline
                  label="Comentarios"
                  variant="outlined"
                  minRows={3}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  size="small"
                  fullWidth
                  sx={{ label: { color: "white" } }}
                />
              </Box>
            </Box>
            <Box display="flex" flexDirection="column" alignItems="center">
              <Button
                type="button"
                fullWidth
                color="primary"
                variant="contained"
                sx={{ marginTop: "10px" }}
                onClick={() => {
                  if (cantidadPersonas <= 0) {
                    Swal.fire(
                      "Error",
                      "La cantidad de personas debe ser mayor a 0.",
                      "error"
                    );
                    return;
                  } else if (mesa.state !== "open") {
                    handleCreateOrder(mesa, cantidadPersonas, comentario);
                    onAbrirPedido();
                  } else {
                    // handleEditOrder(order.id);
                  }
                }}
              >
                {mesa.state === "open" ? "Guardar Cambios" : "Abrir Mesa"}
              </Button>

              <Button
                disabled={mesa.state !== "open"}
                type="button"
                fullWidth
                color="secondary"
                variant="contained"
                sx={{ marginTop: "10px" }}
                onClick={() => {
                  if (mesa.orderId !== null) {
                    onAbrirPedido();
                  } else {
                    Swal.fire(
                      "Error",
                      "No se ha abierto un pedido para esta mesa.",
                      "error"
                    );
                  }
                }}
              >
                Abrir Pedido
              </Button>
            </Box>
          </form>
        </Box>
      )}
      {view === "pedidoEditor" && ordenAbierta && (
        <PedidoEditor mesa={mesa} ordenAbierta={ordenAbierta} />
      )}
    </Box>
  );
};

export default MesaEditorMUI;
