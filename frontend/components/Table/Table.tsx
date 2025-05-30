'useClient';
import React, { useState } from "react";
import { MesaProps } from "../Interfaces/Cafe_interfaces";
import useMesa from "../Hooks/useMesa";
import { TableCreated, useTableStore } from "./useTableStore";
import { Button } from "@mui/material";
import { useRoomContext } from '../../app/context/room.context';
import TablesStatus from "./TablesStatus";
import TableCard from "./TableCard";
import { UserRole } from "../Enums/user";
import { useAuth } from "@/app/context/authContext";
import { useNameTableForm } from "./useNameTableForm";
import TableModal from "./TableModal";
import { TableModalType } from "../Enums/table";

const Table: React.FC<MesaProps> = ({ salaId, onSelectMesa }) => {
  const { getAccessToken } = useAuth();
  const token = getAccessToken();

  const { nameTable, setNameTable, errorNameTable } = useNameTableForm(token);
  const {
    modalOpen,
    modalType,
    form,
    handleOpenModal,
    handleCloseModal,
    handleCreateTable,
    handleEdit,
    handleDelete,
    // setForm,
  } = useMesa(salaId, setNameTable);

  const { tables } = useTableStore();

  const { selectedMesa } = useRoomContext();
  const [filterState, setFilterState] = useState<string | null>(null);
  const { userRoleFromToken } = useAuth();
  const role = userRoleFromToken();

  /**
   * Filtrar mesas por sala y estado
   * @returns mesas filtradas
   * Esto es para renderizar solo las mesas de la sala seleccionada y
   * mostrar solo las mesas con el estado seleccionado del componente TablesStatus
   */
  const mesasFiltradas = tables.filter((mesa: TableCreated) =>
    mesa.room.id === salaId && (filterState ? mesa.state === filterState : true)
  );


  const { selectedSala } = useRoomContext();

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div className="flex flex-wrap justify-between">
        {
          role !== UserRole.MOZO && (
            <Button
              variant="outlined"
              color="primary"
              className="mr-2 w-1/3 lg:w-2/5 my-2 h-[3rem] border-2 border-[#856D5E] hover:bg-[#856D5E] hover:text-white"
              onClick={() => handleOpenModal(TableModalType.CREATE)}
            >
              + Agregar mesa
            </Button>
          )
        }
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
        <TableModal
          open={modalOpen}
          onClose={handleCloseModal}
          onSave={
            modalType === TableModalType.CREATE
              ? () => handleCreateTable(nameTable, salaId)
              : (modalType === TableModalType.EDIT && form?.id)
                ? () => handleEdit(form ?? {})
                : () => Promise.resolve() // valor por defecto
          }
          nombre={nameTable}
          room={selectedSala?.name ?? ''}
          setNombre={setNameTable}
          errorNombre={errorNameTable}
          modalType={modalType}
        />
      </div>
    </div>
  );
};

export default Table;
