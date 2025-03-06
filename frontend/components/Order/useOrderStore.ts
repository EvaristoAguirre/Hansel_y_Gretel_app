import { create } from "zustand";
import { IOrderDetails } from "../Interfaces/IOrderDetails";

interface OrderStateZustand {
  orders: IOrderDetails[];
  findOrderByTableId: (tableId: string) => IOrderDetails | null;
  setOrders: (orders: IOrderDetails[]) => void;
  addOrder: (order: IOrderDetails) => void;
  removeOrder: (id: string) => void;
  updateOrder: (updatedOrder: IOrderDetails) => void;
  connectWebSocket: () => void;
}

export const useOrderStore = create<OrderStateZustand>((set, get) => ({
  orders: [],
  findOrderByTableId: (tableId: string) => {
    const orders = get().orders;
    return orders.find((order) => order.table.id === tableId) || null;
  },
  setOrders: (orders) => set({ orders }),
  addOrder: (order) =>
    set((state) => ({ orders: [...state.orders, order] })),
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
    const socket = new WebSocket("ws://localhost:3000");

    socket.onmessage = (event) => {
      const { action, data } = JSON.parse(event.data);

      set((state) => {
        switch (action) {
          case "order.created":
            return { orders: [...state.orders, data] };
          case "order.deleted":
            return {
              orders: state.orders.filter((ord) => ord.id !== data.id),
            };
          case "order.updated":
            return {
              orders: state.orders.map((ord) =>
                ord.id === data.id ? data : ord
              ),
            };
          default:
            return state;
        }
      });
    };

    socket.onopen = () => {
      console.log("WebSocket conectado - Order");
    };

    socket.onerror = (error) => {
      console.error("Error en WebSocket - Order:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket cerrado - Order");
    };
  },
}));
