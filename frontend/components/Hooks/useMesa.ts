import { useEffect, useState } from "react";
import { MesaInterface } from "../Interfaces/Cafe_interfaces";
import { TableState } from "../Enums/Enums";
import { URI_TABLE } from "../URI/URI";
import Swal from "sweetalert2";
import { MesaForm } from "../Interfaces/Cafe_interfaces";
import { useTableStore } from "../Mesa/useTableStore";
import { useOrderStore } from "../Pedido/useOrderStore";

export const useMesa = (salaId: string) => {
  const [selectedMesa, setSelectedMesa] = useState<MesaInterface | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "edit">("create");

  const [form, setForm] = useState<MesaForm>({
    id: "",
    name: "",
    number: 0,
    coment: "",
    // state: TableState.AVAILABLE,
  });

  const {
    tables,
    setTables,
    addTable,
    removeTable,
    updateTable,
    connectWebSocket,
  } = useTableStore();

  const { orders } = useOrderStore();
  const handleOpenModal = (type: "create" | "edit", mesa?: MesaInterface) => {
    setModalType(type);
    if (type === "edit" && mesa) {
      setForm({
        id: mesa.id,
        name: mesa.name,
        number: mesa.number,
        coment: mesa.coment,
        // state: mesa.state,
      });
    } else {
      setForm({
        id: "",
        name: "",
        number: 0,
        coment: "",
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setForm({
      name: "",
      number: 0,
      coment: "",
      // state: TableState.AVAILABLE,
    });
    setModalOpen(false);
  };

  useEffect(() => {
    async function fetchTables() {
      try {
        const response = await fetch(URI_TABLE, { method: "GET" });
        const data = await response.json();
        setTables(data);
      } catch (error) {
        Swal.fire("Error", "No se pudieron cargar las mesas.", "error");
        console.error(error);
      }
    }

    fetchTables();
    connectWebSocket();
  }, [setTables, connectWebSocket, orders]);

  const handleCreate = async (mesaData: MesaForm) => {
    try {
      const response = await fetch(URI_TABLE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, roomId: salaId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error:", errorData);
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const newTable = await response.json();
      addTable(newTable);

      Swal.fire("Éxito", "Mesa creada correctamente.", "success");

      handleCloseModal();
    } catch (error) {
      Swal.fire("Error", "No se pudo crear la mesa.", "error");
    }
  };

  const handleEdit = async (id: string, data: MesaForm) => {
    console.log("🛠 handleEdit id:", id);  // Verifica si llega el id
    console.log("🛠 handleEdit data:", data);
    if (!id) {
      Swal.fire("Error", "ID de la mesa no válido.", "error");
      return;
    }
    try {
      const response = await fetch(`${URI_TABLE}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error:", errorData);
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const updatedTable = await response.json();
      updateTable(updatedTable);
      Swal.fire("Éxito", "Mesa actualizada correctamente.", "success");
      handleCloseModal();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo actualizar la mesa.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed) {
      try {
        await fetch(`${URI_TABLE}/${id}`, { method: "DELETE" });
        removeTable(id);
        setSelectedMesa(null);
        Swal.fire("Eliminado", "Mesa eliminada correctamente.", "success");
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar la mesa.", "error");
        console.error(error);
      }
    }
  };

  return {
    tables,
    selectedMesa,
    modalOpen,
    modalType,
    form,
    setForm,
    handleOpenModal,
    handleCloseModal,
    handleCreate,
    handleEdit,
    setSelectedMesa,
    handleDelete,
  };
};

export default useMesa;
