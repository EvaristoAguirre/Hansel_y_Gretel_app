"use client";
import { URI_ORDER, URI_ORDER_OPEN, URI_TABLE } from "@/components/URI/URI";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
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
    [productId: string]: Array<{ [groupId: string]: string[] }>;
  };
  checkStockToppingAvailability: (
    productId: string,
    quantity: number,
    toppingsPerUnit?: string[][]
  ) => Promise<{ available: boolean } | undefined>;
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
    [productId: string]: string[][];
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
    [productId: string]: Array<{ [groupId: string]: string[] }>;
  }>({});

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

  /**
   *
   * Al cambiar la Mesa o la Sala seleccionada se limpia
   *  la información de la Mesa saliente mediante `handleResetSelectedOrder`.
   */
  useEffect(() => {
    handleResetSelectedOrder();
  }, [selectedTable]);

  const handleResetSelectedOrder = () => {
    console.log("🥁🥁🥁🥁");
    setSelectedProducts([]);
    console.log("selectedProducts", selectedProducts);
    setConfirmedProducts([]);
    console.log("confirmedProducts", confirmedProducts);
    setSelectedOrderByTable(null);
    console.log("selectedOrderByTable", selectedOrderByTable);
    setSelectedToppingsByProduct({});
    console.log("selectedToppingsByProduct", selectedToppingsByProduct);
    setToppingsByProductGroup({});
    console.log("toppingsByProductGroup", toppingsByProductGroup);
    setHighlightedProducts(new Set());
    console.log("highlightedProducts", highlightedProducts);
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

  const fetchOrderBySelectedTable = useCallback(async () => {
    // Buscar la mesa actualizada en el store de mesas para obtener el estado real
    const updatedTable = tables.find((t) => t.id === selectedTable?.id);
    const actualTableState = updatedTable?.state || selectedTable?.state;

    // Solo limpiar si la mesa está realmente disponible o cerrada (verificar en el store actualizado)
    if (
      actualTableState === TableState.AVAILABLE ||
      actualTableState === TableState.CLOSED
    ) {
      setSelectedOrderByTable(null);
      setConfirmedProducts([]);
      return;
    }
    if (selectedTable) {
      try {
        // Buscar la mesa actualizada en el store de mesas (puede tener orders actualizado)
        const updatedTable = tables.find((t) => t.id === selectedTable.id);
        const tableWithOrders = updatedTable || selectedTable;

        // Obtener el ID de la orden desde la mesa actualizada o desde selectedTable
        let orderId: string | undefined;

        if (tableWithOrders?.orders && tableWithOrders.orders.length > 0) {
          orderId = tableWithOrders.orders[0];
        } else {
          // Si no hay orders en la mesa, buscar la orden por tableId en el store de órdenes
          const orderInStore = orders.find(
            (o) => o.table?.id === selectedTable.id
          );
          if (orderInStore) {
            orderId = orderInStore.id;
          } else {
            // Si no hay orden en el store, intentar obtener todas las órdenes de la mesa desde el backend
            // Por ahora, asumimos que si la mesa tiene estado diferente a AVAILABLE/CLOSED, tiene una orden
            // y la obtenemos haciendo un fetch a la API de órdenes por tableId
            try {
              const ordersResponse = await fetch(
                `${URI_ORDER}?tableId=${selectedTable.id}`,
                {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              if (ordersResponse.ok) {
                const ordersData = await ordersResponse.json();
                if (ordersData && ordersData.length > 0) {
                  // Obtener la orden más reciente o la que esté en estado pending_payment
                  const pendingOrder = ordersData.find(
                    (o: IOrderDetails) => o.state === "pending_payment"
                  );
                  orderId = pendingOrder?.id || ordersData[0]?.id;
                }
              }
            } catch (error) {
              console.error("Error al obtener órdenes por tableId:", error);
            }
          }
        }

        if (orderId) {
          const response = await fetch(`${URI_ORDER}/${orderId}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data: IOrderDetails = await response.json();

            // NO cargar órdenes cerradas - si la orden está cerrada, limpiar todo
            if (
              data.state === OrderState.CLOSED ||
              data.state === ("closed" as any)
            ) {
              setSelectedOrderByTable(null);
              setConfirmedProducts([]);
              return;
            }

            setSelectedOrderByTable(data);

            const productsByOrder = data.products;

            if (productsByOrder && productsByOrder.length > 0) {
              // Adaptar ProductLineDto[] a SelectedProductsI[]
              // El backend devuelve ProductLineDto con unitaryPrice: number
              // pero SelectedProductsI espera unitaryPrice?: string | null
              const adaptedProducts: SelectedProductsI[] = productsByOrder.map(
                (product: any) => ({
                  productId: product.productId,
                  productName: product.productName,
                  quantity: product.quantity,
                  unitaryPrice:
                    product.unitaryPrice != null
                      ? String(product.unitaryPrice)
                      : null,
                  commentOfProduct: product.commentOfProduct || null,
                  allowsToppings: product.allowsToppings,
                  // Los toppings vienen como ToppingSummaryDto[] pero SelectedProductsI espera toppingsPerUnit?: string[][]
                  // Por ahora no mapeamos los toppings ya que no se usan en confirmedProducts
                })
              );
              handleSetProductsByOrder(adaptedProducts);
            } else {
              setConfirmedProducts([]);
            }
          } else {
            setSelectedOrderByTable(null);
            setConfirmedProducts([]);
          }
        } else {
          setSelectedOrderByTable(null);
          setConfirmedProducts([]);
        }
      } catch (error) {
        console.error("Error al obtener el pedido:", error);
        setSelectedOrderByTable(null);
        setConfirmedProducts([]);
      }
    } else {
      setSelectedOrderByTable(null);
      setConfirmedProducts([]);
    }
  }, [selectedTable, token, handleSetProductsByOrder, tables, orders]);

  useEffect(() => {
    // No hacer fetch si la mesa está en estado AVAILABLE o CLOSED
    // Verificamos AMBOS: el estado en selectedTable Y el estado en el store tables
    // Si CUALQUIERA es AVAILABLE, no hacemos fetch (la mesa se está liberando)
    const tableInStore = tables.find((t) => t.id === selectedTable?.id);
    const stateInStore = tableInStore?.state;
    const stateInSelected = selectedTable?.state;

    // Si la mesa está AVAILABLE o CLOSED en CUALQUIERA de los dos lugares, limpiar y no hacer fetch
    if (
      stateInSelected === TableState.AVAILABLE ||
      stateInSelected === TableState.CLOSED ||
      stateInStore === TableState.AVAILABLE ||
      stateInStore === TableState.CLOSED
    ) {
      // Limpiar el estado cuando la mesa está disponible o cerrada
      setSelectedOrderByTable(null);
      setConfirmedProducts([]);
      setSelectedProducts([]);
      setSelectedToppingsByProduct({});
      setToppingsByProductGroup({});
      return;
    }
    fetchOrderBySelectedTable();
  }, [fetchOrderBySelectedTable, selectedTable, tables]);

  const checkStockAvailability = async (
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

  const handleSelectedProducts = async (product: ProductResponse) => {
    const foundProduct = selectedProducts.find(
      (p) => p.productId === product.id
    );

    const newQuantity = foundProduct ? foundProduct.quantity + 1 : 1;
    const toppingsPerUnit = selectedToppingsByProduct[product.id] ?? [];

    // Verificar stock como antes (las promociones con slots ya fueron interceptadas en OrderEditor)
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
        commentOfProduct: product.commentOfProduct,
        availableToppingGroups: product.availableToppingGroups,
      };
      setSelectedProducts([...selectedProducts, newProduct]);
    }
    if (product.allowsToppings) {
      setHighlightedProducts((prev) => new Set(prev).add(product.id));
    }
  };

  const handleAddTopping = async (productId: string, toppingIds: string[]) => {
    setSelectedProducts((prevProducts) =>
      prevProducts.map((p) =>
        p.productId === productId ? { ...p, toppingsIds: toppingIds } : p
      )
    );
  };

  const clearToppings = () => {
    setToppingsByProductGroup({});
    setSelectedToppingsByProduct({});
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
    setHighlightedProducts((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Listener para evento de ticket impreso
  useEffect(() => {
    if (typeof window === "undefined") return; // Solo en cliente

    // Asegurar conexión WebSocket
    const socket = webSocketService.connect();

    const handleTicketPrinted = async (data: any) => {
      // El data que viene del WebSocket puede ser { order: Order } o directamente Order
      const orderData = data.order || data;
      const orderId = orderData.id;
      const orderTableId = orderData.table?.id || orderData.tableId;

      // Verificar si la orden pertenece a la mesa seleccionada, es la orden seleccionada, existe en el store,
      // o si la mesa de la orden está en el store de mesas (para actualizar cuando se seleccione después)
      const orderTableInStore = tables.some((t) => t.id === orderTableId);

      // Verificar si la orden pertenece a la mesa seleccionada (incluso si selectedOrderByTable no está actualizado)
      const orderBelongsToSelectedTable =
        selectedTable?.orders?.includes(orderId) ||
        selectedTable?.id === orderTableId;

      const belongsToSelectedTable =
        orderBelongsToSelectedTable ||
        selectedOrderByTable?.id === orderId ||
        orders.some((o) => o.id === orderId) ||
        orderTableInStore;

      if (belongsToSelectedTable && token) {
        try {
          // Hacer fetch de la orden completa adaptada desde el backend
          const response = await fetch(`${URI_ORDER}/${orderId}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const orderData: IOrderDetails = await response.json();

            // Verificar si debemos actualizar selectedOrderByTable
            const isSelectedOrder = selectedOrderByTable?.id === orderId;
            const isSelectedTable = selectedTable?.id === orderTableId;
            // También verificar si la orden pertenece a la mesa seleccionada (incluso si selectedOrderByTable no está actualizado)
            // Esto es CRÍTICO: cuando el encargado está viendo la mesa, la orden debe actualizarse aunque selectedOrderByTable no esté sincronizado
            const orderBelongsToSelectedTable =
              selectedTable?.orders?.includes(orderId) ||
              selectedTable?.id === orderTableId;
            // SIEMPRE actualizar si la orden pertenece a la mesa seleccionada
            const shouldUpdateSelectedOrder =
              isSelectedOrder ||
              isSelectedTable ||
              orderBelongsToSelectedTable ||
              orders.some((o) => o.id === orderId); // También si existe en el store

            // SIEMPRE actualizar selectedOrderByTable si la orden pertenece a la mesa seleccionada
            // Esto es crítico para que el estado se actualice correctamente cuando se imprime desde otra tablet
            if (shouldUpdateSelectedOrder) {
              // Asegurar que el estado sea 'pending_payment' cuando se imprime el ticket
              const newState =
                orderData.state === OrderState.PENDING_PAYMENT
                  ? OrderState.PENDING_PAYMENT
                  : orderData.state || OrderState.PENDING_PAYMENT;

              setSelectedOrderByTable({
                ...orderData,
                state: newState,
              });
            }

            // SIEMPRE actualizar confirmedProducts si:
            // 1. Es la orden seleccionada (isSelectedOrder) - CRÍTICO: mantener productos visibles
            // 2. Pertenece a la mesa seleccionada (isSelectedTable)
            // 3. Existe en el store de órdenes
            // 4. La mesa está en el store de mesas
            // 5. O si vamos a actualizar selectedOrderByTable (shouldUpdateSelectedOrder)
            // Esto es crítico porque cuando se imprime desde otra tablet, necesitamos mantener los productos visibles
            const shouldUpdateProducts =
              isSelectedOrder || // Si es la orden seleccionada, SIEMPRE actualizar productos (más importante)
              isSelectedTable ||
              orders.some((o) => o.id === orderId) ||
              orderTableInStore ||
              shouldUpdateSelectedOrder; // Si actualizamos selectedOrderByTable, también actualizar productos

            // SIEMPRE actualizar confirmedProducts si se cumple alguna condición
            // Esto debe hacerse DESPUÉS de actualizar selectedOrderByTable para mantener consistencia
            if (
              orderData.products &&
              orderData.products.length > 0 &&
              shouldUpdateProducts
            ) {
              // Adaptar ProductLineDto[] a SelectedProductsI[]
              // El backend devuelve ProductLineDto con unitaryPrice: number
              // pero SelectedProductsI espera unitaryPrice?: string | null
              const adaptedProducts: SelectedProductsI[] =
                orderData.products.map((product: any) => ({
                  productId: product.productId,
                  productName: product.productName,
                  quantity: product.quantity,
                  unitaryPrice:
                    product.unitaryPrice != null
                      ? String(product.unitaryPrice)
                      : null,
                  commentOfProduct: product.commentOfProduct || null,
                  allowsToppings: product.allowsToppings,
                  // Los toppings vienen como ToppingSummaryDto[] pero SelectedProductsI espera toppingsPerUnit?: string[][]
                  // Por ahora no mapeamos los toppings ya que no se usan en confirmedProducts
                }));
              handleSetProductsByOrder(adaptedProducts);
            }
          } else {
            console.error(
              "Error en respuesta orderTicketPrinted:",
              response.status
            );
          }
        } catch (error) {
          console.error("Error al obtener la orden actualizada:", error);
        }
      }
    };

    // Registrar el listener cuando el socket esté conectado
    const registerListener = () => {
      if (webSocketService.isConnected()) {
        // Registrar listener para orderTicketPrinted
        webSocketService.on("orderTicketPrinted", handleTicketPrinted);
        // También registrar listener para orderUpdatedPending como alternativa
        // (este evento también se emite cuando se imprime el ticket)
        webSocketService.on("orderUpdatedPending", handleTicketPrinted);
      } else {
        socket.once("connect", () => {
          webSocketService.on("orderTicketPrinted", handleTicketPrinted);
          webSocketService.on("orderUpdatedPending", handleTicketPrinted);
        });
      }
    };

    registerListener();

    return () => {
      webSocketService.off("orderTicketPrinted", handleTicketPrinted);
      webSocketService.off("orderUpdatedPending", handleTicketPrinted);
    };
  }, [
    selectedTable,
    selectedOrderByTable,
    token,
    handleSetProductsByOrder,
    orders,
    tables,
  ]);

  // Listener para evento de orden cancelada/eliminada
  useEffect(() => {
    if (typeof window === "undefined") return; // Solo en cliente

    const socket = webSocketService.connect();

    const handleOrderDeleted = async (data: any) => {
      // El data que viene del WebSocket puede ser { order: Order } o directamente Order
      const orderData = data.order || data;
      const orderId = orderData.id;
      // Cuando se cancela, la orden puede no tener table (se establece en null)
      // Necesitamos obtener el tableId de otra forma o de la orden en el store
      const orderTableId = orderData.table?.id || orderData.tableId;

      // Si no tenemos tableId de la orden, buscar en el store de órdenes
      let tableId = orderTableId;
      if (!tableId) {
        const orderInStore = orders.find((o) => o.id === orderId);
        tableId = orderInStore?.table?.id;
      }

      // Verificar si la orden cancelada pertenece a la mesa seleccionada o es la orden seleccionada
      // También verificar si la mesa está en el store de mesas
      const { tables } = useTableStore.getState();
      const tableInStore = tables.find((t) => t.id === tableId);
      const belongsToSelectedTable =
        selectedTable?.id === tableId ||
        selectedOrderByTable?.id === orderId ||
        selectedTable?.orders?.includes(orderId) ||
        orders.some((o) => o.id === orderId) ||
        !!tableInStore; // Si la mesa está en el store, también actualizar

      if (belongsToSelectedTable) {
        // Limpiar el estado de la orden SIEMPRE si es la orden seleccionada
        if (selectedOrderByTable?.id === orderId) {
          setSelectedOrderByTable(null);
          setConfirmedProducts([]);
          setSelectedProducts([]);
          setSelectedToppingsByProduct({});
          setToppingsByProductGroup({});
        }

        // Actualizar la mesa a AVAILABLE si la orden pertenece a esa mesa
        if (tableId) {
          // Si es la mesa seleccionada, actualizarla directamente
          if (selectedTable && selectedTable.id === tableId) {
            const updatedTable = {
              ...selectedTable,
              orders:
                selectedTable.orders?.filter(
                  (oId: string) => oId !== orderId
                ) || [],
              state: TableState.AVAILABLE,
            } as ITable;
            setSelectedTable(updatedTable);
          }

          // Actualizar la mesa en el store de mesas
          const { updateTable } = useTableStore.getState();
          if (tableInStore) {
            const finalUpdatedTable = {
              ...tableInStore,
              orders:
                tableInStore.orders?.filter((oId: string) => oId !== orderId) ||
                [],
              state: TableState.AVAILABLE,
            } as ITable;
            updateTable(finalUpdatedTable);

            // Si es la mesa seleccionada, también actualizarla en el contexto
            if (selectedTable?.id === tableId) {
              setSelectedTable(finalUpdatedTable);
            }
          } else {
            // Si la mesa no está en el store pero tenemos el tableId, intentar obtenerla
            try {
              // Usar el endpoint correcto para obtener la mesa
              const response = await fetch(
                `${URI_TABLE}/by-room/${selectedTable?.room?.id || ""}`,
                {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              if (response.ok) {
                const tableData = await response.json();
                const updatedTable = {
                  ...tableData,
                  orders:
                    tableData.orders?.filter(
                      (oId: string) => oId !== orderId
                    ) || [],
                  state: TableState.AVAILABLE,
                } as ITable;
                updateTable(updatedTable);
                if (selectedTable?.id === tableId) {
                  setSelectedTable(updatedTable);
                }
              }
            } catch (error) {
              console.error("Error al obtener mesa desde backend:", error);
            }
          }
        }
      }
    };

    // Registrar el listener cuando el socket esté conectado
    const registerListener = () => {
      if (webSocketService.isConnected()) {
        webSocketService.on("orderDeleted", handleOrderDeleted);
      } else {
        socket.once("connect", () => {
          webSocketService.on("orderDeleted", handleOrderDeleted);
        });
      }
    };

    registerListener();

    return () => {
      webSocketService.off("orderDeleted", handleOrderDeleted);
    };
  }, [selectedTable, selectedOrderByTable, orders, tables, token]);

  const handleDeleteSelectedProduct = (id: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.productId !== id));
    clearToppings();
  };

  const increaseProductNumber = async (product: SelectedProductsI) => {
    const productToUpdate = selectedProducts.find(
      (p) => p.productId === product.productId
    );
    if (productToUpdate) {
      const newQuantity = productToUpdate.quantity + 1;
      // Verifica el stock antes de actualizar
      const stockResponse = await checkStockAvailability(
        product.productId,
        newQuantity
      );
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
          p.productId === product.productId
            ? { ...p, quantity: newQuantity }
            : p
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
        if (response.status === 400) {
          const errorData = await response.json();
          Swal.fire({
            icon: "error",
            title: "Error",
            text: errorData.message,
          });
          return;
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

      clearToppings();

      return updatedOrder;
    } catch (error) {
      console.error(error);
      return;
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
        toppingsByProductGroup,
        checkStockToppingAvailability,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export default OrderProvider;
