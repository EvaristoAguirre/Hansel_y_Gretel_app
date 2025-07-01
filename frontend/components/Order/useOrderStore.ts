import { create } from "zustand";
import { io } from "socket.io-client";
import { IOrderDetails } from "../Interfaces/IOrder";

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
  const socket = io("http://192.168.0.50:3000");
  // const socket = io("http://localhost:3000");

  socket.on("connect", () => {
    console.log("✅ Conectado a WebSocket - Order");
  });

  socket.on("orderCreated", (data) => {
    console.log("🟢 Nueva orden creada:", data);
    set((state) => ({ orders: [...state.orders, data] }));
  });

  socket.on("orderUpdated", (data) => {
    console.log("🟡 Orden actualizada:", data);
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === data.id ? data : order
      ),
    }));
  });

  socket.on("orderUpdatedPending", (data) => {
    console.log("🟠 Orden marcada como pendiente de pago:", data);
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === data.id ? { ...order, status: "pending_payment" } : order
      ),
    }));
  });

  socket.on("orderUpdatedClose", (data) => {
    console.log("🟢 Orden marcada como cerrada:", data);
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === data.id ? { ...order, status: "closed" } : order
      ),
    }));
  });

  socket.on("orderDeleted", (data) => {
    console.log("🔴 Orden eliminada:", data);
    set((state) => ({
      orders: state.orders.filter((order) => order.id !== data.id),
    }));
  });

  socket.on("disconnect", () => {
    console.log("❌ Desconectado del servidor WebSocket - Order");
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
    connectWebSocket: () => {},
  };
});
