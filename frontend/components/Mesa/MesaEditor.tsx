import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { MesaInterface } from "../Interfaces/Cafe_interfaces";
import { Button } from "@mui/material";
import PedidoEditor from "../Pedido/PedidoEditor";
import useMesa from "../Hooks/useMesa";
import usePedido from "../Hooks/usePedido";
import { OrderCreated, useOrderStore } from "../Pedido/useOrderStore";
import { ICreacionPedido } from "../Interfaces/Pedido_interfaces";

const MesaEditor = ({
  mesa,
  onAbrirPedido,
}: {
  mesa: MesaInterface;
  onAbrirPedido: () => void;
}) => {
  const [cantidadPersonas, setCantidadPersonas] = useState(0);
  const [mozo, setMozo] = useState("");
  const [comentario, setComentario] = useState("");
  const mozos = ["Mozo 1", "Mozo 2", "Mozo 3"];
  const [pedido, setPedido] = useState<OrderCreated | null>();
  const [ordenAbierta, setOrdenAbierta] = useState<OrderCreated | null>();

  const { handleCreateOrder, fetchOrderById, handleEditOrder } = usePedido();

  const { updateOrder, orders } = useOrderStore();

  useEffect(() => {
    const ordenArenderizar = (mesa: MesaInterface): void => {
      const order = orders.find((order) => order.tableId === mesa.id);
      setOrdenAbierta(order || null);
      console.log("order:", order);
      console.log("ordenAbierta:", ordenAbierta);
    };
    ordenArenderizar(mesa);
  }, [orders, mesa.orderId]);

  console.log("Orders en useOrderStore:", orders);
  console.log("orderId en PedidoEditor:", mesa.orderId);
  console.log("mesa en MesaEditor:", mesa);

  //Método a reemplazar
  // const abrirPedido = async () => {
  //   try {
  //     await fetchOrderById(mesa.orderId);
  //     const order = orders.find((order) => order.id === mesa.orderId);
  //     if (order) {
  //       setPedido(order);
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     Swal.fire("Error", "No se pudo obtener el pedido.", "error");
  //   }
  // };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
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
                  onAbrirPedido();
                  handleCreateOrder(mesa, cantidadPersonas, comentario);
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
                  onAbrirPedido();
                }
              }}
            >
              Abrir Pedido
            </Button>
          </div>
        </form>
      </div>
      {ordenAbierta ? <PedidoEditor mesa={mesa}></PedidoEditor> : null}
    </div>
  );
};

export default MesaEditor;
