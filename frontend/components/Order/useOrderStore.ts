import { create } from 'zustand';
import { IOrderDetails } from '../Interfaces/IOrder';
import { webSocketService } from '@/services/websocket.service';

interface OrderStateZustand {
  orders: IOrderDetails[];
  findOrderByTableId: (tableId: string) => IOrderDetails | null;
  setOrders: (orders: IOrderDetails[]) => void;
  addOrder: (order: IOrderDetails) => void;
  removeOrder: (id: string) => void;
  updateOrder: (updatedOrder: IOrderDetails) => void;
  connectWebSocket: () => void;
}

export const useOrderStore = create<OrderStateZustand>((set, get) => {
  // Conectar al servicio centralizado de WebSocket
  const socket = webSocketService.connect();

  socket.on('connect', () => {
    console.log('✅ Conectado a WebSocket - Pedidos');
  });

  webSocketService.on('orderCreated', (data) => {
    set((state) => ({ orders: [...state.orders, data] }));
  });

  webSocketService.on('orderUpdated', (data) => {
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === data.id ? data : order
      ),
    }));
  });

  webSocketService.on('orderUpdatedPending', (data) => {
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === data.id ? { ...order, status: 'pending_payment' } : order
      ),
    }));
  });

  webSocketService.on('orderUpdatedClose', (data) => {
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === data.id ? { ...order, status: 'closed' } : order
      ),
    }));
  });

  webSocketService.on('orderDeleted', (data) => {
    set((state) => ({
      orders: state.orders.filter((order) => order.id !== data.id),
    }));
  });

  webSocketService.on('orderTicketPrinted', (data) => {
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === data.id
          ? { ...order, ticketPrinted: true, status: 'pending_payment' }
          : order
      ),
    }));
  });

  socket.on('disconnect', () => {
    console.log('❌ Desconectado del servidor WebSocket - Pedidos');
  });

  return {
    orders: [],
    findOrderByTableId: (tableId) => {
      return get().orders.find((order) => order.table.id === tableId) || null;
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
      // La conexión se establece automáticamente al cargar el store
      webSocketService.connect();
    },
  };
});
