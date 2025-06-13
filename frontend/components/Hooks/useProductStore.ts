// import { create } from "zustand";
// import { ICategory } from "../Interfaces/ICategories";
// import { ProductCreated, ProductResponse, ProductState } from "../Interfaces/IProducts";

// const parseCategories = (categories: ICategory[]): string[] =>
//   categories.map((category) => (
//     category.id
//   ));

// export const useProductStore = create<ProductState>((set) => ({
//   products: [],
//   setProducts: (products) => {
//     // Se parsean las categorías para setear solo el ID
//     const parsedProduct = products.map((product: any) => ({
//       ...product,
//       categories: parseCategories(product.categories)
//     }));

//     return set({ products: parsedProduct });
//   },
//   addProduct: (product) => {
//     const parsedProduct: ProductCreated = {
//       ...product,
//       categories: parseCategories(product.categories),
//       productIngredients: product.productIngredients.map((ingredient) => ({
//         name: ingredient.ingredient.name,
//         ingredientId: ingredient.id,
//         unitOfMeasureId: ingredient.unitOfMeasure.id ?? '',
//         quantityOfIngredient: ingredient.quantityOfIngredient,
//       })),
//       promotionDetails: product.promotionDetails
//     };

//     return set((state) => ({ products: [...state.products, parsedProduct] }));
//   },
//   removeProduct: (id) =>
//     set((state) => ({
//       products: state.products.filter((product) => product.id !== id),
//     })),
//   updateProduct: (updatedProduct) => {
//     const parsedProduct: ProductCreated = {
//       ...updatedProduct,
//       categories: parseCategories(updatedProduct.categories),
//       productIngredients: updatedProduct.productIngredients.map((ingredient) => ({
//         name: ingredient.ingredient.name,
//         ingredientId: ingredient.id,
//         unitOfMeasureId: ingredient.unitOfMeasure.id ?? '',
//         quantityOfIngredient: ingredient.quantityOfIngredient,
//       })),
//       promotionDetails: updatedProduct.promotionDetails
//     };

//     return set((state) => ({
//       products: state.products.map((product) =>
//         product.id === parsedProduct.id ? parsedProduct : product
//       ),
//     }));
//   },
//   connectWebSocket: () => {
//     const socket = new WebSocket("ws://localhost:3000");

//     socket.onmessage = (event) => {
//       const { action, data } = JSON.parse(event.data);

//       set((state) => {
//         switch (action) {
//           case "product.created":
//             return { products: [...state.products, data] };
//           case "product.deleted":
//             return {
//               products: state.products.filter((prod) => prod.id !== data.id),
//             };
//           case "product.updated":
//             return {
//               products: state.products.map((prod) =>
//                 prod.id === data.id ? data : prod
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
import { io } from "socket.io-client";
import { ICategory } from "../Interfaces/ICategories";
import { ProductCreated, ProductResponse, ProductState } from "../Interfaces/IProducts";

const parseCategories = (categories: ICategory[]): string[] =>
  categories.map((category) => category.id).filter((id): id is string => id !== null && id !== undefined);

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
        const parsedProduct: ProductCreated = {
          ...data,
          categories: parseCategories(data.categories),
          productIngredients: data.productIngredients && data.productIngredients.length > 0
            ? data.productIngredients.map((ingredient: any) => ({
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
      const parsedProduct = products.map((product: ProductResponse) => ({
        ...product,
        categories: parseCategories(product.categories),
        productIngredients: product.productIngredients.length > 0
          ? product.productIngredients.map((ingredient) => ({
              name: ingredient.ingredient.name,
              ingredientId: ingredient.ingredient.id,
              unitOfMeasureId: ingredient.unitOfMeasure.id ?? '',
              quantityOfIngredient: ingredient.quantityOfIngredient,
            }))
          : [],
      }));
      set({ products: parsedProduct });
    },
    addProduct: (product) => {
      const parsedProduct: ProductCreated = {
        ...product,
        categories: parseCategories(product.categories),
        productIngredients: product.productIngredients.length > 0 && product.productIngredients.map((ingredient) => ({
          name: ingredient.ingredient.name,
          ingredientId: ingredient.ingredient.id,
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
        productIngredients: updatedProduct.productIngredients && updatedProduct.productIngredients.length > 0
          ? updatedProduct.productIngredients.map((ingredient) => ({
            name: ingredient?.ingredient.name,
            ingredientId: ingredient?.ingredient.id,
            unitOfMeasureId: ingredient?.unitOfMeasure.id ?? '',
            quantityOfIngredient: ingredient?.quantityOfIngredient,
          }))
          : null,
        promotionDetails: updatedProduct.promotionDetails ? updatedProduct.promotionDetails : null,
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
