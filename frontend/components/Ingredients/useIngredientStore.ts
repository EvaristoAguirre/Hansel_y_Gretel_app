import { create } from "zustand";
import { io } from "socket.io-client";
import {
  IngredientCreated,
  IngredientState,
  IngredientResponseDTO,
} from "../Interfaces/IIngredients";

export const useIngredientStore = create<IngredientState>((set) => {
  //const socket = io("http://192.168.0.50:3000"); // Usa la IP de tu backend
  const socket = io("http://localhost:3000"); // Cambiar por la IP de tu backend si es necesario

  socket.on("connect", () => {
    console.log("✅ Conectado a WebSocket - Ingredients");
  });

  socket.on("ingredientCreated", (data) => {
    set((state) => {
      const exists = state.ingredients.some(
        (ingredient) => ingredient.id === data.id
      );
      if (!exists) {
        const parsedIngredient: IngredientCreated = {
          ...data,
          unitOfMeasure: data.unitOfMeasure ?? null,
          stock: data.stock ?? null,
        };
        return { ingredients: [...state.ingredients, parsedIngredient] };
      }
      return state;
    });
  });

  socket.on("ingredientUpdated", (data) => {
    set((state) => ({
      ingredients: state.ingredients.map((ingredient) =>
        ingredient.id === data.id ? data : ingredient
      ),
    }));
  });

  socket.on("ingredientDeleted", (data) => {
    set((state) => ({
      ingredients: state.ingredients.filter(
        (ingredient) => ingredient.id !== data.id
      ),
    }));
  });

  socket.on("disconnect", () => {
    console.log("❌ Desconectado del servidor WebSocket - Ingredients");
  });

  return {
    ingredients: [],
    setIngredients: (ingredients: IngredientResponseDTO[]) => {
      const parsedIngredients = ingredients.map((ingredient) => ({
        ...ingredient,
        unitOfMeasure: ingredient.unitOfMeasure ?? null,
        stock: ingredient.stock ?? null,
      }));
      set({ ingredients: parsedIngredients });
    },
    addIngredient: (ingredient: IngredientCreated) => {
      set((state) => ({ ingredients: [...state.ingredients, ingredient] }));
    },
    removeIngredient: (id: string) => {
      set((state) => ({
        ingredients: state.ingredients.filter(
          (ingredient) => ingredient.id !== id
        ),
      }));
    },
    updateIngredient: (updatedIngredient: IngredientCreated) => {
      set((state) => ({
        ingredients: state.ingredients.map((ingredient) =>
          ingredient.id === updatedIngredient.id
            ? updatedIngredient
            : ingredient
        ),
      }));
    },
    connectWebSocket: () => {
      /* conexión automática */
    },
  };
});
