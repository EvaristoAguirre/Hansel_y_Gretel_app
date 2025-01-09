import { useState } from "react";
import Swal from "sweetalert2";
import { MesaInterface } from "../Interfaces/Cafe_interfaces";
import { Button } from "@mui/material";
import PedidoEditor from "../Pedido/PedidoEditor";
import useMesa from "../Hooks/useMesa";
import usePedido from "../Hooks/usePedido";

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

  const { handleCreateOrder } = usePedido();

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <div style={{ width: "90%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            backgroundColor: "#f28b82",
          }}
        >
          <h3 style={{ fontSize: "1rem", fontWeight: "bold" }}>{mesa.name}</h3>
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
          <div
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
          </div>
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
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Button
              type="button"
              onClick={() => {
                onAbrirPedido();
                handleCreateOrder(mesa, cantidadPersonas, comentario);
              }}
            >
              Abrir Pedido
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MesaEditor;
