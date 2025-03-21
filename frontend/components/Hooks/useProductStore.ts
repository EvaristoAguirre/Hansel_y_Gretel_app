import { create } from "zustand";
import { ICategory } from "../Interfaces/ICategories";
import { ProductCreated, ProductResponse, ProductState } from "../Interfaces/IProducts";

const parseCategories = (categories: ICategory[]): string[] =>
  categories.map((category) => (
    category.id
  ));

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  setProducts: (products) => {
    // Se parsean las categorías para setear solo el ID
    const parsedProduct = products.map((product: any) => ({
      ...product,
      categories: parseCategories(product.categories)
    }));

    return set({ products: parsedProduct });
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
      promotionDetails: product.promotionDetails
    };

    return set((state) => ({ products: [...state.products, parsedProduct] }));
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
      promotionDetails: updatedProduct.promotionDetails
    };

    return set((state) => ({
      products: state.products.map((product) =>
        product.id === parsedProduct.id ? parsedProduct : product
      ),
    }));
  },
  connectWebSocket: () => {
    const socket = new WebSocket("ws://localhost:3000");

    socket.onmessage = (event) => {
      const { action, data } = JSON.parse(event.data);

      set((state) => {
        switch (action) {
          case "product.created":
            return { products: [...state.products, data] };
          case "product.deleted":
            return {
              products: state.products.filter((prod) => prod.id !== data.id),
            };
          case "product.updated":
            return {
              products: state.products.map((prod) =>
                prod.id === data.id ? data : prod
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
