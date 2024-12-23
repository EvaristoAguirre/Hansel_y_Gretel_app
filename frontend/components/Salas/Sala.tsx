import React, { useState } from "react";

interface Sala {
  id: string;
  nombre: string;
}
const Sala = () => {
  const [salas, setSalas] = useState<Sala[]>([
    { id: "1", nombre: "Sala Principal" },
    { id: "2", nombre: "Terraza" },
  ]);
  const [selectedSala, setSelectedSala] = useState<Sala | null>(null);

  return (
    <div
      className="salas"
      style={{
        height: "50px",
        backgroundColor: "#515050",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
      }}
    >
      {salas.map((sala) => (
        <h3
          key={sala.id}
          style={{
            fontSize: "1.25rem",
            color: "#ffffff",
            fontWeight: "400",
            margin: "0 20px",
            cursor: "pointer",
            borderBottom:
              selectedSala?.id === sala.id ? "1px solid #ffffff" : "none",
          }}
          onClick={() => setSelectedSala(sala)}
        >
          {sala.nombre}
        </h3>
      ))}
    </div>
  );
};

export default Sala;
