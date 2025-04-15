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
  const { products } = useProductStore();

  useEffect(() => {
    setProductosDisponibles(products);
  }, [products]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    setToken(token);
  }, [getAccessToken]);


  useEffect(() => {
    async function fetchOrders(token: string) {
      try {
        const response = await fetch(`${URI_ORDER}/active`, {
          method: "GET",
          headers: { "Authorization": `Bearer ${token}`, },
        });
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        Swal.fire("Error", "No se pudieron cargar los pedidos.", "error");
        console.error(error);
      }
    }
    if (token) {
      fetchOrders(token);
    }
    connectWebSocket();
  }, [setOrders, connectWebSocket]);

  return {
    orders,
    orderId,
    productosDisponibles,
    products,
    setOrderId,
    setProductosDisponibles,
  };
};

export default useOrder;
