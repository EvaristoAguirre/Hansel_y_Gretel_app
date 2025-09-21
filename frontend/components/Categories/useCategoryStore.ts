import { create } from "zustand";
import { ICategory } from "../Interfaces/ICategories";
import { io } from "socket.io-client";

interface CategoryState {
  categories: ICategory[];
  setCategories: (categories: ICategory[]) => void;
  addCategory: (category: ICategory) => void;
  removeCategory: (id: string) => void;
  updateCategory: (updatedCategory: ICategory) => void;
  connectWebSocket: () => void;
}
const API_URL_DEV = process.env.NEXT_PUBLIC_API_URL;

export const useCategoryStore = create<CategoryState>((set) => {
  // const socket = io("http://192.168.0.50:3000"); // Usa la IP del backend

  const socket = io(API_URL_DEV);

  socket.on("connect", () => {
    console.log("✅ Conectado a WebSocket - Categorías");
  });

  socket.on("categoryCreated", (data) => {
    set((state) => ({ categories: [...state.categories, data] }));
  });

  socket.on("categoryUpdated", (data) => {
    set((state) => ({
      categories: state.categories.map((category) =>
        category.id === data.id ? data : category
      ),
    }));
  });

  socket.on("categoryDeleted", (data) => {
    set((state) => ({
      categories: state.categories.filter(
        (category) => category.id !== data.id
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
    connectWebSocket: () => { },
  };
});
