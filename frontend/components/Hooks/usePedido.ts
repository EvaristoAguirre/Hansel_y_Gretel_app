import React, { useEffect, useState } from "react";
import { URI_ORDER, URI_ORDER_OPEN } from "../URI/URI";
import { OrderCreated, useOrderStore } from "../Pedido/useOrderStore";
import Swal from "sweetalert2";
import { ICreacionPedido } from "../Interfaces/Pedido_interfaces";
import { MesaInterface } from "../Interfaces/Cafe_interfaces";

const usePedido = () => {
  const {
    orders,
    setOrders,
    addOrder,
    removeOrder,
    updateOrder,
    connectWebSocket,
  } = useOrderStore();

  const [pedidoForm, setPedidoForm] = useState<ICreacionPedido>({
    tableId: "",
    numberCustomers: 0,
    comment: "",
    productsDetails: [],
  });

  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch(`${URI_ORDER}/active`, { method: "GET" });
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        Swal.fire("Error", "No se pudieron cargar los pedidos.", "error");
        console.error(error);
      }
    }

    fetchOrders();
    connectWebSocket();
  }, [setOrders, connectWebSocket]);

  async function fetchOrderById(id?: string | null) {
    if (orderId) {
      try {
        const response = await fetch(`${URI_ORDER}/${orderId}`, {
          method: "GET",
        });
        const data = await response.json();
        setPedidoForm(data);
      } catch (error) {
        console.error("Error al obtener el pedido:", error);
      }
    } else if (id) {
      try {
        const response = await fetch(`${URI_ORDER}/${id}`, {
          method: "GET",
        });
        const data = await response.json();
        console.log(data);
        setPedidoForm(data);
      } catch (error) {
        console.error("Error al obtener el pedido:", error);
      }
    }
  }

  const handleCreateOrder = async (
    mesa: MesaInterface,
    cantidadPersonas: number,
    comentario: string
  ) => {
    try {
      const pedido = {
        tableId: mesa.id,
        numberCustomers: cantidadPersonas,
        comment: comentario,
        productsDetails: [],
      };

      const response = await fetch(URI_ORDER_OPEN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pedido),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error:", errorData);
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const newOrder = await response.json();
      addOrder(newOrder);
      mesa.orderId = newOrder.id;

      Swal.fire("Éxito", "Mesa abierta correctamente.", "success");
    } catch (error) {
      Swal.fire("Error", "No se pudo abrir la mesa.", "error");
    }
  };

  const handleEditOrder = async (id: string) => {
    if (!id) {
      Swal.fire("Error", "ID del pedido no válido.", "error");
      return;
    }
    try {
      const response = await fetch(`${URI_ORDER}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error:", errorData);
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const updatedOrder = await response.json();
      updateOrder(updatedOrder);
      Swal.fire("Éxito", "Pedido actualizado correctamente.", "success");
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo actualizar el pedido.", "error");
    }
  };

  const handleDeleteOrder = async (id: string) => {
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
        await fetch(`${URI_ORDER}/${id}`, { method: "DELETE" });
        removeOrder(id);
        Swal.fire("Eliminado", "Pedido eliminado correctamente.", "success");
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar el pedido.", "error");
        console.error(error);
      }
    }
  };

  return {
    orders,
    orderId,
    pedidoForm,
    setOrderId,
    handleCreateOrder,
    handleEditOrder,
    handleDeleteOrder,
    fetchOrderById,
  };
};

export default usePedido;
