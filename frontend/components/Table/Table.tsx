'useClient';
import React, { useEffect, useState } from "react";
import useTable from "../Hooks/useTable";
import { useTableStore } from "./useTableStore";
import { Button } from "@mui/material";
import { useRoomContext } from '../../app/context/room.context';
import TablesStatus from "./TablesStatus";
import TableCard from "./TableCard/TableCard";
import { UserRole } from "../Enums/user";
import { useAuth } from "@/app/context/authContext";
import { useNameTableForm } from "./useNameTableForm";
import TableModal from "./TableModal";
import { TableModalType } from "../Enums/table";
import { ITable } from "../Interfaces/ITable";
import { getTableByRoom } from "@/api/tables";

interface TableProps {
  salaId: string;
  onSelectTable: (table: ITable) => void;
}
const Table: React.FC<TableProps> = ({ salaId, onSelectTable }) => {
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
  } = useTable(salaId, setNameTable);

  const { tables, updateTablesByRoom } = useTableStore();

  const { selectedTable } = useRoomContext();
  const [filterState, setFilterState] = useState<string | null>(null);
  const { userRoleFromToken } = useAuth();
  const role = userRoleFromToken();

  const [mesas, setMesas] = useState<ITable[]>([]);

  /**
   * Filtrar mesas por sala y estado
   * @returns mesas filtradas
   * Esto es para renderizar solo las mesas de la sala seleccionada y
   * mostrar solo las mesas con el estado seleccionado del componente TablesStatus
   */
  // const mesasFiltradas = tables.filter((table: ITable) =>
  //   table.room.id === salaId && (filterState ? table.state === filterState : true)
  // );

  useEffect(() => {
    token && updateTablesByRoom(salaId, token);
  }, [salaId, token]);


  const { selectedRoom } = useRoomContext();

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
              + Agregar Mesa
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
        {tables.length > 0 ? (
          tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}

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
                : () => Promise.resolve()
          }
          nombre={nameTable}
          room={selectedRoom?.name ?? ''}
          setNombre={setNameTable}
          errorNombre={errorNameTable}
          modalType={modalType}
        />
      </div>
    </div>
  );
};

export default Table;
