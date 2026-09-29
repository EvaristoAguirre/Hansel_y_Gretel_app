import {
  IingredientForm,
  IingredientResponse,
} from "../Interfaces/Ingredients";
import { create } from "zustand";
import { ICategory } from "../Interfaces/ICategories";
import { ProductState } from "../Interfaces/IProducts";
import { webSocketService } from "@/services/websocket.service";
import { patchStockQuantity, StockChange } from "./stockSnapshot";

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

let productListenersBound = false;

export const useProductStore = create<ProductState>((set) => {
  const bindProductListeners = () => {
    if (productListenersBound) return;
    productListenersBound = true;

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

    const applyStockChanges = (payload: { stocks?: StockChange[] }) => {
      const stocks = payload?.stocks ?? [];
      if (!stocks.length) return;
      set((state) => ({
        products: patchStockQuantity(state.products, stocks, (product, stock) =>
          stock.productId === product.id || stock.id === product.stock?.id
        ),
      }));
    };

    webSocketService.on("stock.created", applyStockChanges);
    webSocketService.on("stock.updated", applyStockChanges);
    webSocketService.on("stock.deducted", applyStockChanges);
    webSocketService.on("stock.restored", applyStockChanges);

    socket.on("disconnect", () => {
      console.log("❌ Desconectado del servidor WebSocket - Productos");
    });
  };

  return {
    products: [],
    error: null,
    setProducts: (products) => set({ products }),
    setError: (msg) => set({ error: msg }),

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
      webSocketService.connect();
      bindProductListeners();
    },
  };
});
