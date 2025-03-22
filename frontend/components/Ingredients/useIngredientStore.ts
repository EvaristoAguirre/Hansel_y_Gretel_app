import { create } from "zustand";
import { io } from "socket.io-client";

// Definimos la interfaz del estado
interface IngredientState {
  ingredients: Ingredient[];
  setIngredients: (ingredients: Ingredient[]) => void;
  addIngredient: (ingredient: Ingredient) => void;
  removeIngredient: (id: string) => void;
  updateIngredient: (ingredient: Ingredient) => void;
}

// Definimos la interfaz del ingrediente
interface Ingredient {
  id: string;
  name: string;
  isActive: boolean;
  description?: string;
  cost?: number;
  unitOfMeasureId?: string;
}

export const useIngredientStore = create<IngredientState>((set) => {
  const socket = io("http://localhost:3000"); // Cambia la URL según tu backend

  socket.on("connect", () => {
    console.log("✅ Conectado a WebSocket - Ingredients");
  });

  socket.on("ingredientCreated", (data: Ingredient) => {
    console.log("🟢 Nuevo ingrediente creado:", data);
    set((state) => ({ ingredients: [...state.ingredients, data] }));
  });

  socket.on("ingredientUpdated", (data: Ingredient) => {
    console.log("🟡 Ingrediente actualizado:", data);
    set((state) => ({
      ingredients: state.ingredients.map((ingredient) =>
        ingredient.id === data.id ? data : ingredient
      ),
    }));
  });

  socket.on("ingredientDeleted", (data: { id: string }) => {
    console.log("🔴 Ingrediente eliminado:", data);
    set((state) => ({
      ingredients: state.ingredients.filter((ingredient) => ingredient.id !== data.id),
    }));
  });

  socket.on("disconnect", () => {
    console.log("❌ Desconectado del servidor WebSocket - Ingredients");
  });

  return {
    ingredients: [],
    setIngredients: (ingredients) => set({ ingredients }),
    addIngredient: (ingredient) => set((state) => ({ ingredients: [...state.ingredients, ingredient] })),
    removeIngredient: (id) =>
      set((state) => ({ ingredients: state.ingredients.filter((ingredient) => ingredient.id !== id) })),
    updateIngredient: (updatedIngredient) =>
      set((state) => ({
        ingredients: state.ingredients.map((ingredient) =>
          ingredient.id === updatedIngredient.id ? updatedIngredient : ingredient
        ),
      })),
  };
});
