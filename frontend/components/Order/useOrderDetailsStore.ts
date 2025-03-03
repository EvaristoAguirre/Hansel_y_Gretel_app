import { create } from "zustand";
import { OrderCreated } from "./useOrderStore";

export interface OrderDetailsCreated {
  id: string;
  quantity: number;
  unitaryPrice: number;
  subtotal: number;
  product: string;
  Order: OrderCreated;
}

interface OrderDetailsState {
  orderDetails: OrderDetailsCreated[];
  setOrderDetails: (details: OrderDetailsCreated[]) => void;
  addOrderDetails: (detail: OrderDetailsCreated) => void;
  removeOrderDetails: (id: string) => void;
  updateOrderDetails: (updatedDetail: OrderDetailsCreated) => void;
  connectWebSocket: () => void;
}

export const useOrderDetailsStore = create<OrderDetailsState>((set) => ({
  orderDetails: [],
  setOrderDetails: (orderDetails) => set({ orderDetails }),
  addOrderDetails: (orderDetail) =>
    set((state) => ({ orderDetails: [...state.orderDetails, orderDetail] })),
  removeOrderDetails: (id) =>
    set((state) => ({
      orderDetails: state.orderDetails.filter((orderDetail) => orderDetail.id !== id),
    })),
  updateOrderDetails: (updatedOrderDetail) =>
    set((state) => ({
      orderDetails: state.orderDetails.map((orderDetail) =>
        orderDetail.id === updatedOrderDetail.id ? updatedOrderDetail : orderDetail),
    })),
  connectWebSocket: () => {
    const socket = new WebSocket("ws://your-websocket-url");

    socket.onmessage = (event) => {
      const { action, data } = JSON.parse(event.data);
      set((state) => {
        switch (action) {
          case "orderDetails.created":
            return { orderDetails: [...state.orderDetails, data] };
          case "orderDetails.deleted":
            return {
              orderDetails: state.orderDetails.filter(
                (orderDetail) => orderDetail.id !== data.id
              ),
            };
          case "orderDetails.updated":
            return {
              orderDetails: state.orderDetails.map((orderDetail) =>
                orderDetail.id === data.id ? data : orderDetail
              ),
            };
          default:
            return state;
        }
      });
    };

    socket.onopen = () => {
      console.log("WebSocket conectado - OrderDetails");
    };

    socket.onerror = (error) => {
      console.error("Error en WebSocket - OrderDetails:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket cerrado - OrderDetails");
    };
  },
}));
