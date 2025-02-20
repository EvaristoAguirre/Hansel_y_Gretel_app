'use client';
import { MesaInterface } from "@/components/Interfaces/Cafe_interfaces";
import { URI_ORDER, URI_ORDER_OPEN } from "@/components/URI/URI";
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Swal from "sweetalert2";
import { ProductResponse, SelectedProductsI } from '../../components/Interfaces/IProducts';
import { OrderCreated, useOrderStore } from '../../components/Pedido/useOrderStore';
import { useRoomContext } from './room.context';

type OrderContextType = {
  selectedProducts: SelectedProductsI[];
  confirmedProducts: SelectedProductsI[];
  selectedOrderByTable: OrderCreated | null;
  setSelectedOrderByTable: (order: OrderCreated | null) => void;
  handleSelectedProducts: (product: ProductResponse) => void;
  handleDeleteSelectedProduct: (productId: string) => void;
  increaseProductNumber: (productId: string) => void;
  decreaseProductNumber: (productId: string) => void;
  clearSelectedProducts: () => void;
  deleteConfirmProduct: (productId: string) => void;
  handleCreateOrder: (mesa: MesaInterface, cantidadPersonas: number, comentario: string) => Promise<void>;
  handleEditOrder: (id: string, selectedProducts: SelectedProductsI[], numberCustomers: number, comment: string) => Promise<void>
  handleDeleteOrder: (orderId: string | null) => Promise<void>;
  handleResetSelectedOrder: () => void;

}

const OrderContext = createContext<OrderContextType>({
  selectedProducts: [],
  confirmedProducts: [],
  selectedOrderByTable: null,
  setSelectedOrderByTable: () => { },
  handleSelectedProducts: () => { },
  handleDeleteSelectedProduct: () => { },
  increaseProductNumber: () => { },
  decreaseProductNumber: () => { },
  clearSelectedProducts: () => { },
  deleteConfirmProduct: () => { },
  handleCreateOrder: async () => { },
  handleEditOrder: async () => { },
  handleDeleteOrder: async () => { },
  handleResetSelectedOrder: () => { },

});

export const useOrderContext = () => {
  const context = useContext(OrderContext);
  return context;
};

