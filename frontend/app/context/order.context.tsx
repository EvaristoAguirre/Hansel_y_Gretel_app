"use client";
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
  ICheckStock,
  ProductResponse,
  SelectedProductsI,
} from "../../components/Interfaces/IProducts";
import { useOrderStore } from "../../components/Order/useOrderStore";
import { useRoomContext } from "./room.context";
import { IOrderDetails } from "@/components/Interfaces/IOrder";
import { useAuth } from "./authContext";
import { checkStock } from "@/api/products";
import { cancelOrder } from "@/api/order";
import { useTableStore } from "@/components/Table/useTableStore";
import { ITable } from "@/components/Interfaces/ITable";
import { TableState } from "@/components/Enums/table";
import { editTable } from "@/api/tables";

type OrderContextType = {
  selectedProducts: SelectedProductsI[];
  setSelectedProducts: (products: SelectedProductsI[]) => void;
  confirmedProducts: SelectedProductsI[];
  setConfirmedProducts: (products: SelectedProductsI[]) => void;
  selectedOrderByTable: IOrderDetails | null;
  setSelectedOrderByTable: (order: IOrderDetails | null) => void;
  handleSelectedProducts: (product: ProductResponse) => void;
  highlightedProducts: Set<string>;
  addHighlightedProduct: (id: string) => void;
  removeHighlightedProduct: (id: string) => void;
  handleDeleteSelectedProduct: (productId: string) => void;
  increaseProductNumber: (product: SelectedProductsI) => void;
  decreaseProductNumber: (productId: string) => void;
  productComment: (id: string, comment: string) => void;
  clearSelectedProducts: () => void;
  deleteConfirmProduct: (productId: string) => void;
  handleCreateOrder: (
    table: ITable,
    cantidadPersonas: number,
    comentario: string
  ) => Promise<void>;
  handleEditOrder: (
    id: string,
    selectedProducts: SelectedProductsI[],
    numberCustomers: number,
    comment: string,
    isPriority?: boolean
  ) => Promise<void>;
  handleDeleteOrder: (orderId: string | null) => Promise<void>;
  handleResetSelectedOrder: () => void;
  fetchOrderBySelectedTable: () => void;
  handleCancelOrder: (orderId: string) => Promise<void>;
  handleAddTopping: (productId: string, toppingIds: string[]) => Promise<void>;
  selectedToppingsByProduct: { [productId: string]: string[][] };
  updateToppingForUnit: (
    productId: string,
    unitIndex: number,
    updatedGroup: { [groupId: string]: string[] }
  ) => void;
  toppingsByProductGroup: {
    [productId: string]: Array<{ [groupId: string]: string[] }>
  };

};

