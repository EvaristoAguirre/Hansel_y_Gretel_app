import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { ISala, MesaInterface } from "../Interfaces/Cafe_interfaces";
import { Button } from "@mui/material";
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
import useSala from "../Hooks/useSala";

const MesaEditor = ({
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
      console.warn(
        "La mesa no tiene órdenes asociadas o el formato no es válido."
      );
      return;
    }

    // Buscar la orden correspondiente
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
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      {view === "mesaEditor" && (
        <div style={{ width: "90%" }}>
          <div>
            <h2
              style={{
                height: "3rem",
                backgroundColor: "#856D5E",
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
            </h2>
          </div>
          <form>
            <div
              style={{
                margin: "10px 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <label>Cantidad de personas:</label>
              <input
                style={{ padding: "3px 10px" }}
                type="number"
                value={cantidadPersonas}
                onChange={(e) => setCantidadPersonas(Number(e.target.value))}
              />
            </div>
            {/* <div
            style={{
              margin: "10px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <label>Mozo:</label>
            <select
              style={{ padding: "3px 10px" }}
              value={mozo}
              onChange={(e) => setMozo(e.target.value)}
            >
              <option value="">Seleccionar mozo</option>
              {mozos.map((m, index) => (
                <option key={index} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div> */}
            <div
              style={{
                margin: "10px 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <label>Comentario:</label>
              <textarea
                style={{ padding: "3px 10px" }}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                flexDirection: "column",
              }}
            >
              <Button
                type="button"
                fullWidth
                color="primary"
                variant="contained"
                style={{ marginTop: "10px" }}
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
                color="primary"
                variant="contained"
                style={{ marginTop: "10px" }}
                onClick={() => {
                  // abrirPedido();
                  if (mesa.orderId !== null) {
                    onAbrirPedido(); // Abre el pedido existente
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
            </div>
          </form>
        </div>
      )}
      {view === "pedidoEditor" && ordenAbierta && (
        <PedidoEditor mesa={mesa} ordenAbierta={ordenAbierta}></PedidoEditor>
      )}
    </div>
  );
};

export default MesaEditor;