const OrderProvider = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  const { addOrder, updateOrder, removeOrder } = useOrderStore();
  const { selectedMesa, selectedSala, handleSelectMesa } = useRoomContext();
  const [selectedProducts, setSelectedProducts] = useState<SelectedProductsI[]>([]);
  const [confirmedProducts, setConfirmedProducts] = useState<SelectedProductsI[]>([]);

  const [selectedOrderByTable, setSelectedOrderByTable] = useState<OrderCreated | null>(null);

  /**
   * Al cambiar la Mesa o la Sala seleccionada se limpia
   *  la información de la mesa saliente mediante `handleResetSelectedOrder`.
   */
  useEffect(() => {
    handleResetSelectedOrder();
  }, [selectedMesa, selectedSala]);

  const handleResetSelectedOrder = () => {
    setSelectedProducts([]);
    setConfirmedProducts([]);
    setSelectedOrderByTable(null);
  };

  const fetchOrderBySelectedTable = useCallback(async () => {
    if (selectedMesa?.state === 'available') {
      return setSelectedOrderByTable(null);
    }
    if (selectedMesa?.state === 'open' && selectedMesa.orders) {
      try {
        if (selectedMesa?.orders && selectedMesa?.orders.length > 0) {
          const response = await fetch(`${URI_ORDER}/${selectedMesa.orders[0]}`, {
            method: "GET",
          });
          const data = await response.json();

          setSelectedOrderByTable(data);

          console.group("FETCH ORDER BY SELECTED TABLE");
          console.log("🦋Selected order by table:", setSelectedOrderByTable);

          handleSetProductsByOrder(data.orderDetails); // TODO: ESPERANDO CAMBIOS DE EVA

          console.groupEnd();

        } else {
          setSelectedOrderByTable(null);
        }
      } catch (error) {
        console.error("Error al obtener el pedido:", error);
      }
    }
  }, [selectedMesa]);

  useEffect(() => {
    fetchOrderBySelectedTable();
  }, [fetchOrderBySelectedTable])

  const handleSelectedProducts = (product: ProductResponse) => {
    const foundProduct = confirmedProducts.find(
      (p: any) => p.productId === product.id
    );

    if (foundProduct) {
      const updatedDetails = confirmedProducts.map((p) =>
        p.productId === product.id ? { ...p, quantity: p.quantity + 1 } : p
      );
      setSelectedProducts(updatedDetails);
    } else {
      const newProduct = {
        productId: product.id,
        quantity: 1,
        price: product.price,
        name: product.name,
      };
      setSelectedProducts([...selectedProducts, newProduct]);
    }
  };

  const handleSetProductsByOrder = (confirmedProducts: SelectedProductsI[]) => {
    setConfirmedProducts(confirmedProducts);
    setSelectedProducts(confirmedProducts);

    console.group("HANDLE SET PRODUCTS BY ORDER");
    console.log("Productos confirmados:", confirmedProducts);
    console.log("Productos seleccionados:", selectedProducts);
    console.groupEnd();

  };

  const handleDeleteSelectedProduct = (id: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.productId !== id));
  };

  const increaseProductNumber = (id: string) => {
    setSelectedProducts(
      selectedProducts.map((p) =>
        p.productId === id ? { ...p, quantity: p.quantity + 1 } : p
      )
    );
  };

  const decreaseProductNumber = (id: string) => {
    setSelectedProducts(
      selectedProducts.map((p) =>
        p.productId === id && p.quantity > 1
          ? { ...p, quantity: p.quantity - 1 }
          : p
      )
    );
  };

  const clearSelectedProducts = () => {
    setSelectedProducts([]);
  };

  // const handleConfirmedProducts = () => {};

  const deleteConfirmProduct = (id: string) => {
    setConfirmedProducts(
      confirmedProducts.filter((p: SelectedProductsI) => p.productId !== id)
    );
  };

  const handleCreateOrder = async (
    selectedMesa: MesaInterface,
    cantidadPersonas: number,
    comentario: string
  ) => {
    try {
      const pedido = {
        tableId: selectedMesa.id,
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
      setSelectedOrderByTable(newOrder);

      const updatedTable = {
        ...newOrder.table,
        room: selectedMesa.room,
        orders: [newOrder.id]
      };

      handleSelectMesa(updatedTable);

      Swal.fire("Éxito", "Mesa abierta correctamente.", "success");
    } catch (error) {
      Swal.fire("Error", "No se pudo abrir la mesa.", "error");
    }
  };

  const handleEditOrder = async (id: string, selectedProducts: SelectedProductsI[], numberCustomers: number, comment: string) => {
    if (!id) {
      Swal.fire("Error", "ID del pedido no válido.", "error");
      return;
    }

    try {
      const response = await fetch(`${URI_ORDER}/update/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productsDetails: [...selectedProducts],
          numberCustomers: numberCustomers,
          comment: comment
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error:", errorData);
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const updatedOrder = await response.json();

      const formattedProducts = updatedOrder.orderDetails.map((item: any) => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: parseFloat(item.unitaryPrice),
        name: item.product.name,
      }));

      setConfirmedProducts(formattedProducts);
      updateOrder(updatedOrder);

    } catch (error) {
      console.error(error);
    }

    console.groupEnd()
  };

  const handleDeleteOrder = async (id: string | null) => {
    if (!id) {
      Swal.fire("Error", "ID del pedido no válido.", "error");
      return;
    };

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

  return (
    <OrderContext.Provider
      value={{
        selectedProducts,
        confirmedProducts,
        selectedOrderByTable,
        setSelectedOrderByTable,
        handleSelectedProducts,
        handleDeleteSelectedProduct,
        increaseProductNumber,
        decreaseProductNumber,
        clearSelectedProducts,
        deleteConfirmProduct,
        handleCreateOrder,
        handleEditOrder,
        handleDeleteOrder,
        handleResetSelectedOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export default OrderProvider;