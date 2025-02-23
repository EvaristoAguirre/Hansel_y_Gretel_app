import React, { useEffect, useState } from "react";
import { MesaProps } from "../Interfaces/Cafe_interfaces";
import useMesa from "../Hooks/useMesa";
import MesaModal from "./TableModal";
import { TableCreated } from "./useTableStore";
import { Button } from "@mui/material";
import { useRoomContext } from '../../app/context/room.context';
import TablesStatus from "./TablesStatus";
import TableCard from "./TableCard";

const Table: React.FC<MesaProps> = ({ salaId, onSelectMesa }) => {

  const {
    modalOpen,
    modalType,
    form,
    tables,
    handleOpenModal,
    handleCloseModal,
    handleCreate,
    handleEdit,
    handleDelete,
    setForm,
  } = useMesa(salaId);

  const { selectedMesa } = useRoomContext();
  const [filterState, setFilterState] = useState<string | null>(null);
  /**
   * Filtrar mesas por sala y estado
   * @returns mesas filtradas
   * Esto es para renderizar solo las mesas de la sala seleccionada y
   * mostrar solo las mesas con el estado seleccionado del componente TablesStatus
   */
  const mesasFiltradas = tables.filter((mesa: TableCreated) =>
    mesa.room.id === salaId && (filterState ? mesa.state === filterState : true)
  );
  console.log("Mesas filtradas--->", mesasFiltradas);


  useEffect(() => {
    if (selectedMesa) {
      setForm({ ...form, id: selectedMesa.id });
    }
  }, [selectedMesa]);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div className="flex flex-wrap justify-between">
        <Button
          variant="outlined"
          color="primary"
          className="mr-2 w-1/3 lg:w-2/5 my-2 h-[3rem] border-2 border-[#856D5E] hover:bg-[#856D5E] hover:text-white"
          onClick={() => handleOpenModal("create")}
        >
          + Agregar mesa
        </Button>
        <TablesStatus
          currentFilter={filterState}
          onFilterChange={(newFilter) => setFilterState(newFilter)}
        />
      </div>

      <div
        className="custom-scrollbar flex gap-4 overflow-x-auto lg:flex-wrap lg:overflow-y-auto pr-2 pt-2"
        style={{ maxHeight: "90vh" }}
      >
        {mesasFiltradas.length > 0 ? (
          mesasFiltradas.map((mesa) => (
            <TableCard
              key={mesa.id}
              mesa={mesa}
              setSelectedMesa={(mesaSeleccionada) => {
                onSelectMesa(mesaSeleccionada);
              }}
              handleOpenModal={handleOpenModal}
              handleDelete={handleDelete}
            />
          ))
        ) : (
          <p style={{ textAlign: "start", width: "100%", marginTop: "1rem", color: "red" }}>
            No hay mesas en este estado
          </p>
        )}
        <MesaModal
          open={modalOpen}
          type={modalType}
          form={form}
          onClose={handleCloseModal}
          onSave={(dataToSend) => {
            if (modalType === "create") {
              handleCreate(dataToSend);
            } else if (modalType === "edit" && form.id) {
              handleEdit(form.id, dataToSend);
            }
          }}
          onChange={(field, value) =>
            setForm((prev) => ({
              ...prev,
              [field]: field === "number" ? Number(value) : value,
            }))
          }
        />
      </div>
    </div>
  );
};

export default Table;
