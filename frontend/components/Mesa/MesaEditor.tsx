import { useState } from "react";
import Swal from "sweetalert2";
import { MesaInterface } from "../Interfaces/Cafe_interfaces";
import { Button } from "@mui/material";
import PedidoEditor from "../Pedido/PedidoEditor";

const MesaEditor = ({ mesa }: { mesa: MesaInterface }) => {
  const [cantidadPersonas, setCantidadPersonas] = useState(0);
  const [mozo, setMozo] = useState("");
  const [comentario, setComentario] = useState("");
  const mozos = ["Mozo 1", "Mozo 2", "Mozo 3"]; // Opciones para el select
  const [mostrarEditorPedido, setMostrarEditorPedido] = useState(false);
  const [mostrarEditorMesa, setMostrarEditorMesa] = useState(false);

  const handleAbrirMesa = () => {
    setMostrarEditorPedido(true);
    setMostrarEditorMesa(false);
  };

  const handleVerPedido = () => {
    setMostrarEditorPedido(true);
    setMostrarEditorMesa(false);
  };

  return (
    <>
      {mostrarEditorMesa ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ width: "85%" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                backgroundColor: "#f28b82",
              }}
            >
              <h3 style={{ fontSize: "1rem", fontWeight: "bold" }}>
                {mesa.name}
              </h3>
            </div>
            <form>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  margin: "10px 0",
                }}
              >
                <label>Cantidad de personas:</label>
                <input
                  type="number"
                  value={cantidadPersonas}
                  onChange={(e) => setCantidadPersonas(Number(e.target.value))}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  margin: "10px 0",
                }}
              >
                <label>Mozo:</label>
                <select value={mozo} onChange={(e) => setMozo(e.target.value)}>
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
                  display: "flex",
                  justifyContent: "space-between",
                  margin: "10px 0",
                }}
              >
                <label>Comentario:</label>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                />
              </div>
              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Button
                  style={{ marginLeft: "0.5rem" }}
                  onClick={handleAbrirMesa}
                >
                  Abrir Mesa
                </Button>
                <Button
                  style={{ marginLeft: "0.5rem" }}
                  onClick={handleVerPedido}
                >
                  Ver pedido
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <>{/* <PedidoEditor /> */}</>
      )}
    </>
  );
};

export default MesaEditor;
