import { useEffect, useState } from "react";
import { MesaInterface } from "../Interfaces/Cafe_interfaces";
import { URI_TABLE } from "../URI/URI";
import Swal from "sweetalert2";
import { useTableStore } from "../Table/useTableStore";
import { useOrderStore } from "../Order/useOrderStore";
import { editTable } from "@/api/tables";
import { useAuth } from "@/app/context/authContext";
import { TableForm } from "../Interfaces/ITable";
import { TableModalType } from "../Enums/table";

const useMesa = (salaId: string, setNameTable: (name: string) => void) => {
  const { getAccessToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [selectedMesa, setSelectedMesa] = useState<MesaInterface | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<TableModalType>(TableModalType.CREATE);
  const [form, setForm] = useState<TableForm>({
    name: ""
  });

  const {
    tables,
    setTables,
    removeTable,
    updateTable,
    connectWebSocket,
  } = useTableStore();

  const { orders } = useOrderStore();
  const handleOpenModal = (type: TableModalType, mesa?: MesaInterface) => {
    setModalType(type);
    if (type === TableModalType.EDIT && mesa) {
      setForm({
        id: mesa.id,
        name: mesa.name,
      });
      setNameTable(mesa.name);
    } else {
      setForm({
        id: "",
        name: "",
      });
      setNameTable("")
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setForm({
      name: "",
    });
    setModalOpen(false);
    setNameTable("")
  };

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      setToken(token);
    }
    async function fetchTables() {
      try {
        const response = await fetch(URI_TABLE, {
          method: "GET",
          headers: { "Authorization": `Bearer ${token}`, },
        });
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

  const handleCreateTable = async (name: string, roomId: string) => {
    try {
      const response = await fetch(URI_TABLE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({ name, roomId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        handleCloseModal();
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      Swal.fire("Éxito", "Mesa creada correctamente.", "success");
      handleCloseModal();
    } catch (error) {
      Swal.fire("Error", "No se pudo crear la mesa.", "error");
    }
  };

  const handleEdit = async (data: TableForm) => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const response = await editTable(data, token);

      if (!response.ok) {
        handleCloseModal();
      } else {
        updateTable(response);
        Swal.fire("Éxito", "Mesa actualizada correctamente.", "success");
        handleCloseModal();
      }

    } catch (error) {
      if (error instanceof Error && error.message.includes('Next.js')) {
        console.error(error);
      } else {
        Swal.fire("Error", "No se pudo actualizar la mesa.", "error");
      }
      handleCloseModal();
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
        await fetch(`${URI_TABLE}/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getAccessToken()}`,
          }
        });
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
    handleCreateTable,
    handleEdit,
    setSelectedMesa,
    handleDelete,
  };
};

export default useMesa;
