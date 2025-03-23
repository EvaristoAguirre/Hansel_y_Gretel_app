import { create } from "zustand";
import { io } from "socket.io-client";
import { ICategory } from "../Interfaces/ICategories";
import { ProductCreated, ProductResponse, ProductState } from "../Interfaces/IProducts";

const parseCategories = (categories: ICategory[]): string[] =>
  categories.map((category) => category.id);

export const useProductStore = create<ProductState>((set) => {
  const socket = io("http://192.168.100.133:3000"); // Usa la IP de tu backend

  socket.on("connect", () => {
    console.log("✅ Conectado a WebSocket - Products");
  });

  socket.on("productCreated", (data) => {
    console.log("🟢 Nuevo producto creado:", data);
    set((state) => ({ products: [...state.products, data] }));
  });

  socket.on("productUpdated", (data) => {
    console.log("🟡 Producto actualizado:", data);
    set((state) => ({
      products: state.products.map((product) =>
        product.id === data.id ? data : product
      ),
    }));
  });

  socket.on("productDeleted", (data) => {
    console.log("🔴 Producto eliminado:", data);
    set((state) => ({
      products: state.products.filter((product) => product.id !== data.id),
    }));
  });

  socket.on("disconnect", () => {
    console.log("❌ Desconectado del servidor WebSocket - Products");
  });

  return {
    products: [],
    setProducts: (products) => {
      const parsedProduct = products.map((product: ProductResponse) => ({
        ...product,
        categories: parseCategories(product.categories),
        productIngredients: product.productIngredients.map((ingredient) => ({
          name: ingredient.ingredient.name,
          ingredientId: ingredient.id,
          unitOfMeasureId: ingredient.unitOfMeasure.id ?? '',
          quantityOfIngredient: ingredient.quantityOfIngredient,
        })),
      }));
      set({ products: parsedProduct });
    },
    addProduct: (product) => {
      const parsedProduct: ProductCreated = {
        ...product,
        categories: parseCategories(product.categories),
        productIngredients: product.productIngredients.map((ingredient) => ({
          name: ingredient.ingredient.name,
          ingredientId: ingredient.id,
          unitOfMeasureId: ingredient.unitOfMeasure.id ?? '',
          quantityOfIngredient: ingredient.quantityOfIngredient,
        })),
        promotionDetails: product.promotionDetails,
      };
      set((state) => ({ products: [...state.products, parsedProduct] }));
    },
    removeProduct: (id) =>
      set((state) => ({
        products: state.products.filter((product) => product.id !== id),
      })),
    updateProduct: (updatedProduct) => {
      const parsedProduct: ProductCreated = {
        ...updatedProduct,
        categories: parseCategories(updatedProduct.categories),
        productIngredients: updatedProduct.productIngredients.map((ingredient) => ({
          name: ingredient.ingredient.name,
          ingredientId: ingredient.id,
          unitOfMeasureId: ingredient.unitOfMeasure.id ?? '',
          quantityOfIngredient: ingredient.quantityOfIngredient,
        })),
        promotionDetails: updatedProduct.promotionDetails,
      };
      set((state) => ({
        products: state.products.map((product) =>
          product.id === parsedProduct.id ? parsedProduct : product
        ),
      }));
    },
    connectWebSocket: () => {}, // La conexión se establece al cargar el store
  };
});
