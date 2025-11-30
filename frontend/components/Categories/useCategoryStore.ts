import { create } from "zustand";
import { ICategory } from "../Interfaces/ICategories";
import { webSocketService } from "@/services/websocket.service";

interface CategoryState {
  categories: ICategory[];
  setCategories: (categories: ICategory[]) => void;
  addCategory: (category: ICategory) => void;
  removeCategory: (id: string) => void;
  updateCategory: (updatedCategory: ICategory) => void;
  connectWebSocket: () => void;
}

export const useCategoryStore = create<CategoryState>((set) => {
  // Conectar al servicio centralizado de WebSocket
  const socket = webSocketService.connect();

  socket.on("connect", () => {
    console.log("✅ Conectado a WebSocket - Categorías");
  });

  webSocketService.on("categoryCreated", (data) => {
    set((state) => ({ categories: [...state.categories, data] }));
  });

  webSocketService.on("categoryUpdated", (data) => {
    set((state) => ({
      categories: state.categories.map((category) =>
        category.id === data.id ? data : category
      ),
    }));
  });

  webSocketService.on("categoryDeleted", (data) => {
    set((state) => ({
      categories: state.categories.filter(
        (category) => category.id === data.id
      ),
    }));
  });

  socket.on("disconnect", () => {
    console.log("❌ Desconectado del servidor WebSocket - Categorías");
  });

  return {
    categories: [],
    setCategories: (categories) => set({ categories }),
    addCategory: (category) =>
      set((state) => ({ categories: [...state.categories, category] })),
    removeCategory: (id) =>
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
      })),
    updateCategory: (updatedCategory) =>
      set((state) => ({
        categories: state.categories.map((c) =>
          c.id === updatedCategory.id ? updatedCategory : c
        ),
      })),
    connectWebSocket: () => {
      // La conexión se establece automáticamente al cargar el store
      webSocketService.connect();
    },
  };
});
