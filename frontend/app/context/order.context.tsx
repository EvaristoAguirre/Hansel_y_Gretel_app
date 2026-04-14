"use client";
import { URI_ORDER, URI_ORDER_OPEN, URI_TABLE } from "@/components/URI/URI";
import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  use,
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
import { OrderState } from "@/components/Enums/order";
import { editTable } from "@/api/tables";
import { webSocketService } from "@/services/websocket.service";
import { newOrderLineId } from "@/components/Utils/newOrderLineId";

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
  handleDeleteSelectedProduct: (lineId: string) => void;
  increaseProductNumber: (product: SelectedProductsI) => void;
  decreaseProductNumber: (lineId: string) => void;
  productComment: (lineId: string, comment: string) => void;
  clearSelectedProducts: () => void;
  deleteConfirmProduct: (lineId: string) => void;
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
  handleAddTopping: (lineId: string, toppingIds: string[]) => Promise<void>;
  /** Clave = internalId de la línea del carrito */
  selectedToppingsByProduct: { [lineId: string]: string[][] };
  updateToppingForUnit: (
    lineId: string,
    unitIndex: number,
    updatedGroup: { [groupId: string]: string[] }
  ) => void;
  toppingsByProductGroup: {
    [lineId: string]: Array<{ [groupId: string]: string[] }>;
  };
  checkStockToppingAvailability: (
    productId: string,
    quantity: number,
    toppingsPerUnit?: string[][]
  ) => Promise<{ available: boolean } | undefined>;
  /** Activo mientras la encargada está procesando el cobro (paso 4).
   *  Cuando es true, los eventos WebSocket no actualizan selectedOrderByTable
   *  ni confirmedProducts para proteger la integridad del proceso de pago. */
  isPaymentInProgress: boolean;
  setIsPaymentInProgress: (value: boolean) => void;
};

