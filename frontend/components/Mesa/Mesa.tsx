import React, { useEffect, useState } from "react";
import { MesaProps } from "../Interfaces/Cafe_interfaces";
import useMesa from "../Hooks/useMesa";
import MesaCard from "./MesaCard";
import MesaModal from "./MesaModal";
import { TableCreated } from "./useTableStore";
import { Button } from "@mui/material";
import { useRoomContext } from '../../app/context/room.context';

const Mesa: React.FC<MesaProps> = ({ salaId, onSelectMesa }) => {

  const {
    // selectedMesa,
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
    // setSelectedMesa,
  } = useMesa(salaId);

  // TODO: Ahora se debe usar del contexto Room.
  const { selectedMesa } = useRoomContext();

  const [mesasFiltradas, setMesasFiltradas] = useState<TableCreated[]>([]);

  useEffect(() => {
    const mesasFiltradas = tables.filter((mesa) => mesa.room.id === salaId);
    setMesasFiltradas(mesasFiltradas);
  }, [salaId, tables]);


  const filtrarMesasPorSala = (tables: TableCreated[]) => {
    setMesasFiltradas(tables.filter((mesa) => mesa.room.id === salaId));
  };

  useEffect(() => {
    filtrarMesasPorSala(tables);
  }, [salaId, tables]);

  useEffect(() => {
    if (selectedMesa) {
      setForm({ ...form, id: selectedMesa.id });
    }
  }, [selectedMesa]);



  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Button
        variant="outlined"
        color="primary"
        className="mr-2 w-1/3 lg:w-2/5 my-2 h-[3rem] border-2 border-[#856D5E] hover:bg-[#856D5E] hover:text-white"

        onClick={() => handleOpenModal("create")}
      >
        + Agregar mesa
      </Button>

      <div
        className="custom-scrollbar flex gap-4 
        overflow-x-auto lg:flex-wrap lg:overflow-y-auto pr-2 pt-2"
        style={{
          maxHeight: "90vh",
        }}>
        {mesasFiltradas.map((mesa) => (
          <MesaCard
            key={mesa.id}
            mesa={mesa}
            setSelectedMesa={(mesaSeleccionada) => {
              onSelectMesa(mesaSeleccionada); // Notifica al componente padre
            }}
            handleOpenModal={handleOpenModal}
            handleDelete={handleDelete}
          />

        ))}
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

export default Mesa;
