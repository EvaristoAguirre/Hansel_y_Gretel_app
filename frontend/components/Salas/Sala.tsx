import React, { useEffect, useState } from "react";
import { URI_ROOM, URI_TABLE } from "../URI/URI";
import Swal from "sweetalert2";
import { MesaInterface } from "../Interfaces/Cafe_interfaces";
import Mesa from "../Mesa/Mesa";
import { grey } from "@mui/material/colors";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { TableCreated, useTableStore } from "../Mesa/useTableStore";

interface Sala {
  id: string;
  name: string;
  isActive: boolean;
  tables: MesaInterface[];
}

const Sala = () => {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [selectedSala, setSelectedSala] = useState<Sala | null>(null);
  const [mesaUpdated, setMesaUpdated] = useState<boolean>(false);
  const [mesasFiltradas, setMesasFiltradas] = useState<TableCreated[]>([]);

  const { tables } = useTableStore();

  const filtrarMesasPorSala = (mesas: TableCreated[]) => {
    setMesasFiltradas(mesas.filter((mesa) => mesa.room === selectedSala?.id));
  };

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
    filtrarMesasPorSala(tables);
    console.log("Mesas filtradas:", tables);
  }, [mesaUpdated]);

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
            onClick={() => {
              setSelectedSala(sala);
              console.log(sala, "sala seleccionada");
            }}
          >
            {sala.name}
          </h3>
        ))}
      </div>
      <div>
        {selectedSala && (
          <Mesa mesas={mesasFiltradas} salaId={selectedSala.id}></Mesa>
        )}
      </div>
    </>
  );
};

export default Sala;
