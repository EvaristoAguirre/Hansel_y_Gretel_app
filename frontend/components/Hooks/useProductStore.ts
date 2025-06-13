import { IingredientForm, IingredientResponse } from '../Interfaces/Ingredients';
import { create } from "zustand";
import { io } from "socket.io-client";
import { ICategory } from "../Interfaces/ICategories";
import { ProductCreated, ProductState } from "../Interfaces/IProducts";

const parseCategories = (categories: ICategory[]): string[] =>
  categories.map((category) => category.id);

const mapIngredientResponseToForm = (
  ingredient: IingredientResponse
): IingredientForm => ({
  name: ingredient.ingredient.name,
  ingredientId: ingredient.ingredient.id ?? "",
  unitOfMeasureId: ingredient.unitOfMeasure?.id ?? "",
  quantityOfIngredient: ingredient.quantityOfIngredient,
  type: ingredient.ingredient.type,
  isTopping: ingredient.isTopping ?? false,
  extraCost: ingredient.extraCost ?? 0,
});

export const useProductStore = create<ProductState>((set) => {
  const socket = io("http://localhost:3000"); // Usa la IP de tu backend

  socket.on("connect", () => {
    console.log("✅ Conectado a WebSocket - Products");
  });

  socket.on("productCreated", (data) => {
    console.log("🟢 Nuevo producto creado:", data);
    set((state) => {
      const exists = state.products.some((product) => product.id === data.id);
      if (!exists) {
        const parsedProduct = {
          ...data,
          categories: parseCategories(data.categories),
          productIngredients: data.productIngredients && data.productIngredients.length > 0
            ? data.productIngredients.map((ingredient: IingredientResponse) => ({
              name: ingredient.ingredient.name,
              ingredientId: ingredient.ingredient.id,
              unitOfMeasureId: ingredient.unitOfMeasure?.id ?? '',
              quantityOfIngredient: ingredient.quantityOfIngredient,
            }))
            : [],
          promotionDetails: data.promotionDetails ?? null,
        };

        return { products: [...state.products, parsedProduct] };
      }
      return state;
    });
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
      const parsedProducts: ProductCreated[] = products.map((product) => ({
        ...product,
        categories: parseCategories(product.categories),
        productIngredients: product.productIngredients?.map(mapIngredientResponseToForm) ?? [],
        promotionDetails: product.promotionDetails ?? null,
      }));
      set({ products: parsedProducts });
    },
    addProduct: (product) => {
      const parsedProduct: ProductCreated = {
        ...product,
        categories: parseCategories(product.categories),
        productIngredients: product.productIngredients?.map(mapIngredientResponseToForm) ?? [],
        promotionDetails: product.promotionDetails ?? null,
        stock: product.stock ?? null,
        allowsToppings: product.allowsToppings ?? false,
        toppingsSettings: product.toppingsSettings ?? null,

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
        productIngredients: updatedProduct.productIngredients?.map(mapIngredientResponseToForm) ?? [],
        promotionDetails: updatedProduct.promotionDetails ?? null,
      };
      set((state) => ({
        products: state.products.map((product) =>
          product.id === parsedProduct.id ? parsedProduct : product
        ),
      }));
      console.log("✅ Producto actualizado:", parsedProduct);
    },
    connectWebSocket: () => { }, // La conexión se establece al cargar el store
  };
});
