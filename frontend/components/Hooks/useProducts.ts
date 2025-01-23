import { createProduct, fetchProducts } from "@/helpers/products";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useProductStore } from "./useProductStore";
import { URI_PRODUCT } from "../URI/URI";
import { editProduct } from '../../helpers/products';

export const useProductos = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "edit">("create");
  const [loading, setLoading] = useState<boolean>(true);
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
  const { products, setProducts, addProduct, removeProduct, updateProduct, connectWebSocket } = useProductStore();

 // Llamada inicial para cargar productos
useEffect(() => {
  const fetchAndSetProducts = async () => {
    setLoading(true);
    try {
      const fetchedProducts = await fetchProducts(); 
      setProducts(fetchedProducts); 
    } catch (error) {
      console.error("Error al cargar los productos:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchAndSetProducts();
}, [connectWebSocket]);
  const handleCreate = async () => {
    
    try {
      const preparedForm = {
        ...form,
        code: parseInt(form.code as any, 10),
        price: parseFloat(form.price as any),
        cost: parseFloat(form.cost as any),        
      };

      const newProduct = await createProduct(preparedForm); 

      addProduct(newProduct);

      Swal.fire("Éxito", "Producto creado correctamente.", "success");

      handleCloseModal(); 
    } catch (error) {
      Swal.fire("Error", "No se pudo crear el producto.", "error");
      console.error(error);
    }
  };

  const handleEdit = async () => {
    try {
      const preparedForm = {
        ...form,
        code: parseInt(form.code as any, 10), 
        price: parseFloat(form.price as any),
        cost: parseFloat(form.cost as any),   
        id: form.id,
      };
      const updatedProduct = await editProduct(preparedForm); 
      updateProduct(updatedProduct);
  
      Swal.fire("Éxito", "Producto editado correctamente.", "success");
  
      handleCloseModal(); 

    } catch (error) {
      Swal.fire("Error", "No se pudo editar el producto.", "error");
      console.error(error);
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
        await fetch(`${URI_PRODUCT}/${id}`, { method: "DELETE" });
        removeProduct(id);
        Swal.fire("Eliminado", "Producto eliminado correctamente.", "success");
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar el producto.", "error");
        console.error(error);
      }
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
    loading,
    modalOpen,
    modalType,
    form,
    products,
    setModalOpen,
    setModalType,
    setForm,
    handleCreate,
    handleEdit,
    handleDelete,
    handleCloseModal,
    fetchProducts,
    connectWebSocket,
  };
};
