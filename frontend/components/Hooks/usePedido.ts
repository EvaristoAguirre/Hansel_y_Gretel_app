import React, { useEffect, useState } from "react";
import { URI_ORDER, URI_ORDER_OPEN } from "../URI/URI";
import { OrderCreated, useOrderStore } from "../Pedido/useOrderStore";
import Swal from "sweetalert2";
import { ICreacionPedido } from "../Interfaces/Pedido_interfaces";
import { MesaInterface } from "../Interfaces/Cafe_interfaces";
import { useProductStore } from "./useProductStore";
import useMesa from "./useMesa";
import { TableCreated, useTableStore } from "../Mesa/useTableStore";
import Sala from "../Salas/Sala";

const usePedido = () => {
  const {
    orders,
    setOrders,
    addOrder,
    removeOrder,
    updateOrder,
    connectWebSocket,
  } = useOrderStore();

  const { tables, updateTable } = useTableStore();


  const [pedidoForm, setPedidoForm] = useState<ICreacionPedido>({
    tableId: "",
    numberCustomers: 0,
    comment: "",
    productsDetails: [],
  });

  const [orderId, setOrderId] = useState<string | null>(null);

  const [mostrarEditorPedido, setMostrarEditorPedido] = useState(false);
  const [selectedMesa, setSelectedMesa] = useState<MesaInterface | null>(null);
  const [productosDisponibles, setProductosDisponibles] = useState<any[]>([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState<any[]>(
    []
  );
  const { products } = useProductStore();

  // const handleVerPedido = () => {
  //   setMostrarEditorPedido(true);
  // };

  useEffect(() => {
    setProductosDisponibles(products); // Sincronizar productos disponibles
  }, [products]);

  // Manejar selección de productos
  const handleSeleccionarProducto = (producto: any) => {
    const productoExistente = productosSeleccionados.find(
      (p) => p.id === producto.id
    );

    if (productoExistente) {
      // Incrementar la cantidad si ya existe
      productoExistente.cantidad += 1;
      setProductosSeleccionados([...productosSeleccionados]);
    } else {
      // Agregar nuevo producto al pedido
      setProductosSeleccionados([
        ...productosSeleccionados,
        { ...producto, cantidad: 1 },
      ]);
    }
  };

  // Agregar productos al pedido
  const handleAgregarProductosAlPedido = () => {
    if (!selectedMesa) {
      Swal.fire(
        "Error",
        "Por favor, selecciona una mesa antes de agregar productos al pedido.",
        "error"
      );
      return;
    }

    const mesaActualizada = {
      ...selectedMesa,
      // pedido: [...(selectedMesa.pedido || []), ...productosSeleccionados],
    };

    Swal.fire(
      "Pedido Actualizado",
      `${productosSeleccionados.length} producto(s) añadido(s) al pedido.`,
      "success"
    );
    setProductosSeleccionados([]);
    setMostrarEditorPedido(false);
  };

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
    comentario: string,
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
      
      const mesaActualizada = tables.find((table) => table.id === mesa.id);
      if (mesaActualizada) {
        mesaActualizada.orders.push(newOrder);
        updateTable(mesaActualizada);
      }
      
      addOrder(newOrder);

      
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
    selectedMesa,
    productosDisponibles,
    productosSeleccionados,
    products,
    setOrderId,
    handleCreateOrder,
    handleEditOrder,
    handleDeleteOrder,
    fetchOrderById,
    setProductosDisponibles,
    setProductosSeleccionados,
    setMostrarEditorPedido,
    removeOrder,
    handleSeleccionarProducto,
    handleAgregarProductosAlPedido,
  };
};

export default usePedido;
