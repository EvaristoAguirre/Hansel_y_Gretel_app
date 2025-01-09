import { create } from "zustand";
import { OrderState } from "../Enums/Enums";
import { OrderDetailsCreated } from "./useOrderDetailsStore";

export interface OrderCreated {
  id: string;
  date: Date;
  state: OrderState;
  isActive: boolean;
  table: string;
  orderDetails: OrderDetailsCreated[];
}

interface OrderStateZustand {
  orders: OrderCreated[];
  setOrders: (products: OrderCreated[]) => void;
  addOrder: (product: OrderCreated) => void;
  removeOrder: (id: string) => void;
  updateOrder: (updatedOrder: OrderCreated) => void;
  connectWebSocket: () => void;
}

export const useOrderStore = create<OrderStateZustand>((set) => ({
  orders: [],
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
