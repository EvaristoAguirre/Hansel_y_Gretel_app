import React, { useEffect, useState } from "react";
import { URI_ROOM } from "../URI/URI";
import Swal from "sweetalert2";
import { MesaInterface, ISala } from "../Interfaces/Cafe_interfaces";
import Mesa from "../Mesa/Mesa";
import { TableCreated, useTableStore } from "../Mesa/useTableStore";
import useMesa from "../Hooks/useMesa";
import MesaEditor from "../Mesa/MesaEditor";

const Sala = () => {
  const [salas, setSalas] = useState<ISala[]>([]);
  const [selectedSala, setSelectedSala] = useState<ISala | null>(null);
  const [mesaUpdated, setMesaUpdated] = useState<boolean>(false);
  const [selectedMesa, setSelectedMesa] = useState<MesaInterface | null>(null);

  const { tables } = useMesa(selectedSala?.id || "");

  useEffect(() => {
    async function fetchSalas() {
      try {
        const response = await fetch(URI_ROOM, { method: "GET" });
        const data = await response.json();
        console.log(data);
        setSalas(data);
      } catch (error) {
        Swal.fire("Error", "No se pudieron cargar las salas.", "error");
        console.error(error);
      }
    }

    fetchSalas();
    // filtrarMesasPorSala(tables);
    console.log("Mesas filtradas:", tables);
  }, [mesaUpdated]);

  const handleSelectMesa = (mesa: MesaInterface) => {
    setSelectedMesa(mesa);
  };

  return (
    // <>
    //   <div
    //     className="salas"
    //     style={{
    //       height: "50px",
    //       backgroundColor: "#515050",
    //       display: "flex",
    //       alignItems: "center",
    //       padding: "0 20px",
    //     }}
    //   >
    //     {salas.map((sala) => (
    //       <h3
    //         key={sala.id}
    //         style={{
    //           fontSize: "1.25rem",
    //           color: "#ffffff",
    //           fontWeight: "400",
    //           margin: "0 20px",
    //           cursor: "pointer",
    //           borderBottom:
    //             selectedSala?.id === sala.id ? "1px solid #ffffff" : "none",
    //         }}
    //         onClick={() => {
    //           setSelectedSala(sala);
    //           console.log(sala, "sala seleccionada");
    //         }}
    //       >
    //         {sala.name}
    //       </h3>
    //     ))}
    //   </div>
    //   <div>
    //     {selectedSala && (
    //       <Mesa salaId={selectedSala.id}></Mesa>
    //     )}
    //   </div>
    // </>

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
            onClick={() => {
              setSelectedSala(sala);
            }}
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
          {selectedMesa ? (
            <MesaEditor mesa={selectedMesa} />
          ) : (
            <p>Seleccione una mesa para editar</p>
          )}
        </div>
      </div>
    </>
  );
};

export default Sala;
