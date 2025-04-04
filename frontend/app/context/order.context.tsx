"use client";
import { MesaInterface } from "@/components/Interfaces/Cafe_interfaces";
import { URI_ORDER, URI_ORDER_OPEN } from "@/components/URI/URI";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import Swal from "sweetalert2";
import {
  ProductResponse,
  SelectedProductsI,
} from "../../components/Interfaces/IProducts";
import { useOrderStore } from "../../components/Order/useOrderStore";
import { useRoomContext } from "./room.context";
import { TableState } from "@/components/Enums/Enums";
import { IOrderDetails } from "@/components/Interfaces/IOrderDetails";
import { useAuth } from "./authContext";

type OrderContextType = {
  selectedProducts: SelectedProductsI[];
  setSelectedProducts: (products: SelectedProductsI[]) => void;
  confirmedProducts: SelectedProductsI[];
  setConfirmedProducts: (products: SelectedProductsI[]) => void;
  selectedOrderByTable: IOrderDetails | null;
  setSelectedOrderByTable: (order: IOrderDetails | null) => void;
  handleSelectedProducts: (product: ProductResponse) => void;
  handleDeleteSelectedProduct: (productId: string) => void;
  increaseProductNumber: (productId: string) => void;
  decreaseProductNumber: (productId: string) => void;
  clearSelectedProducts: () => void;
  deleteConfirmProduct: (productId: string) => void;
  handleCreateOrder: (
    mesa: MesaInterface,
    cantidadPersonas: number,
    comentario: string
  ) => Promise<void>;
  handleEditOrder: (
    id: string,
    selectedProducts: SelectedProductsI[],
    numberCustomers: number,
    comment: string
  ) => Promise<void>;
  handleDeleteOrder: (orderId: string | null) => Promise<void>;
  handleResetSelectedOrder: () => void;
  fetchOrderBySelectedTable: () => void;
};

const OrderContext = createContext<OrderContextType>({
  selectedProducts: [],
  setSelectedProducts: () => {},
  confirmedProducts: [],
  setConfirmedProducts: () => {},
  selectedOrderByTable: null,
  setSelectedOrderByTable: () => {},
  handleSelectedProducts: () => {},
  handleDeleteSelectedProduct: () => {},
  increaseProductNumber: () => {},
  decreaseProductNumber: () => {},
  clearSelectedProducts: () => {},
  deleteConfirmProduct: () => {},
  handleCreateOrder: async () => {},
  handleEditOrder: async () => {},
  handleDeleteOrder: async () => {},
  handleResetSelectedOrder: () => {},
  fetchOrderBySelectedTable: () => {},
});

export const useOrderContext = () => {
  const context = useContext(OrderContext);
  return context;
};

const OrderProvider = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  const { getAccessToken } = useAuth();

  const [token, setToken] = useState<string | null>(null);
  const { orders, addOrder, updateOrder, removeOrder } = useOrderStore();
  const { selectedMesa, handleSelectMesa } = useRoomContext();
  const [selectedProducts, setSelectedProducts] = useState<SelectedProductsI[]>(
    []
  );
  const [confirmedProducts, setConfirmedProducts] = useState<
    SelectedProductsI[]
  >([]);

  const [selectedOrderByTable, setSelectedOrderByTable] =
    useState<IOrderDetails | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      setToken(token);
    }
  }, [getAccessToken]);

  /**
   *
   * Al cambiar la Mesa o la Sala seleccionada se limpia
   *  la información de la mesa saliente mediante `handleResetSelectedOrder`.
   */
  useEffect(() => {
    handleResetSelectedOrder();
  }, [selectedMesa]);

  const handleResetSelectedOrder = () => {
    setSelectedProducts([]);
    setConfirmedProducts([]);
    setSelectedOrderByTable(null);
  };

  const fetchOrderBySelectedTable = useCallback(async () => {
    if (selectedMesa?.state === TableState.AVAILABLE) {
      return setSelectedOrderByTable(null);
    }
    if (selectedMesa && selectedMesa.orders) {
      try {
        if (selectedMesa?.orders.length > 0) {
          const response = await fetch(
            `${URI_ORDER}/${selectedMesa.orders[0]}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          const data = await response.json();

          setSelectedOrderByTable(data);

          const productsByOrder = data.products;

          handleSetProductsByOrder(productsByOrder);
        }
      } catch (error) {
        console.error("Error al obtener el pedido:", error);
      }
    }
  }, [selectedMesa]);

  useEffect(() => {
    fetchOrderBySelectedTable();
  }, [fetchOrderBySelectedTable]);

  const handleSelectedProducts = (product: ProductResponse) => {
    const foundProduct = selectedProducts.find(
      (p: any) => p.productId === product.id
    );

    if (foundProduct) {
      const updatedDetails = selectedProducts.map((p) =>
        p.productId === product.id ? { ...p, quantity: p.quantity + 1 } : p
      );
      setSelectedProducts(updatedDetails);
    } else {
      const newProduct = {
        productId: product.id,
        quantity: 1,
        unitaryPrice: product.price,
        productName: product.name,
      };
      setSelectedProducts([...selectedProducts, newProduct]);
    }
  };

  const handleSetProductsByOrder = (confirmedProducts: SelectedProductsI[]) => {
    setConfirmedProducts(confirmedProducts);
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(pedido),
      });

      if (response.status !== 201) {
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
        orders: [newOrder.id],
      };
      handleSelectMesa(updatedTable);
    } catch (error) {
      Swal.fire("Error", "No se pudo abrir la mesa.", "error");
    }
  };

  const handleEditOrder = async (
    id: string,
    selectedProducts: SelectedProductsI[],
    numberCustomers: number,
    comment: string
  ) => {
    if (!id) {
      return;
    }
    try {
      const response = await fetch(`${URI_ORDER}/update/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productsDetails: [...selectedProducts],
          numberCustomers: numberCustomers,
          comment: comment,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error:", errorData);
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const updatedOrder = await response.json();

      const productsByOrder = updatedOrder.products;

      handleSetProductsByOrder(productsByOrder);
      updateOrder(updatedOrder);
      setSelectedOrderByTable(updatedOrder);

      return updatedOrder;
    } catch (error) {
      console.error(error);
    }

    console.groupEnd();
  };

  const handleDeleteOrder = async (id: string | null) => {
    if (!id) {
      return;
    }

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

  useEffect(() => {
    if (selectedMesa) {
      const order = orders.find((o) => o.table.id === selectedMesa.id);
      setSelectedOrderByTable(order || null);
    }
  }, [orders, selectedMesa]);

  return (
    <OrderContext.Provider
      value={{
        selectedProducts,
        setSelectedProducts,
        confirmedProducts,
        setConfirmedProducts,
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
        fetchOrderBySelectedTable,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export default OrderProvider;
