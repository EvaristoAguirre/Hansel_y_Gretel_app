'use client'
import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { MesaInterface } from "../Interfaces/Cafe_interfaces";
import { Button } from "@mui/material";
import { useOrderStore } from "../Pedido/useOrderStore";
import { useTableStore } from "./useTableStore";
import { useOrderContext } from '../../app/context/order.context';
import { log } from 'console';

interface Props {
  selectedMesa: MesaInterface;
  view: string;
  onAbrirPedido: () => void;
  handleNextStep: () => void
}

const MesaEditor = ({
  selectedMesa,
  view,
  onAbrirPedido,
  handleNextStep
}: Props) => {
  const [cantidadPersonas, setCantidadPersonas] = useState(0);
  const [comentario, setComentario] = useState('');
  const { handleCreateOrder, handleEditOrder, selectedProducts, selectedOrderByTable } = useOrderContext();



  const setTableFields = useCallback(() => {
    if (selectedOrderByTable && selectedOrderByTable.comment) {
      setComentario(selectedOrderByTable.comment);
    } else {
      setComentario('');
    }
    // Número de comensales
    if (selectedOrderByTable && selectedOrderByTable.numberCustomers) {
      setCantidadPersonas(selectedOrderByTable.numberCustomers);
    } else {
      setCantidadPersonas(0);
    }
    console.log("🦋Selected Order By Table", selectedOrderByTable);
    console.log("🌝Selected Mesa", selectedMesa);


  }, [selectedMesa]);

  useEffect(() => {
    setTableFields();
  }, [setTableFields])

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
                  rows={2}
                  className="bg-transparent border-b-2 border-[#856D5E] w-1/2"
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
                  } else if (selectedMesa?.state === "available") {
                    handleCreateOrder(selectedMesa, cantidadPersonas, comentario);
                    onAbrirPedido();
                    handleNextStep();
                  } else {
                    handleEditOrder(selectedMesa.orders[0], selectedProducts, cantidadPersonas, comentario);
                  }
                }}
              >
                {selectedMesa?.state === "open" ? "Guardar Cambios" : "Abrir Mesa"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MesaEditor;
