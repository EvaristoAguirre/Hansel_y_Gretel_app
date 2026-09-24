import { create } from 'zustand';
import { IOrderDetails } from '../Interfaces/IOrder';
import { OrderState } from '../Enums/order';
import { webSocketService } from '@/services/websocket.service';
import { useTableStore } from '../Table/useTableStore';

function normalizeOrderPayload(data: any): any {
  return data?.order || data;
}

interface OrderStateZustand {
  orders: IOrderDetails[];
  error: string | null;
  findOrderByTableId: (tableId: string) => IOrderDetails | null;
  setOrders: (orders: IOrderDetails[]) => void;
  setError: (msg: string | null) => void;
  addOrder: (order: IOrderDetails) => void;
  removeOrder: (id: string) => void;
  updateOrder: (updatedOrder: IOrderDetails) => void;
  connectWebSocket: () => void;
}

let orderListenersBound = false;

export const useOrderStore = create<OrderStateZustand>((set, get) => {
  const bindOrderListeners = () => {
    if (orderListenersBound) return;
    orderListenersBound = true;

    const socket = webSocketService.connect();

    socket.on('connect', () => {
      console.log('✅ Conectado a WebSocket - Pedidos');
    });

    webSocketService.on('orderCreated', (data) => {
      const order = normalizeOrderPayload(data);
      if (!order?.id) return;
      set((state) => {
        if (state.orders.some((o) => o.id === order.id)) {
          return {
            orders: state.orders.map((o) => (o.id === order.id ? { ...o, ...order } : o)),
          };
        }
        return { orders: [...state.orders, order] };
      });
    });

    webSocketService.on('orderUpdated', (data) => {
      const order = normalizeOrderPayload(data);
      if (!order?.id) return;
      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === order.id ? { ...o, ...order } : o
        ),
      }));
    });

    webSocketService.on('orderUpdatedPending', (data) => {
      const order = normalizeOrderPayload(data);
      if (!order?.id) return;
      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === order.id
            ? { ...o, ...order, state: OrderState.PENDING_PAYMENT }
            : o
        ),
      }));
    });

    webSocketService.on('orderUpdatedClose', (data) => {
      const order = normalizeOrderPayload(data);
      if (!order?.id) return;
      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === order.id ? { ...o, ...order, state: OrderState.CLOSED } : o
        ),
      }));
      if (order.table?.id) {
        const { tables, updateTable } = useTableStore.getState();
        const tableInStore = tables.find((t) => t.id === order.table.id);
        if (tableInStore) {
          updateTable({ ...tableInStore, ...order.table });
        }
      }
    });

    webSocketService.on('orderDeleted', (data) => {
      const order = normalizeOrderPayload(data);
      const id = order?.id || data?.orderId || data?.id;
      if (!id) return;
      set((state) => ({
        orders: state.orders.filter((o) => o.id !== id),
      }));
    });

    webSocketService.on('orderTicketPrinted', (data) => {
      const order = normalizeOrderPayload(data);
      if (!order?.id) return;
      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === order.id
            ? {
                ...o,
                ...order,
                ticketPrinted: true,
                state: OrderState.PENDING_PAYMENT,
              }
            : o
        ),
      }));
    });

    socket.on('disconnect', () => {
      console.log('❌ Desconectado del servidor WebSocket - Pedidos');
    });
  };

  return {
    orders: [],
    error: null,
    setError: (msg) => set({ error: msg }),
    findOrderByTableId: (tableId) => {
      return (
        get().orders.find((order) => order.table?.id === tableId) || null
      );
    },
    setOrders: (orders) => set({ orders }),
    addOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),
    removeOrder: (id) =>
      set((state) => ({
        orders: state.orders.filter((order) => order.id !== id),
      })),
    updateOrder: (updatedOrder) =>
      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order
        ),
      })),
    connectWebSocket: () => {
      webSocketService.connect();
      bindOrderListeners();
    },
  };
});
