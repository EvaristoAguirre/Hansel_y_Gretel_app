import { useEffect, useState } from "react";
import { URI_ORDER } from "../URI/URI";
import { useOrderStore } from "../Order/useOrderStore";
import Swal from "sweetalert2";
import { useProductStore } from "./useProductStore";
import { useAuth } from "@/app/context/authContext";

const useOrder = () => {
  const {
    orders,
    setOrders,
    connectWebSocket,
  } = useOrderStore();
  const { getAccessToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [productosDisponibles, setProductosDisponibles] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const { products } = useProductStore();

  useEffect(() => {
    setProductosDisponibles(products);
  }, [products]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    setToken(token);
  }, [getAccessToken]);

  // token se agrega a las deps para que el fetch se dispare cuando el token
  // esté disponible (al mount token es null, el efecto correría sin token).
  useEffect(() => {
    connectWebSocket();

    if (!token) {
      // Sin token aún: no hay nada que cargar, quitar el spinner.
      setIsLoadingOrders(false);
      return;
    }

    async function fetchOrders() {
      setIsLoadingOrders(true);
      try {
        const response = await fetch(`${URI_ORDER}/active`, {
          method: "GET",
          headers: { "Authorization": `Bearer ${token}` },
        });
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        Swal.fire("Error", "No se pudieron cargar los pedidos.", "error");
        console.error(error);
      } finally {
        setIsLoadingOrders(false);
      }
    }

    fetchOrders();
  }, [token, setOrders, connectWebSocket]);

  return {
    orders,
    orderId,
    productosDisponibles,
    isLoadingOrders,
    products,
    setOrderId,
    setProductosDisponibles,
  };
};

export default useOrder;