const OrderContext = createContext<OrderContextType>({
  selectedProducts: [],
  setSelectedProducts: () => { },
  confirmedProducts: [],
  setConfirmedProducts: () => { },
  selectedOrderByTable: null,
  setSelectedOrderByTable: () => { },
  handleSelectedProducts: () => { },
  highlightedProducts: new Set(),
  addHighlightedProduct: () => { },
  removeHighlightedProduct: () => { },
  handleDeleteSelectedProduct: () => { },
  increaseProductNumber: () => { },
  decreaseProductNumber: () => { },
  productComment: () => { },
  clearSelectedProducts: () => { },
  deleteConfirmProduct: () => { },
  handleCreateOrder: async () => { },
  handleEditOrder: async () => { },
  handleDeleteOrder: async () => { },
  handleResetSelectedOrder: () => { },
  fetchOrderBySelectedTable: () => { },
  handleCancelOrder: async () => { },
  handleAddTopping: async () => { },
  selectedToppingsByProduct: {},
  updateToppingForUnit: () => { },
  toppingsByProductGroup: {}
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
  const { tables } = useTableStore();
  const { orders, addOrder, updateOrder, removeOrder } = useOrderStore();
  const { selectedTable, setSelectedTable, handleSelectTable } = useRoomContext();
  const [selectedProducts, setSelectedProducts] = useState<SelectedProductsI[]>(
    []
  );

  const [selectedToppingsByProduct, setSelectedToppingsByProduct] = useState<{
    [productId: string]: string[][];
  }>({});

  const [confirmedProducts, setConfirmedProducts] = useState<
    SelectedProductsI[]
  >([]);

  const [selectedOrderByTable, setSelectedOrderByTable] =
    useState<IOrderDetails | null>(null);

  const [highlightedProducts, setHighlightedProducts] = useState<Set<string>>(new Set());

  const [toppingsByProductGroup, setToppingsByProductGroup] = useState<{
    [productId: string]: Array<{ [groupId: string]: string[] }>
  }>({});


  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      setToken(token);
    }
  }, [getAccessToken]);

  /**
   *
   * Al cambiar la Mesa o la Sala seleccionada se limpia
   *  la información de la Mesa saliente mediante `handleResetSelectedOrder`.
   */
  useEffect(() => {
    handleResetSelectedOrder();
  }, [selectedTable]);

  const handleResetSelectedOrder = () => {
    setSelectedProducts([]);
    setConfirmedProducts([]);
    setSelectedOrderByTable(null);

    setSelectedToppingsByProduct({});
  };

  const fetchOrderBySelectedTable = useCallback(async () => {
    if (selectedTable?.state === TableState.AVAILABLE) {

      return setSelectedOrderByTable(null);

    }
    if (selectedTable && selectedTable.orders) {
      try {
        if (selectedTable?.orders.length > 0) {
          const response = await fetch(
            `${URI_ORDER}/${selectedTable.orders[0]}`,
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
  }, [selectedTable]);

  useEffect(() => {
    fetchOrderBySelectedTable();
  }, [fetchOrderBySelectedTable]);

  const checkStockAvailability = async (productId: string, quantity: number) => {
    const form: ICheckStock = {
      productId: productId,
      quantityToSell: quantity
    }
    try {
      const stock = await checkStock(form, token!);

      return stock

    } catch (error) {
      console.error("Error al obtener el stock:", error);
    }
  };

  const handleSelectedProducts = async (product: ProductResponse) => {

    const foundProduct = selectedProducts.find(
      (p) => p.productId === product.id
    );


    const newQuantity = foundProduct ? foundProduct.quantity + 1 : 1;
    const stockResponse = await checkStockAvailability(product.id, newQuantity);
    if (!stockResponse?.available) {
      Swal.fire({
        icon: "error",
        title: "Stock insuficiente",
        text: stockResponse.message,
      });
      return;
    }


    if (foundProduct) {
      const updatedDetails = selectedProducts.map((p) =>
        p.productId === product.id ? { ...p, quantity: newQuantity } : p
      );
      setSelectedProducts(updatedDetails);
    } else if (!foundProduct || product.allowsToppings) {
      const newProduct = {
        productId: product.id,
        quantity: 1,
        unitaryPrice: product.price,
        productName: product.name,
        allowsToppings: product.allowsToppings,
        availableToppingGroups: product.availableToppingGroups
      };
      setSelectedProducts([...selectedProducts, newProduct]);

    }
    if (product.allowsToppings) {
      setHighlightedProducts(prev => new Set(prev).add(product.id));
    }

  };

  const handleAddTopping = async (productId: string, toppingIds: string[]) => {
    setSelectedProducts((prevProducts) =>
      prevProducts.map((p) =>
        p.productId === productId
          ? { ...p, toppingsIds: toppingIds }
          : p
      )
    );
  };

  const updateToppingForUnit = (
    productId: string,
    unitIndex: number,
    updatedGroup: { [groupId: string]: string[] }
  ) => {
    setToppingsByProductGroup((prev) => {
      const productData = [...(prev[productId] || [])];
      productData[unitIndex] = updatedGroup;

      const flattened = productData.map((groupMap) => {
        return Object.values(groupMap || {}).flat();
      });

      setSelectedToppingsByProduct((prevFlat) => ({
        ...prevFlat,
        [productId]: flattened,
      }));

      return {
        ...prev,
        [productId]: productData,
      };
    });
  };


  const addHighlightedProduct = (id: string) => {
    setHighlightedProducts((prev) => new Set(prev).add(id));
  };

  const removeHighlightedProduct = (id: string) => {
    setHighlightedProducts(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };


  const handleSetProductsByOrder = (confirmedProducts: SelectedProductsI[]) => {
    setConfirmedProducts(confirmedProducts);
  };

  const handleDeleteSelectedProduct = (id: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.productId !== id));
  };

  const increaseProductNumber = async (product: SelectedProductsI) => {
    const productToUpdate = selectedProducts.find((p) => p.productId === product.productId);
    if (productToUpdate) {
      const newQuantity = productToUpdate.quantity + 1;
      // Verifica el stock antes de actualizar
      const stockResponse = await checkStockAvailability(product.productId, newQuantity);
      if (!stockResponse?.available) {
        Swal.fire({
          icon: "error",
          title: "Stock insuficiente",
          text: stockResponse.message,
        });
        return;
      }
      setSelectedProducts(
        selectedProducts.map((p) =>
          p.productId === product.productId ? { ...p, quantity: newQuantity } : p
        )
      );
    }

  };

  const decreaseProductNumber = async (id: string) => {
    const productToUpdate = selectedProducts.find((p) => p.productId === id);
    if (productToUpdate) {
      const newQuantity = productToUpdate.quantity - 1;
      // Verifica el stock antes de actualizar
      const stockResponse = await checkStockAvailability(id, newQuantity);
      if (!stockResponse?.available) {
        Swal.fire({
          icon: "error",
          title: "Stock insuficiente",
          text: stockResponse.message,
        });
        return;
      }
      setSelectedProducts(
        selectedProducts.map((p) =>
          p.productId === id ? { ...p, quantity: newQuantity } : p
        )
      );
    }
  };

  const productComment = async (id: string, comment: string) => {
    const productToUpdate = selectedProducts.find((p) => p.productId === id);
    if (productToUpdate) {
      setSelectedProducts(
        selectedProducts.map((p) =>
          p.productId === id ? { ...p, commentOfProduct: comment } : p
        )
      );
    }
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
    selectedTable: ITable,
    cantidadPersonas: number,
    comentario: string
  ) => {
    try {
      const pedido = {
        tableId: selectedTable.id,
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
      const tableEdited = token && await editTable(
        { ...selectedTable, state: TableState.OPEN },
        token
      );

      const updatedTable = {
        ...tableEdited,
        orders: [newOrder.id],
      };
      handleSelectTable(updatedTable);
    } catch (error) {
      Swal.fire("Error", "No se pudo abrir la mesa.", "error");
    }
  };

  const handleEditOrder = async (
    id: string,
    selectedProducts: SelectedProductsI[],
    numberCustomers: number,
    comment: string,
    isPriority?: boolean
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
          isPriority: isPriority
        }),
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json();
          Swal.fire({
            icon: "error",
            title: "Error",
            text: errorData.message,
          })
          return
        } else {
          const errorData = await response.json();
          console.error("Error:", errorData);
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
      }

      const updatedOrder = await response.json();
      const productsByOrder = updatedOrder.products;

      handleSetProductsByOrder(productsByOrder);
      updateOrder(updatedOrder);
      setSelectedOrderByTable(updatedOrder);

      return updatedOrder;
    } catch (error) {
      console.error(error);
      return
    }
  };

  const handleCancelOrder = async (id: string) => {
    const confirm = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, anular",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed) {
      try {
        const cancelledOrder = await cancelOrder(id, token!);
        if (cancelledOrder) {
          removeOrder(id);
          setSelectedOrderByTable(null);

          setConfirmedProducts([]);
          setSelectedTable({
            ...selectedTable,
            orders: [],
            state: TableState.AVAILABLE
          } as ITable);
          Swal.fire({
            icon: "success",
            title: "Pedido cancelado",
            text: "El pedido ha sido cancelado con éxito.",
          });
        }
      } catch (error) {
        console.error(error);
      }
    }
  }

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

  console.groupEnd();

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
        highlightedProducts,
        addHighlightedProduct,
        removeHighlightedProduct,
        handleDeleteSelectedProduct,
        increaseProductNumber,
        decreaseProductNumber,
        productComment,
        clearSelectedProducts,
        deleteConfirmProduct,
        handleCreateOrder,
        handleEditOrder,
        handleDeleteOrder,
        handleResetSelectedOrder,
        fetchOrderBySelectedTable,
        handleCancelOrder,
        handleAddTopping,
        selectedToppingsByProduct,
        updateToppingForUnit,
        toppingsByProductGroup
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export default OrderProvider;
