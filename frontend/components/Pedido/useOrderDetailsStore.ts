import { create } from "zustand";
import { OrderCreated } from "./useOrderStore";

export interface OrderDetailsCreated {
  id: string;
  cantity: number;
  unitaryPrice: number;
  subtotal: number;
  product: string;
  Order: OrderCreated;
}

interface OrderDetailsState {
  OrderDetails: OrderDetailsCreated[];
  setOrderDetails: (details: OrderDetailsCreated[]) => void;
  addOrderDetails: (detail: OrderDetailsCreated) => void;
  removeOrderDetails: (id: string) => void;
  updateOrderDetails: (updatedDetail: OrderDetailsCreated) => void;
  connectWebSocket: () => void;
}

const useOrderDetailsStore = create<OrderDetailsState>((set) => ({
  OrderDetails: [],
  setOrderDetails: (details) => set({ OrderDetails: details }),
  addOrderDetails: (detail) => set((state) => ({ OrderDetails: [...state.OrderDetails, detail] })),
  removeOrderDetails: (id) => set((state) => ({
    OrderDetails: state.OrderDetails.filter((detail) => detail.id !== id),
  })),
  updateOrderDetails: (updatedDetail) => set((state) => ({
    OrderDetails: state.OrderDetails.map((detail) =>
      detail.id === updatedDetail.id ? updatedDetail : detail
    ),
  })),
  connectWebSocket: () => {
    const socket = new WebSocket("ws://your-websocket-url");

    socket.onmessage = (event) => {
      const { action, data } = JSON.parse(event.data);
      set((state) => {
        switch (action) {
          case "orderDetails.created":
            return { OrderDetails: [...state.OrderDetails, data] };
          case "orderDetails.deleted":
            return {
              OrderDetails: state.OrderDetails.filter((detail) => detail.id !== data.id),
            };
          case "orderDetails.updated":
            return {
              OrderDetails: state.OrderDetails.map((detail) =>
                detail.id === data.id ? data : detail
              ),
            };
          default:
            return state;
        }
      });
    };

    socket.onopen = () => {
      console.log("WebSocket conectado");
    };

    socket.onerror = (error) => {
      console.error("Error en WebSocket:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket cerrado");
    };
  },
}));
