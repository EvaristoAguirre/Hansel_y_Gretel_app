import { create } from "zustand";
import { OrderState } from "../Enums/Enums";
import { OrderDetailsCreated } from "./useOrderDetailsStore";
import { MesaInterface } from "../Interfaces/Cafe_interfaces";

export interface OrderCreated {
  commandNumber: string;
  comment: string;
  date: Date;
  id: string;
  isActive: boolean;
  numberCustomers: number;
  // orderDetails: OrderDetailsCreated[]; // No viene en el endpoint
  state: OrderState;
  table: MesaInterface;
  total: string;
}

interface OrderStateZustand {
  orders: OrderCreated[];
  findOrderByTableId: (tableId: string) => OrderCreated | null;
  setOrders: (orders: OrderCreated[]) => void;
  addOrder: (order: OrderCreated) => void;
  removeOrder: (id: string) => void;
  updateOrder: (updatedOrder: OrderCreated) => void;
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