const OrderContext = createContext<OrderContextType>({
  selectedProducts: [],
  checkStockToppingAvailability: async () => ({ available: true }),
  setSelectedProducts: () => {},
  confirmedProducts: [],
  setConfirmedProducts: () => {},
  selectedOrderByTable: null,
  setSelectedOrderByTable: () => {},
  handleSelectedProducts: () => {},
  highlightedProducts: new Set(),
  addHighlightedProduct: () => {},
  removeHighlightedProduct: () => {},
  handleDeleteSelectedProduct: () => {},
  increaseProductNumber: () => {},
  decreaseProductNumber: () => {},
  productComment: () => {},
  clearSelectedProducts: () => {},
  deleteConfirmProduct: () => {},
  handleCreateOrder: async () => {},
  handleEditOrder: async () => {},
  handleDeleteOrder: async () => {},
  handleResetSelectedOrder: () => {},
  fetchOrderBySelectedTable: () => {},
  handleCancelOrder: async () => {},
  handleAddTopping: async () => {},
  selectedToppingsByProduct: {},
  updateToppingForUnit: () => {},
  toppingsByProductGroup: {},
  isPaymentInProgress: false,
  setIsPaymentInProgress: () => {},
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
  const { selectedTable, setSelectedTable, handleSelectTable } =
    useRoomContext();
  const [selectedProducts, setSelectedProducts] = useState<SelectedProductsI[]>(
    []
  );

  const [selectedToppingsByProduct, setSelectedToppingsByProduct] = useState<{
    [lineId: string]: string[][];
  }>({});

  const [confirmedProducts, setConfirmedProducts] = useState<
    SelectedProductsI[]
  >([]);

  const [selectedOrderByTable, setSelectedOrderByTable] =
    useState<IOrderDetails | null>(null);

  const [highlightedProducts, setHighlightedProducts] = useState<Set<string>>(
    new Set()
  );

  const [toppingsByProductGroup, setToppingsByProductGroup] = useState<{
    [lineId: string]: Array<{ [groupId: string]: string[] }>;
  }>({});

  const [isPaymentInProgress, setIsPaymentInProgress] = useState(false);

  // Refs para acceder al estado actual desde callbacks estables (WebSocket listeners)
  // sin que su cambio provoque la recreación de esos callbacks.
  const tablesRef = useRef<ITable[]>([]);
  const ordersRef = useRef<IOrderDetails[]>([]);
  const selectedTableRef = useRef<ITable | null>(null);
  const selectedOrderByTableRef = useRef<IOrderDetails | null>(null);
  const tokenRef = useRef<string | null>(null);
  const isPaymentInProgressRef = useRef(false);

  useEffect(() => { tablesRef.current = tables; }, [tables]);
  useEffect(() => { ordersRef.current = orders; }, [orders]);
  useEffect(() => { selectedTableRef.current = selectedTable; }, [selectedTable]);
  useEffect(() => { selectedOrderByTableRef.current = selectedOrderByTable; }, [selectedOrderByTable]);
  useEffect(() => { tokenRef.current = token; }, [token]);
  useEffect(() => { isPaymentInProgressRef.current = isPaymentInProgress; }, [isPaymentInProgress]);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      setToken(token);
    }

    // Asegurar que el WebSocket esté conectado
    try {
      webSocketService.connect();
    } catch (error) {
      console.error("Error al conectar WebSocket:", error);
    }
  }, [getAccessToken]);

  // Rastrea el ID de la mesa anterior para distinguir entre cambio de mesa
  // (requiere reset completo) vs. cambio de estado de la misma mesa (no requiere reset).
  const previousTableIdRef = useRef<string | null>(null);

  // Gestión de salas Socket.IO: unirse a la sala de la mesa seleccionada y
  // abandonar la sala de la mesa anterior al cambiar de mesa.
  useEffect(() => {
    const previousId = previousTableIdRef.current;
    const newId = selectedTable?.id ?? null;
    if (previousId && previousId !== newId) {
      webSocketService.leaveTable(previousId);
    }
    if (newId) {
      webSocketService.joinTable(newId);
    }
  }, [selectedTable?.id]);

  const handleResetSelectedOrder = () => {
    setSelectedProducts([]);
    setConfirmedProducts([]);
    setSelectedOrderByTable(null);
    setSelectedToppingsByProduct({});
    setToppingsByProductGroup({});
    setHighlightedProducts(new Set());
  };

  const handleSetProductsByOrder = useCallback(
    (confirmedProductsRaw: SelectedProductsI[]) => {
      const expandedProducts: SelectedProductsI[] = [];
      let internalCounter = 0;

      confirmedProductsRaw.forEach((product) => {
        const quantity = product.quantity || 1;

        for (let i = 0; i < quantity; i++) {
          expandedProducts.push({
            ...product,
            internalId: `${product.productId}-${internalCounter}`,
            quantity: 1,
          });
          internalCounter++;
        }
      });

      setConfirmedProducts(expandedProducts);
    },
    []
  );

  // Usa refs para acceder al estado actual sin recrear el callback en cada cambio de tables/orders.
  // Solo depende de handleSetProductsByOrder (estable, useCallback con []).
  const fetchOrderBySelectedTable = useCallback(async () => {
    const currentSelectedTable = selectedTableRef.current;
    const currentTables = tablesRef.current;
    const currentOrders = ordersRef.current;
    const currentToken = tokenRef.current;

    if (!currentSelectedTable) {
      setSelectedOrderByTable(null);
      setConfirmedProducts([]);
      return;
    }

    const updatedTable = currentTables.find((t) => t.id === currentSelectedTable.id);
    const actualTableState = updatedTable?.state || currentSelectedTable.state;

    if (
      actualTableState === TableState.AVAILABLE ||
      actualTableState === TableState.CLOSED
    ) {
      setSelectedOrderByTable(null);
      setConfirmedProducts([]);
      return;
    }

    // Obtener orderId: primero desde tabla del store, luego desde orders store.
    // Eliminado el doble-fetch a GET /order?tableId= que generaba cascada de requests.
    let orderId: string | undefined;
    const tableWithOrders = updatedTable || currentSelectedTable;

    if (tableWithOrders?.orders && tableWithOrders.orders.length > 0) {
      orderId = tableWithOrders.orders[0];
    } else {
      const orderInStore = currentOrders.find(
        (o) => o.table?.id === currentSelectedTable.id
      );
      orderId = orderInStore?.id;
    }

    if (
      !orderId &&
      selectedOrderByTableRef.current?.table?.id === currentSelectedTable.id
    ) {
      orderId = selectedOrderByTableRef.current.id;
    }

    if (!orderId) {
      setSelectedOrderByTable(null);
      setConfirmedProducts([]);
      return;
    }

    try {
      const response = await fetch(`${URI_ORDER}/${orderId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${currentToken}` },
      });

      if (!response.ok) {
        setSelectedOrderByTable(null);
        setConfirmedProducts([]);
        return;
      }

      const data: IOrderDetails = await response.json();

      if (
        data.state === OrderState.CLOSED ||
        data.state === ("closed" as any)
      ) {
        setSelectedOrderByTable(null);
        setConfirmedProducts([]);
        return;
      }

      setSelectedOrderByTable(data);

      if (data.products && data.products.length > 0) {
        const adaptedProducts: SelectedProductsI[] = data.products.map(
          (product: any) => ({
            detailId: product.detailId,
            productId: product.productId,
            productName: product.productName,
            quantity: product.quantity,
            unitaryPrice:
              product.unitaryPrice != null
                ? String(product.unitaryPrice)
                : null,
            commentOfProduct: product.commentOfProduct || null,
            allowsToppings: product.allowsToppings,
          })
        );
        handleSetProductsByOrder(adaptedProducts);
      } else {
        setConfirmedProducts([]);
      }
    } catch (error) {
      console.error("Error al obtener el pedido:", error);
      setSelectedOrderByTable(null);
      setConfirmedProducts([]);
    }
  }, [handleSetProductsByOrder]);

  // Efecto unificado: reacciona a cambios de selectedTable.
  // Solo resetea el estado cuando cambia la MESA (distinto ID).
  // Si la misma mesa cambia de estado (ej. OPEN→PENDING_PAYMENT al imprimir ticket),
  // no re-fetch-ea si ya hay una orden cargada para esa mesa: evita pisar el estado
  // que handlePayOrder / cancelOrderDetail acaban de actualizar (race con store WS).
  useEffect(() => {
    const newTableId = selectedTable?.id ?? null;
    const tableIdChanged = newTableId !== previousTableIdRef.current;
    previousTableIdRef.current = newTableId;

    if (tableIdChanged) {
      // Solo limpiar al cambiar a una mesa diferente
      setSelectedProducts([]);
      setConfirmedProducts([]);
      setSelectedOrderByTable(null);
      setSelectedToppingsByProduct({});
      setToppingsByProductGroup({});
      setHighlightedProducts(new Set());
    }

    if (!selectedTable) return;

    const stateInSelected = selectedTable?.state;
    const tableInStore = tablesRef.current.find((t) => t.id === selectedTable?.id);
    const stateInStore = tableInStore?.state;

    if (
      stateInSelected === TableState.AVAILABLE ||
      stateInSelected === TableState.CLOSED ||
      stateInStore === TableState.AVAILABLE ||
      stateInStore === TableState.CLOSED
    ) {
      return;
    }

    if (
      !tableIdChanged &&
      selectedOrderByTableRef.current?.table?.id === newTableId
    ) {
      return;
    }

    fetchOrderBySelectedTable();
  }, [selectedTable, fetchOrderBySelectedTable]);

  const checkStockToppingAvailability = async (
    productId: string,
    quantity: number,
    toppingsPerUnit?: string[][]
  ) => {
    const form: ICheckStock = {
      productId: productId,
      quantityToSell: quantity,
      toppingsPerUnit: toppingsPerUnit?.flat(),
    };
    try {
      const stock = await checkStock(form, token!);

      return stock;
    } catch (error) {
      console.error("Error al obtener el stock:", error);
    }
  };

  // La validación de stock se realiza en el backend al confirmar (handleEditOrder).
  // Eliminado el check por HTTP en cada interacción para respuesta instantánea en tablet.
  const handleSelectedProducts = (product: ProductResponse) => {
    const foundProduct = selectedProducts.find(
      (p) => p.productId === product.id
    );

    const newQuantity = foundProduct ? foundProduct.quantity + 1 : 1;

    if (foundProduct) {
      const updatedDetails = selectedProducts.map((p) =>
        p.productId === product.id ? { ...p, quantity: newQuantity } : p
      );
      setSelectedProducts(updatedDetails);
    } else if (!foundProduct || product.allowsToppings) {
      const newProduct: SelectedProductsI = {
        internalId: newOrderLineId(),
        productId: product.id,
        quantity: 1,
        unitaryPrice: product.price,
        productName: product.name,
        allowsToppings: product.allowsToppings,
        commentOfProduct: product.commentOfProduct,
        availableToppingGroups: product.availableToppingGroups,
      };
      setSelectedProducts([...selectedProducts, newProduct]);
    }
    if (product.allowsToppings) {
      setHighlightedProducts((prev) => new Set(prev).add(product.id));
    }
  };

  const handleAddTopping = async (lineId: string, toppingIds: string[]) => {
    setSelectedProducts((prevProducts) =>
      prevProducts.map((p) =>
        p.internalId === lineId ? { ...p, toppingsIds: toppingIds } : p
      )
    );
  };

  const clearToppings = () => {
    setToppingsByProductGroup({});
    setSelectedToppingsByProduct({});
  };

  const updateToppingForUnit = (
    lineId: string,
    unitIndex: number,
    updatedGroup: { [groupId: string]: string[] }
  ) => {
    setToppingsByProductGroup((prev) => {
      const productData = [...(prev[lineId] || [])];
      productData[unitIndex] = updatedGroup;

      const flattened = productData.map((groupMap) => {
        return Object.values(groupMap || {}).flat();
      });

      setSelectedToppingsByProduct((prevFlat) => ({
        ...prevFlat,
        [lineId]: flattened,
      }));

      return {
        ...prev,
        [lineId]: productData,
      };
    });
  };

  const addHighlightedProduct = (id: string) => {
    setHighlightedProducts((prev) => new Set(prev).add(id));
  };

  const removeHighlightedProduct = (id: string) => {
    setHighlightedProducts((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Listeners de WebSocket registrados UNA SOLA VEZ al montar el provider.
  // Usan refs para acceder al estado actual sin requerir ser re-registrados,
  // eliminando la "ventana ciega" que ocurría al desregistrar/re-registrar
  // en cada cambio de orders, tables, selectedTable, etc.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const socket = webSocketService.connect();

    const handleTicketPrinted = async (data: any) => {
      // No interrumpir la vista de cobro con actualizaciones externas
      if (isPaymentInProgressRef.current) return;

      const orderData = data.order || data;
      const orderId = orderData.id;
      const orderTableId = orderData.table?.id || orderData.tableId;

      const currentSelectedTable = selectedTableRef.current;
      const currentSelectedOrderByTable = selectedOrderByTableRef.current;
      const currentToken = tokenRef.current;

      const belongsToSelectedTable =
        currentSelectedOrderByTable?.id === orderId ||
        currentSelectedTable?.id === orderTableId ||
        currentSelectedTable?.orders?.includes(orderId);

      if (!belongsToSelectedTable || !currentToken) return;

      try {
        const response = await fetch(`${URI_ORDER}/${orderId}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${currentToken}` },
        });

        if (!response.ok) {
          console.error("Error en respuesta orderTicketPrinted:", response.status);
          return;
        }

        const fullOrderData: IOrderDetails = await response.json();

        // Reutilizar la misma condición del filtro inicial para decidir si actualizar
        const shouldUpdate = belongsToSelectedTable;

        if (shouldUpdate) {
          const newState =
            fullOrderData.state === OrderState.PENDING_PAYMENT
              ? OrderState.PENDING_PAYMENT
              : fullOrderData.state || OrderState.PENDING_PAYMENT;
          setSelectedOrderByTable({ ...fullOrderData, state: newState });
        }

        if (fullOrderData.products && fullOrderData.products.length > 0 && shouldUpdate) {
          const adaptedProducts: SelectedProductsI[] = fullOrderData.products.map(
            (product: any) => ({
              detailId: product.detailId,
              productId: product.productId,
              productName: product.productName,
              quantity: product.quantity,
              unitaryPrice:
                product.unitaryPrice != null ? String(product.unitaryPrice) : null,
              commentOfProduct: product.commentOfProduct || null,
              allowsToppings: product.allowsToppings,
            })
          );
          handleSetProductsByOrder(adaptedProducts);
        }
      } catch (error) {
        console.error("Error al obtener la orden actualizada:", error);
      }
    };

    const handleOrderDeleted = async (data: any) => {
      // No interrumpir la vista de cobro con actualizaciones externas
      if (isPaymentInProgressRef.current) return;

      const orderData = data.order || data;
      const orderId = orderData.id;
      const orderTableId = orderData.table?.id || orderData.tableId;

      const currentSelectedTable = selectedTableRef.current;
      const currentSelectedOrderByTable = selectedOrderByTableRef.current;
      const currentOrders = ordersRef.current;
      const currentToken = tokenRef.current;

      let tableId = orderTableId;
      if (!tableId) {
        const orderInStore = currentOrders.find((o) => o.id === orderId);
        tableId = orderInStore?.table?.id;
      }

      const { tables: currentTables, updateTable } = useTableStore.getState();
      const tableInStore = currentTables.find((t) => t.id === tableId);
      const belongsToSelectedTable =
        currentSelectedTable?.id === tableId ||
        currentSelectedOrderByTable?.id === orderId ||
        currentSelectedTable?.orders?.includes(orderId) ||
        currentOrders.some((o) => o.id === orderId) ||
        !!tableInStore;

      if (!belongsToSelectedTable) return;

      if (currentSelectedOrderByTable?.id === orderId) {
        setSelectedOrderByTable(null);
        setConfirmedProducts([]);
        setSelectedProducts([]);
        setSelectedToppingsByProduct({});
        setToppingsByProductGroup({});
      }

      if (tableId) {
        if (currentSelectedTable && currentSelectedTable.id === tableId) {
          const updatedTable = {
            ...currentSelectedTable,
            orders: currentSelectedTable.orders?.filter((oId: string) => oId !== orderId) || [],
            state: TableState.AVAILABLE,
          } as ITable;
          setSelectedTable(updatedTable);
        }

        if (tableInStore) {
          const finalUpdatedTable = {
            ...tableInStore,
            orders: tableInStore.orders?.filter((oId: string) => oId !== orderId) || [],
            state: TableState.AVAILABLE,
          } as ITable;
          updateTable(finalUpdatedTable);
          if (currentSelectedTable?.id === tableId) {
            setSelectedTable(finalUpdatedTable);
          }
        } else if (currentToken) {
          const roomId = currentSelectedTable?.room?.id;
          if (!roomId) return;

          try {
            const response = await fetch(
              `${URI_TABLE}/by-room/${roomId}`,
              { method: "GET", headers: { Authorization: `Bearer ${currentToken}` } }
            );
            if (response.ok) {
              const tableData = await response.json();
              const updatedTable = {
                ...tableData,
                orders: tableData.orders?.filter((oId: string) => oId !== orderId) || [],
                state: TableState.AVAILABLE,
              } as ITable;
              updateTable(updatedTable);
              if (currentSelectedTable?.id === tableId) {
                setSelectedTable(updatedTable);
              }
            }
          } catch (error) {
            console.error("Error al obtener mesa desde backend:", error);
          }
        }
      }
    };

    const registerListeners = () => {
      if (webSocketService.isConnected()) {
        webSocketService.on("orderTicketPrinted", handleTicketPrinted);
        webSocketService.on("orderUpdatedPending", handleTicketPrinted);
        webSocketService.on("orderDeleted", handleOrderDeleted);
      } else {
        socket.once("connect", () => {
          webSocketService.on("orderTicketPrinted", handleTicketPrinted);
          webSocketService.on("orderUpdatedPending", handleTicketPrinted);
          webSocketService.on("orderDeleted", handleOrderDeleted);
        });
      }
    };

    registerListeners();

    return () => {
      webSocketService.off("orderTicketPrinted", handleTicketPrinted);
      webSocketService.off("orderUpdatedPending", handleTicketPrinted);
      webSocketService.off("orderDeleted", handleOrderDeleted);
    };
  }, []); // Sin dependencias: se registra una sola vez al montar y usa refs para el estado actual.

  const handleDeleteSelectedProduct = (lineId: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.internalId !== lineId));
    setSelectedToppingsByProduct((prev) => {
      const next = { ...prev };
      delete next[lineId];
      return next;
    });
    setToppingsByProductGroup((prev) => {
      const next = { ...prev };
      delete next[lineId];
      return next;
    });
  };

  const increaseProductNumber = (product: SelectedProductsI) => {
    const lineId = product.internalId;
    if (!lineId) return;
    const productToUpdate = selectedProducts.find((p) => p.internalId === lineId);
    if (productToUpdate) {
      const newQuantity = productToUpdate.quantity + 1;
      setSelectedProducts(
        selectedProducts.map((p) =>
          p.internalId === lineId ? { ...p, quantity: newQuantity } : p
        )
      );
    }
  };

  const decreaseProductNumber = (lineId: string) => {
    const productToUpdate = selectedProducts.find((p) => p.internalId === lineId);
    if (productToUpdate) {
      const newQuantity = productToUpdate.quantity - 1;
      setSelectedProducts(
        selectedProducts.map((p) =>
          p.internalId === lineId ? { ...p, quantity: newQuantity } : p
        )
      );
    }
  };

  const productComment = async (lineId: string, comment: string) => {
    const productToUpdate = selectedProducts.find((p) => p.internalId === lineId);
    if (productToUpdate) {
      setSelectedProducts(
        selectedProducts.map((p) =>
          p.internalId === lineId ? { ...p, commentOfProduct: comment } : p
        )
      );
    }
  };

  const clearSelectedProducts = () => {
    setSelectedProducts([]);
  };

  const deleteConfirmProduct = (lineId: string) => {
    setConfirmedProducts(
      confirmedProducts.filter((p: SelectedProductsI) => p.internalId !== lineId)
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
      const tableEdited =
        token &&
        (await editTable({ ...selectedTable, state: TableState.OPEN }, token));

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
          isPriority: isPriority,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          errorData.error?.message ||
          errorData.message ||
          "Error al confirmar el pedido.";

        if (response.status === 400) {
          Swal.fire({
            icon: "error",
            title: "Stock insuficiente",
            text: errorMessage,
          });
        } else {
          console.error("Error:", errorData);
        }

        throw new Error(errorMessage);
      }

      const updatedOrder = await response.json();
      const productsByOrder = updatedOrder.products;

      handleSetProductsByOrder(productsByOrder);
      updateOrder(updatedOrder);
      setSelectedOrderByTable(updatedOrder);

      clearToppings();

      return updatedOrder;
    } catch (error) {
      console.error(error);
      throw error;
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
          // Remover la orden del store
          removeOrder(id);

          // Limpiar completamente el estado de la orden
          setSelectedOrderByTable(null);
          setConfirmedProducts([]);
          setSelectedProducts([]);
          setSelectedToppingsByProduct({});
          setToppingsByProductGroup({});

          // Actualizar la mesa a AVAILABLE y limpiar las órdenes
          if (selectedTable) {
            const updatedTable = {
              ...selectedTable,
              orders: [],
              state: TableState.AVAILABLE,
            } as ITable;

            // Actualizar la mesa en el contexto
            setSelectedTable(updatedTable);

            // Actualizar la mesa en el store de mesas
            const { updateTable } = useTableStore.getState();
            updateTable(updatedTable);

            // También actualizar la mesa en el backend para asegurar consistencia
            // Usar editTable que usa PATCH en lugar de PUT
            try {
              const tableEdited = await editTable(
                {
                  id: selectedTable.id,
                  name: selectedTable.name,
                  state: TableState.AVAILABLE,
                },
                token!
              );

              if (tableEdited) {
                updateTable(tableEdited);
                setSelectedTable(tableEdited);
              }
            } catch (error) {
              console.error(
                "Error al actualizar la mesa en el backend:",
                error
              );
            }
          }

          Swal.fire({
            icon: "success",
            title: "Pedido cancelado",
            text: "El pedido ha sido cancelado con éxito. Puedes iniciar una nueva orden.",
          });
        }
      } catch (error) {
        console.error("Error al cancelar la orden:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo cancelar el pedido. Por favor, intenta nuevamente.",
        });
      }
    }
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

  // useMemo evita que el objeto de contexto se recree en cada render del provider
  // cuando los datos no cambiaron, previniendo re-renders innecesarios en los consumidores.
  const contextValue = useMemo(
    () => ({
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
      toppingsByProductGroup,
      checkStockToppingAvailability,
      isPaymentInProgress,
      setIsPaymentInProgress,
    }),
    [
      selectedProducts,
      confirmedProducts,
      selectedOrderByTable,
      highlightedProducts,
      selectedToppingsByProduct,
      toppingsByProductGroup,
      fetchOrderBySelectedTable,
      token,
      isPaymentInProgress,
    ]
  );

  return (
    <OrderContext.Provider value={contextValue}>
      {children}
    </OrderContext.Provider>
  );
};

export default OrderProvider;
