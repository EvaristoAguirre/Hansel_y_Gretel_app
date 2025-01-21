import { useState } from "react";
import { useProductStore } from "../Producto/useProductStore";

export const useProductos = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "edit">("create");
  const [form, setForm] = useState({
    id: "",
    code: 0,
    name: "",
    description: "",
    price: 0,
    cost: 0,
    inActive: true,
  });

  // Estado global desde el store
  const { products, addProduct, removeProduct, updateProduct, connectWebSocket } = useProductStore();

  // Métodos CRUD conectados al store
  const handleCreate = () => {
    if (!form.name || !form.code || !form.price || !form.cost) {
      alert("Por favor, completa todos los campos.");
      return;
    }
    const newProduct = { ...form, id: crypto.randomUUID(),
      price: form.price ?? 0, 
    cost: form.cost ?? 0,
    inActive: form.inActive, };
    addProduct(newProduct); // Usamos el método del store
    setModalOpen(false);
  };

  const handleEdit = () => {
    if (!form.name || !form.code || !form.price || !form.cost) {
      alert("Por favor, completa todos los campos.");
      return;
    }
    updateProduct(form); // Usamos el método del store
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      removeProduct(id); // Usamos el método del store
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setForm({
      id: "",
      code: 0,
      name: "",
      description: "",
      price: 0,
      cost: 0,
      inActive: true,
    });
  };

  return {
    loading: false, // Si usas un loader para el WebSocket, actualízalo aquí
    modalOpen,
    modalType,
    form,
    products, // Productos desde el estado global
    setModalOpen,
    setModalType,
    setForm,
    handleCreate,
    handleEdit,
    handleDelete,
    handleCloseModal,
    connectWebSocket, // Para inicializar el WebSocket cuando sea necesario
  };
};
