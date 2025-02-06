'use client'
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { MesaInterface } from "../Interfaces/Cafe_interfaces";
import { Button } from "@mui/material";
import usePedido from "../Hooks/usePedido";
import { OrderCreated, useOrderStore } from "../Pedido/useOrderStore";
import { TableCreated, useTableStore } from "./useTableStore";

const MesaEditor = ({
  mesa,
  view,
  onAbrirPedido,
  setOrdenAbierta,
  handleNext
}: {
  mesa: MesaInterface;
  view: string;
  onAbrirPedido: () => void;
  setOrdenAbierta: (order: OrderCreated | undefined) => void;
  handleNext: () => void
}) => {
  const [cantidadPersonas, setCantidadPersonas] = useState(0);
  const [comentario, setComentario] = useState("");
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
      style={{
        display: "flex", flexDirection: "column",
        padding: "1rem", alignItems: "center", border: "1px solid #d4c0b3",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
      }}
    >
      {view === "mesaEditor" && (
        <div style={{ width: "100%" }}>
          <form>
            {/* Cantidad de personas y comentario */}
            <div style={{
              border: "1px solid #7e9d8a",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              padding: "10px",
            }}>
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
                  type="number"
                  value={cantidadPersonas}
                  onFocus={(e) => (e.target.style.outline = "none")}
                  onChange={(e) => setCantidadPersonas(Number(e.target.value))}
                  className="bg-transparent border-b-2 border-[#856D5E] w-1/2"
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
                  onFocus={(e) => (e.target.style.outline = "none")}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  className="bg-transparent border-b-2 border-[#856D5E] w-1/2 h-8"
                />
              </div>
            </div>

            {/* Botones para guardar cambios y abrir pedido */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                flexDirection: "column",
                marginTop: "30px",
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
                variant="contained"
                style={{ marginTop: "10px" }}
                sx={{
                  backgroundColor: "#7e9d8a",
                  "&:hover": { backgroundColor: "#f9b32d", color: "black" },
                }}
                onClick={() => {
                  // abrirPedido();
                  if (mesa.orderId !== null) {
                    onAbrirPedido();
                    handleNext();
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
    </div>
  );
};

export default MesaEditor;
