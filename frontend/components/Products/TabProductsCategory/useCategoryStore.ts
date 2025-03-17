import { create } from "zustand";
import { ICategory } from "../../Interfaces/ICategories";

interface CategoryState {
  categories: ICategory[];
  setCategories: (categories: ICategory[]) => void;
  addCategory: (category: ICategory) => void;
  removeCategory: (id: string) => void;
  updateCategory: (updatedCategory: ICategory) => void;
  connectWebSocket: () => void;
}

export const useCategoryStore = create<CategoryState>((set) => ({
  categories: [],
  setCategories: (categories) => set({ categories }),
  addCategory: (category) =>
    set((state) => ({ categories: [...state.categories, category] })),
  removeCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((category) => category.id !== id),
    })),
  updateCategory: (updatedCategory) =>
    set((state) => ({
      categories: state.categories.map((category) =>
        category.id === updatedCategory.id ? updatedCategory : category
      ),
    })),
  connectWebSocket: () => {
    const socket = new WebSocket("ws://localhost:3000");

    socket.onmessage = (event) => {
      const { action, data } = JSON.parse(event.data);

      set((state) => {
        switch (action) {
          case "category.created":
            return { categories: [...state.categories, data] };
          case "category.deleted":
            return {
              categories: state.categories.filter((cat) => cat.id !== data.id),
            };
          case "category.updated":
            return {
              categories: state.categories.map((cat) =>
                cat.id === data.id ? data : cat
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
