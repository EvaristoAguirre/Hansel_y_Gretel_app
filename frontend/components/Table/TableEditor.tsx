"use client";
import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { MesaInterface } from "../Interfaces/Cafe_interfaces";
import { Button } from "@mui/material";
import { useOrderContext } from "../../app/context/order.context";
import { editTable } from "@/api/tables";
import { TableState } from "../Enums/Enums";
import { useRoomContext } from "../../app/context/room.context";
import { useAuth } from "@/app/context/authContext";
import io from 'socket.io-client';
import { useTableStore } from "./useTableStore";




interface Props {
  view: string;
  onAbrirPedido: () => void;
  handleNextStep: () => void;
  handleCompleteStep: () => void;
}

const TableEditor = ({
  view,
  onAbrirPedido,
  handleNextStep,
  handleCompleteStep,
}: Props) => {
  const { getAccessToken } = useAuth();
  const { selectedMesa, setSelectedMesa } = useRoomContext();
  const [cantidadPersonas, setCantidadPersonas] = useState<number | null>(null);
  const [comentario, setComentario] = useState("");
  const {
    handleCreateOrder,
    handleEditOrder,
    selectedProducts,
    selectedOrderByTable,
  } = useOrderContext();

  const setTableFields = useCallback(() => {
    if (selectedOrderByTable && selectedOrderByTable.comment) {
      setComentario(selectedOrderByTable.comment);
    } else {
      setComentario("");
    }
    // Número de comensales
    if (selectedOrderByTable && selectedOrderByTable.numberCustomers != null) {
      setCantidadPersonas(selectedOrderByTable.numberCustomers);
    } else {
      setCantidadPersonas(null);
    }
  }, [selectedMesa, selectedOrderByTable]);

  useEffect(() => {
    setTableFields();
  }, [setTableFields]);

  /**
   * @param selectedMesa - Es la Mesa que se selecciona.
   * se llama al endopoint para abrir la mesa
   * este cambia estado de la mesa a 'OPEN'
   */
  const handleOpenTable = async (selectedMesa: MesaInterface) => {
    const token = getAccessToken();
    if (!token) return;
    const tableEdited = await editTable(
      selectedMesa.id,
      { ...selectedMesa, state: TableState.OPEN },
      token
    );
    setSelectedMesa(tableEdited);
    handleNextStep();
  };

  const { tables, connectWebSocket } = useTableStore();

  useEffect(() => {
    connectWebSocket();
  }, []);
  
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "1rem",
        alignItems: "center",
        border: "1px solid #d4c0b3",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      }}
    >
      {view === "mesaEditor" && (
        <div style={{ width: "100%" }}>
          <form>
            {/* Cantidad de personas y comentario */}
            <div
              style={{
                border: "1px solid #7e9d8a",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                padding: "10px",
              }}
            >
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
                  value={cantidadPersonas ?? ""}
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
                  if (cantidadPersonas === null || cantidadPersonas <= 0) {
                    Swal.fire(
                      "Error",
                      "La cantidad de personas debe ser mayor a 0.",
                      "error"
                    );
                    return;
                  } else if (selectedMesa?.state === "available") {
                    handleCreateOrder(
                      selectedMesa,
                      cantidadPersonas,
                      comentario
                    );
                    onAbrirPedido();
                    handleOpenTable(selectedMesa);
                    handleCompleteStep();
                    handleNextStep();
                   
                  } else {
                    if (selectedOrderByTable?.id) {

                      handleEditOrder(selectedOrderByTable.id, selectedProducts, cantidadPersonas, comentario);

                      Swal.fire(
                        "Cambios Guardados",
                        "Los cambios se han guardado correctamente.",
                        "success"
                      );
                      handleNextStep();
                    }
                  }
                }}
              >
                {selectedMesa?.state === "open"
                  ? "Guardar Cambios"
                  : "Abrir Mesa"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TableEditor;
