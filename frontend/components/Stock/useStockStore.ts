import { create } from "zustand";
import { io } from "socket.io-client";
import { StockModalType } from "../Enums/view-products";

export interface Stock {
  id?: string;
  quantityInStock: number;
  minimumStock: number;
  productId?: string;
  ingredientId?: string;
  unitOfMeasureId: string;
}

interface StockState {
  stocks: Stock[];
  setStocks: (stocks: Stock[]) => void;
  addStock: (stock: Stock) => void;
  removeStock: (id: string) => void;
  updateStock: (updatedStock: Stock) => void;
  connectWebSocketStock: () => void;
}

export const useStockStore = create<StockState>((set) => {
  const socket = io("http://localhost:3000");

  socket.on("connect", () => {
    console.log("✅ Conectado a WebSocket - Stock");
  });

  // Función para agregar un stock al array
  socket.on("stock.created", ({ stock }: { stock: Stock }) => {
    console.log("🟢 Stock creado:", stock);
    set((state) => ({ stocks: [...state.stocks, stock] }));
  });

  // Función para actualizar un stock existente
  socket.on("stock.updated", ({ stock }: { stock: Stock }) => {
    console.log("🟡 Stock actualizado:", stock);
    set((state) => ({
      stocks: state.stocks.map((s) =>
        s.id === stock.id ? { ...s, ...stock } : s
      ),
    }));
  });

  // Función para eliminar un stock
  socket.on("stock.deleted", ({ id }: { id: string }) => {
    console.log("🔴 Stock eliminado:", id);
    set((state) => ({
      stocks: state.stocks.filter((stock) => stock.id !== id),
    }));
  });

  // Conectar WebSocket al cargar el store
  socket.on("disconnect", () => {
    console.log("❌ Desconectado del servidor WebSocket - Stock");
  });

  return {
    stocks: [],
    setStocks: (stocks) => set({ stocks }), // Setea todos los stocks
    addStock: (stock) => set((state) => ({ stocks: [...state.stocks, stock] })), // Agrega un nuevo stock
    removeStock: (id) =>
      set((state) => ({
        stocks: state.stocks.filter((stock) => stock.id !== id),
      })), // Elimina un stock por ID
    updateStock: (updatedStock) =>
      set((state) => ({
        stocks: state.stocks.map((s) =>
          s.id === updatedStock.id ? { ...s, ...updatedStock } : s
        ),
      })), // Actualiza un stock existente
    connectWebSocketStock: () => {}, // Conexión establecida al cargar el store
  };
});
