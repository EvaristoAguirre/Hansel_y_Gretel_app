import { createProduct, fetchProducts, getProductsByCategory } from "@/api/products";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useProductStore } from "./useProductStore";
import { URI_PRODUCT } from "../URI/URI";
import { editProduct } from "../../api/products";
import { ProductForm } from "../Interfaces/IProducts";
import { useAuth } from "@/app/context/authContext";
import { FormTypeProduct, TypeProduct } from "../Enums/view-products";

export const useProducts = () => {
  const { getAccessToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const {
    products,
    setProducts,
    removeProduct,
    updateProduct,
    connectWebSocket,
  } = useProductStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<FormTypeProduct>(FormTypeProduct.CREATE);
  const [loading, setLoading] = useState<boolean>(true);
  const [form, setForm] = useState<ProductForm>({
    id: "",
    code: null,
    name: "",
    description: "",
    type: TypeProduct.PRODUCT,
    price: null,
    cost: null,
    categories: [],
    ingredients: [],
    products: [],
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
  }, []);

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

  const handleCreateProduct = async (token: string) => {
    const preparedForm = {
      ...form,
      code: parseInt(form.code as any, 10),
      price: parseFloat(form.price as any),
      cost: parseFloat(form.cost as any),
    };
    if (form.ingredients.length === 0) {
      delete (preparedForm as any).ingredients;
      delete (preparedForm as any).isActive;
    }
    try {
      if (!token) throw new Error("Token no disponible");
      const newProduct = await createProduct(preparedForm, token);
      // addProduct(newProduct);
      handleCloseModal();

      Swal.fire("Éxito", "Producto creado correctamente.", "success");

    } catch (error) {
      Swal.fire("Error", "No se pudo crear el producto.", "error");
      console.error(error);
    }
  };

  const handleEdit = async (token: string, selectedCategoryId?: string) => {
    try {
      if (!token) throw new Error("Token no disponible");

      const preparedForm = {
        ...form,
        code: Number(form.code),
        price: Number(form.price),
        cost: Number(form.cost),
        id: form.id,
      };

      const updatedProduct = await editProduct(preparedForm, token);

      updateProduct(updatedProduct);

      Swal.fire("Éxito", "Producto editado correctamente.", "success");

      if (selectedCategoryId) {
        const data = await getProductsByCategory(selectedCategoryId, token);
        setProducts(data);
      }
      handleCloseModal();
    } catch (error: any) {
      Swal.fire("Error", error.message || "No se pudo editar el producto.", "error");
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
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
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
      type: TypeProduct.PRODUCT,
      price: null,
      cost: null,
      categories: [],
      ingredients: [],
      products: [],
      isActive: true,
    });
  };

  return {
    loading,
    setLoading,
    modalOpen,
    modalType,
    form,
    products,
    setModalOpen,
    setModalType,
    setForm,
    handleCreateProduct,
    handleEdit,
    handleDelete,
    handleCloseModal,
    fetchAndSetProducts,
    connectWebSocket,
  };
};
