import React, { useEffect, useState } from "react";
import { URI_ROOM } from "../URI/URI";
import Swal from "sweetalert2";
import { MesaInterface, ISala } from "../Interfaces/Cafe_interfaces";
import Mesa from "../Mesa/Mesa";
import { TableCreated, useTableStore } from "../Mesa/useTableStore";
import useMesa from "../Hooks/useMesa";
import MesaEditor from "../Mesa/MesaEditor";
import PedidoEditor from "../Pedido/PedidoEditor";


const Sala = () => {
  const [salas, setSalas] = useState<ISala[]>([]);
  const [selectedSala, setSelectedSala] = useState<ISala | null>(null);
  const [selectedMesa, setSelectedMesa] = useState<MesaInterface | null>(null);
  const [view, setView] = useState<'mesaEditor' | 'pedidoEditor' | null>(null);

  useEffect(() => {
    async function fetchSalas() {
      try {
        const response = await fetch(URI_ROOM, { method: "GET" });
        const data = await response.json();
        setSalas(data);
      } catch (error) {
        Swal.fire("Error", "No se pudieron cargar las salas.", "error");
      }
    }
    fetchSalas();
  }, []);

  const handleSelectMesa = (mesa: MesaInterface) => {
    setSelectedMesa(mesa);
    setView('mesaEditor');
  };

  const handleAbrirPedido = () => {
    setView('pedidoEditor');
  };

  const handleVolverAMesaEditor = () => {
    setView('mesaEditor');
  };

  return (
    <>
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
            {sala.name}
          </h3>
        ))}
      </div>
      <div style={{ display: "flex" }}>
        <div style={{ flex: 1 }}>
          {selectedSala && (
            <Mesa salaId={selectedSala.id} onSelectMesa={handleSelectMesa} />
          )}
        </div>
        <div style={{ flex: 0.5, padding: "20px", backgroundColor: "#f7f7f7" }}>
          {view === 'mesaEditor' && selectedMesa && (
            <MesaEditor
              mesa={selectedMesa}
              onAbrirPedido={handleAbrirPedido}
            />
          )}
          {view === 'pedidoEditor' && selectedMesa && (
            <PedidoEditor
              mesa={selectedMesa}
              onVolver={handleVolverAMesaEditor}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default Sala;
