import {
  IingredientForm,
  IingredientResponse,
} from "../Interfaces/Ingredients";
import { create } from "zustand";
import { ICategory } from "../Interfaces/ICategories";
import { ProductState } from "../Interfaces/IProducts";
import { webSocketService } from "@/services/websocket.service";

const parseCategories = (categories: ICategory[]): string[] =>
  categories.map((category) => category.id);

export const mapIngredientResponseToForm = (
  ingredient: IingredientResponse
): IingredientForm => ({
  name: ingredient.ingredient.name,
  ingredientId: ingredient.ingredient.id ?? "",
  unitOfMeasureId: ingredient.unitOfMeasure?.id ?? "",
  quantityOfIngredient: +ingredient.quantityOfIngredient,
  type: ingredient.ingredient.type,
  isTopping: ingredient.isTopping ?? false,
  extraCost: ingredient.extraCost ?? 0,
});

export const useProductStore = create<ProductState>((set) => {
  // Conectar al servicio centralizado de WebSocket
  const socket = webSocketService.connect();

  socket.on("connect", () => {
    console.log("✅ Conectado a WebSocket - Productos");
  });

  webSocketService.on("productCreated", (data) => {
    set((state) => {
      const exists = state.products.some((product) => product.id === data.id);
      if (!exists) {
        const parsedProduct = {
          ...data,
          promotionDetails: data.promotionDetails ?? null,
        };

        return { products: [...state.products, parsedProduct] };
      }
      return state;
    });
  });

  webSocketService.on("productUpdated", (data) => {
    set((state) => ({
      products: state.products.map((product) =>
        product.id === data.id ? data : product
      ),
    }));
  });

  webSocketService.on("productDeleted", (data) => {
    set((state) => ({
      products: state.products.filter((product) => product.id !== data.id),
    }));
  });

  socket.on("disconnect", () => {
    console.log("❌ Desconectado del servidor WebSocket - Productos");
  });

  return {
    products: [],
    setProducts: (products) => set({ products }),

    addProduct: (product) => {
      set((state) => ({ products: [...state.products, product] }));
    },
    removeProduct: (id) =>
      set((state) => ({
        products: state.products.filter((product) => product.id !== id),
      })),
    updateProduct: (updatedProduct) => {
      set((state) => ({
        products: state.products.map((product) =>
          product.id === updatedProduct.id ? updatedProduct : product
        ),
      }));
    },
    connectWebSocket: () => {
      // La conexión se establece automáticamente al cargar el store
      webSocketService.connect();
    },
  };
});
