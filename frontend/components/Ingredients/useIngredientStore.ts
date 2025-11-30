import { create } from 'zustand';
import {
  IngredientCreated,
  IngredientState,
  IngredientResponseDTO,
} from '../Interfaces/IIngredients';
import { webSocketService } from '@/services/websocket.service';

export const useIngredientStore = create<IngredientState>((set) => {
  // Conectar al servicio centralizado de WebSocket
  const socket = webSocketService.connect();

  socket.on('connect', () => {
    console.log('✅ Conectado a WebSocket - Ingredientes');
  });

  webSocketService.on('ingredientCreated', (data) => {
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

  webSocketService.on('ingredientUpdated', (data) => {
    set((state) => ({
      ingredients: state.ingredients.map((ingredient) =>
        ingredient.id === data.id ? data : ingredient
      ),
    }));
  });

  webSocketService.on('ingredientDeleted', (data) => {
    set((state) => ({
      ingredients: state.ingredients.filter(
        (ingredient) => ingredient.id !== data.id
      ),
    }));
  });

  socket.on('disconnect', () => {
    console.log('❌ Desconectado del servidor WebSocket - Ingredientes');
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
      // La conexión se establece automáticamente al cargar el store
      webSocketService.connect();
    },
  };
});
