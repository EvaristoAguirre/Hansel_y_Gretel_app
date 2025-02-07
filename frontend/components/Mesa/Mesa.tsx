import React, { useEffect, useState } from "react";
import { MesaInterface, MesaProps } from "../Interfaces/Cafe_interfaces";
import useMesa from "../Hooks/useMesa";
import MesaCard from "./MesaCard";
import MesaModal from "./MesaModal";
import { TableCreated } from "./useTableStore";
import { Button } from "@mui/material";

const Mesa: React.FC<MesaProps> = ({ salaId, onSelectMesa }) => {

  const {
    selectedMesa,
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
    setSelectedMesa,
  } = useMesa(salaId);

  const [mesasFiltradas, setMesasFiltradas] = useState<TableCreated[]>([]);

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
    console.log("⭕️selectedMesa", selectedMesa);

  }, [selectedMesa]);

  useEffect(() => {
    if (selectedMesa) {
      setForm({
        id: selectedMesa.id,
        name: selectedMesa.name,
        number: selectedMesa.number,
        coment: selectedMesa.coment,
      });
    }
  }, [selectedMesa]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column"
      }}
    >
      <Button
        variant="contained"
        color="primary"
        sx={{ marginRight: 2, width: '30%', height: '50px', my: 2 }}
        onClick={() => handleOpenModal("create")}
      >
        + Agregar mesa
      </Button>
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "27px",
      }}>
        {mesasFiltradas.map((mesa) => (
          <MesaCard
            key={mesa.id}
            mesa={mesa}
            setSelectedMesa={(mesaSeleccionada) => {
              setSelectedMesa(mesaSeleccionada); // Actualiza el estado interno
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
            } else if (modalType === "edit" && selectedMesa?.id) {
              handleEdit(selectedMesa.id, dataToSend);
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
