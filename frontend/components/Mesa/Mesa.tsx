import React, { useState } from "react";
import { MesaInterface, MesaProps } from "../Interfaces/Cafe_interfaces";
import MesaDatos from "./MesaDatos";
import useMesa from "../Hooks/useMesa";
import MesaCard from "./MesaCard";
import MesaModal from "./MesaModal";

const Mesa: React.FC<MesaProps> = ({ mesas, salaId }) => {
  // Manejar selección de mesa
  // const handleSeleccionarMesa = (mesa: MesaInterface) => {
  //   setSelectedMesa(mesa);
  //   setMesaDatos(true);
  //   // setMostrarEditorPedido(false);
  // };

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

 

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        padding: "20px",
      }}
    >
      {mesas.map((mesa) => (
        <MesaCard
          key={mesa.id}
          mesa={mesa}
          setSelectedMesa={setSelectedMesa}
          handleOpenModal={handleOpenModal}
          handleDelete={handleDelete}
        />
      ))}
      <div
        style={{
          width: "14rem",
          height: "5rem",
          backgroundColor: "#e0e0e0",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
        }}
        onClick={() => handleOpenModal("create")}
      >
        <h3 style={{ fontSize: "1rem" }}>Agregar mesa</h3>
      </div>
      <MesaModal
        open={modalOpen}
        type={modalType}
        form={form}
        onClose={handleCloseModal}
        onSave={
          modalType === "create"
            ? handleCreate
            : () => handleEdit(selectedMesa?.id!)
        }
        onChange={(field, value) =>
          setForm((prev) => ({
            ...prev,
            [field]: field === "number" ? Number(value) : value,
          }))
        }
      />
    </div>
  );
};

export default Mesa;
