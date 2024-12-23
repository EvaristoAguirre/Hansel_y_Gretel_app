import React, { useState } from "react";
import { MesaInterface } from "../Interfaces/Cafe_interfaces";
import MesaDatos from "./MesaDatos";

interface MesaProps {
  mesas: MesaInterface[]; // Prop de tipo arreglo de mesas
}

const Mesa: React.FC<MesaProps> = ({ mesas }) => {
  const [selectedMesa, setSelectedMesa] = useState<MesaInterface>();
  const [mesaDatos, setMesaDatos] = useState(false);

  // Manejar selección de mesa
  const handleSeleccionarMesa = (mesa: MesaInterface) => {
    setSelectedMesa(mesa);
    setMesaDatos(true);
    // setMostrarEditorPedido(false);
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        padding: "20px",
      }}
    >
      {mesas.map((mesa) => (
        <div
          key={mesa.id}
          style={{
            width: "14rem",
            height: "4rem",
            backgroundColor: mesa.estado === "abierta" ? "#f28b82" : "#aed581",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
          }}
          onClick={() => handleSeleccionarMesa(mesa)}
        >
          <h3 style={{ fontSize: "1rem" }}>{mesa.nombre}</h3>
        </div>
      ))}
      {mesaDatos ? <MesaDatos selectedMesa={selectedMesa} setSelectedMesa={setSelectedMesa}/> : null}
    </div>
  );
};

export default Mesa;
