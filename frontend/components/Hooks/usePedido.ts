import React, { useEffect, useState } from "react";
import { URI_ORDER, URI_ORDER_OPEN } from "../URI/URI";
import { useOrderStore } from "../Order/useOrderStore";
import Swal from "sweetalert2";
import { ICreacionPedido } from "../Interfaces/Pedido_interfaces";
import { MesaInterface } from "../Interfaces/Cafe_interfaces";
import { useProductStore } from "./useProductStore";
import { useTableStore } from "../Table/useTableStore";
import { IOrderDetails } from "../Interfaces/IOrderDetails";
import { SelectedProductsI } from '../Interfaces/IProducts';
import { useOrderContext } from '../../app/context/order.context';
import { useAuth } from "@/app/context/authContext";

const usePedido = () => {
  const {
    orders,
    setOrders,
    addOrder,
    removeOrder,
    updateOrder,
    connectWebSocket,
  } = useOrderStore();
  const { getAccessToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const { tables, updateTable } = useTableStore();

  const { selectedProducts, confirmedProducts } = useOrderContext();

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
  const [orderDetails, setOrderDetails] = useState<{
    productId: string;
    quantity: number;
  } | null>(null);
  // const [productsDetails, setProductsDetails] = useState<ProductDetailsI[]>([]);
  // const [selectedProducts, setSelectedProducts] = React.useState<SelectedProductsI[]>([]);

  // // TODO: Productos que ya fueron confirmados. En "selectedProducts" deben estar los mismos para permitir navegar al Paso 3
  // const [confirmedProducts, setConfirmedProducts] = useState<SelectedProductsI[]>([]);

  // TODO: ¿Para qué este estado?
  // const [productsDetailsExistente, setProductsDetailsExistente] =
  //   useState<{ productId: string; quantity: number }[]>();

  const { products } = useProductStore();

  useEffect(() => {
    setProductosDisponibles(products); // Sincronizar productos disponibles
  }, [products]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    setToken(token);
  }, [getAccessToken]);

  // const handleSeleccionarProducto = (producto: any) => {
  //   const foundProduct = productsDetails.find(
  //     (p) => p.productId === producto.id
  //   );

  //   if (foundProduct) {
  //     const updatedDetails = productsDetails.map((p) =>
  //       p.productId === producto.id ? { ...p, quantity: p.quantity + 1 } : p
  //     );
  //     setProductsDetails(updatedDetails);
  //     setProductsDetailsExistente([{
  //       productId: producto.id,
  //       quantity: foundProduct.quantity + 1,
  //     }]);
  //   }
  //   else {
  //     const newProduct = {
  //       productId: producto.id,
  //       quantity: 1,
  //       price: producto.price,
  //       name: producto.name,
  //     };
  //     setProductsDetails([...productsDetails, newProduct]);
  //     setProductsDetailsExistente([{
  //       productId: producto.id,
  //       quantity: 1,
  //     }]);
  //   }

  //   // También actualizamos el producto seleccionado individualmente
  //   setOrderDetails({
  //     productId: producto.id,
  //     quantity: foundProduct ? foundProduct.quantity + 1 : 1,
  //   });
  // };

  // Agregar productos al pedido
  // const handleAgregarProductosAlPedido = () => {
  //   if (!selectedMesa) {
  //     Swal.fire(
  //       "Error",
  //       "Por favor, selecciona una mesa antes de agregar productos al pedido.",
  //       "error"
  //     );
  //     return;
  //   }

  //   const mesaActualizada = {
  //     ...selectedMesa,
  //     // pedido: [...(selectedMesa.pedido || []), ...productosSeleccionados],
  //   };

  //   Swal.fire(
  //     "Pedido Actualizado",
  //     `${productosSeleccionados.length} producto(s) añadido(s) al pedido.`,
  //     "success"
  //   );
  //   setProductosSeleccionados([]);
  //   setMostrarEditorPedido(false);
  // };

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

  // async function fetchOrderById(id?: string | null) {
  //   if (orderId) {
  //     try {
  //       const response = await fetch(`${URI_ORDER}/${orderId}`, {
  //         method: "GET",
  //       });
  //       const data = await response.json();
  //       setPedidoForm(data);
  //     } catch (error) {
  //       console.error("Error al obtener el pedido:", error);
  //     }
  //   } else if (id) {
  //     try {
  //       const response = await fetch(`${URI_ORDER}/${id}`, {
  //         method: "GET",
  //       });
  //       const data = await response.json();
  //       console.log(data);
  //       setPedidoForm(data);
  //     } catch (error) {
  //       console.error("Error al obtener el pedido:", error);
  //     }
  //   }
  // }

  // const handleCreateOrder = async (
  //   mesa: MesaInterface,
  //   cantidadPersonas: number,
  //   comentario: string
  // ) => {
  //   try {
  //     const pedido = {
  //       tableId: mesa.id,
  //       numberCustomers: cantidadPersonas,
  //       comment: comentario,
  //       productsDetails: [],
  //     };

  //     const response = await fetch(URI_ORDER_OPEN, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(pedido),
  //     });

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       console.error("Error:", errorData);
  //       throw new Error(`Error: ${response.status} ${response.statusText}`);
  //     }

  //     const newOrder = await response.json();

  // const mesaActualizada = tables.find((table) => table.id === mesa.id);
  // if (mesaActualizada) {
  //   mesaActualizada.orders.push(newOrder);
  //   console.log({ mesaActualizada });
  //   updateTable(mesaActualizada);
  // }

  //     addOrder(newOrder);

  //     Swal.fire("Éxito", "Mesa abierta correctamente.", "success");
  //   } catch (error) {
  //     Swal.fire("Error", "No se pudo abrir la mesa.", "error");
  //   }
  // };

  // const handleEditOrder = async (id: string) => {
  //   console.group("Editar Order")
  //   console.log("entra en editar order");

  //   // console.log("Productos existentes-->", productsDetailsExistente);
  //   console.log("Productos para la orden-->", confirmedProducts);

  //   if (!id) {
  //     Swal.fire("Error", "ID del pedido no válido.", "error");
  //     return;
  //   }
  //   try {
  //     const response = await fetch(`${URI_ORDER}/update/${id}`, {
  //       method: "PATCH",
  //       headers: { "Content-Type": "application/json" },
  //       // body: JSON.stringify([...productsDetails, ...(productsDetailsExistente || [])]),
  //       body: JSON.stringify({ productsDetails: [...selectedProducts] }),
  //       // body: JSON.stringify([...productsDetails]),
  //       // body: JSON.stringify({productsDetails:[...productsDetails]}),
  //     });

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       console.error("Error:", errorData);
  //       throw new Error(`Error: ${response.status} ${response.statusText}`);
  //     }

  //     // setConfirmedProducts(confirmedProducts);
  //     const updatedOrder = await response.json();
  //     updateOrder(updatedOrder);
  //     console.log("Pedido actualizado:", updatedOrder);

  //     // Swal.fire("Éxito", "Pedido actualizado correctamente.", "success");
  //   } catch (error) {
  //     console.error(error);
  //     // Swal.fire("Error", "No se pudo actualizar el pedido.", "error");
  //   }

  //   console.groupEnd()
  // };

  // const handleDeleteOrder = async (id: string) => {
  //   const confirm = await Swal.fire({
  //     title: "¿Estás seguro?",
  //     text: "Esta acción no se puede deshacer.",
  //     icon: "warning",
  //     showCancelButton: true,
  //     confirmButtonText: "Sí, eliminar",
  //     cancelButtonText: "Cancelar",
  //   });

  //   if (confirm.isConfirmed) {
  //     try {
  //       await fetch(`${URI_ORDER}/${id}`, { method: "DELETE" });
  //       removeOrder(id);
  //       Swal.fire("Eliminado", "Pedido eliminado correctamente.", "success");
  //     } catch (error) {
  //       Swal.fire("Error", "No se pudo eliminar el pedido.", "error");
  //       console.error(error);
  //     }
  //   }
  // };

  return {
    orders,
    orderId,
    pedidoForm,
    selectedMesa,
    productosDisponibles,
    // selectedProducts,
    // confirmedProducts,
    products,
    setOrderId,
    // handleCreateOrder,
    // handleEditOrder,
    // handleDeleteOrder,
    // fetchOrderById,
    setProductosDisponibles,
    // setSelectedProducts,
    // setConfirmedProducts,
    setMostrarEditorPedido,
    // removeOrder,
    // handleSeleccionarProducto,
    // handleAgregarProductosAlPedido,
  };
};

export default usePedido;
