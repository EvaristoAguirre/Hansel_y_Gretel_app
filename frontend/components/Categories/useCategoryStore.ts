// import { create } from "zustand";
// import { ICategory } from "../Interfaces/ICategories";

// interface CategoryState {
//   categories: ICategory[];
//   setCategories: (categories: ICategory[]) => void;
//   addCategory: (category: ICategory) => void;
//   removeCategory: (id: string) => void;
//   updateCategory: (updatedCategory: ICategory) => void;
//   connectWebSocket: () => void;
// }

// export const useCategoryStore = create<CategoryState>((set) => ({
//   categories: [],
//   setCategories: (categories) => set({ categories }),
//   addCategory: (category) =>
//     set((state) => ({ categories: [...state.categories, category] })),
//   removeCategory: (id) =>
//     set((state) => ({
//       categories: state.categories.filter((category) => category.id !== id),
//     })),
//   updateCategory: (updatedCategory) =>
//     set((state) => ({
//       categories: state.categories.map((category) =>
//         category.id === updatedCategory.id ? updatedCategory : category
//       ),
//     })),
//   connectWebSocket: () => {
//     const socket = new WebSocket("ws://192.168.100.133:3000");

//     socket.onmessage = (event) => {
//       const { action, data } = JSON.parse(event.data);

//       set((state) => {
//         switch (action) {
//           case "category.created":
//             return { categories: [...state.categories, data] };
//           case "category.deleted":
//             return {
//               categories: state.categories.filter((cat) => cat.id !== data.id),
//             };
//           case "category.updated":
//             return {
//               categories: state.categories.map((cat) =>
//                 cat.id === data.id ? data : cat
//               ),
//             };
//           default:
//             return state;
//         }
//       });
//     };

//     socket.onopen = () => {
//       console.log("WebSocket conectado");
//     };

//     socket.onerror = (error) => {
//       console.error("Error en WebSocket:", error);
//     };

//     socket.onclose = () => {
//       console.log("WebSocket cerrado");
//     };
//   },
// }));

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

export const useCategoryStore = create<CategoryState>((set) => {
  const socket = io("http://192.168.100.133:3000"); // Usa la IP del backend

  socket.on("connect", () => {
    console.log("✅ Conectado a WebSocket - Categorías");
  });

  socket.on("categoryCreated", (data) => {
    console.log("🟢 Nueva categoría creada:", data);
    set((state) => ({ categories: [...state.categories, data] }));
  });

  socket.on("categoryUpdated", (data) => {
    console.log("🟡 Categoría actualizada:", data);
    set((state) => ({
      categories: state.categories.map((category) =>
        category.id === data.id ? data : category
      ),
    }));
  });

  socket.on("categoryDeleted", (data) => {
    console.log("🔴 Categoría eliminada:", data);
    set((state) => ({
      categories: state.categories.filter((category) => category.id !== data.id),
    }));
  });

  socket.on("disconnect", () => {
    console.log("❌ Desconectado del servidor WebSocket - Categorías");
  });

  return {
    categories: [],
    setCategories: (categories) => set({ categories }),
    addCategory: (category) => set((state) => ({ categories: [...state.categories, category] })),
    removeCategory: (id) =>
      set((state) => ({ categories: state.categories.filter((c) => c.id !== id) })),
    updateCategory: (updatedCategory) =>
      set((state) => ({
        categories: state.categories.map((c) =>
          c.id === updatedCategory.id ? updatedCategory : c
        ),
      })),
    connectWebSocket: () => {}, // La conexión se establece automáticamente al cargar el store
  };
});
