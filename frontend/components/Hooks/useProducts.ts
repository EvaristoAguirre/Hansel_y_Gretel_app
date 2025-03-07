import { createProduct, fetchProducts } from "@/api/products";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useProductStore } from "./useProductStore";
import { URI_PRODUCT } from "../URI/URI";
import { editProduct } from '../../api/products';
import { ProductForm } from '../Interfaces/IProducts';
import { useAuth } from "@/app/context/authContext";

export const useProductos = () => {
  const { getAccessToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const { products, setProducts, addProduct, removeProduct, updateProduct, connectWebSocket } = useProductStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "edit">("create");
  const [loading, setLoading] = useState<boolean>(true);
  const [form, setForm] = useState<ProductForm>({
    id: "",
    code: null,
    name: "",
    description: "",
    price: null,
    cost: null,
    categories: [],
    ingredients: [],
    isActive: true,
  });

  // Llamada inicial para cargar productos
  useEffect(() => {
    const getToken = getAccessToken();
    if (!token) return;
    setToken(getToken);
    if (token) {
      fetchAndSetProducts(token);
    }
  }, [token]);

  const fetchAndSetProducts = async (token: string) => {
    setLoading(true);

    try {
      if (!token) return;
      const fetchedProducts = await fetchProducts("1", "50", token);

      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Error al cargar los productos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (token: string) => {

    try {
      const preparedForm = {
        ...form,
        code: parseInt(form.code as any, 10),
        price: parseFloat(form.price as any),
        cost: parseFloat(form.cost as any),
      };

      const newProduct = await createProduct(preparedForm, token);

      addProduct(newProduct);
      handleCloseModal();

      Swal.fire("Éxito", "Producto creado correctamente.", "success");

    } catch (error) {
      Swal.fire("Error", "No se pudo crear el producto.", "error");
      console.error(error);
    }
  };

  const handleEdit = async (token: string) => {
    try {
      const preparedForm = {
        ...form,
        code: parseInt(form.code as any, 10),
        price: parseFloat(form.price as any),
        cost: parseFloat(form.cost as any),
        id: form.id,
      };

      const updatedProduct = await editProduct(preparedForm, token);

      updateProduct(updatedProduct);

      Swal.fire("Éxito", "Producto editado correctamente.", "success");

      handleCloseModal();

    } catch (error) {
      Swal.fire("Error", "No se pudo editar el producto.", "error");
      console.error(error);
    }
  };


  const handleDelete = async (id: string, token: string) => {
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
        await fetch(`${URI_PRODUCT}/${id}`, {
          method: "DELETE",
          headers: {
            'Content-Type': 'application/json',
            "Authorization": `Bearer ${token}`,
          }
        });
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
      code: null,
      name: "",
      description: "",
      price: null,
      cost: null,
      categories: [],
      ingredients: [],
      isActive: true,
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
    fetchAndSetProducts,
    connectWebSocket,
  };
};
